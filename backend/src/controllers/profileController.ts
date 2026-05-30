import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../types';
import User from '../models/User';
import Grocery from '../models/Grocery';
import Archive from '../models/Archive';
import OTP from '../models/OTP';
import { sendEmail } from '../services/mailer';
import { uploadImage } from '../middleware/upload';
import { sendSuccess, sendError } from '../utils/responses';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, user, 'Profile fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, email } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return sendError(res, 'Email already in use by another account', 400);
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    if (req.file) {
      user.avatar = await uploadImage(req.file);
    }

    await user.save();
    
    // Remove password before returning
    const updatedUser = user.toObject();
    delete updatedUser.password;

    return sendSuccess(res, updatedUser, 'Profile updated successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (!user.password) {
      return sendError(res, 'This social account does not use a password. Set one by using reset-password.', 400);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect', 400);
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return sendSuccess(res, null, 'Password updated successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const backupData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'User identity not found', 401);
    }

    const groceries = await Grocery.find({ userId });
    const user = await User.findById(userId).select('name email role verified createdAt');

    const backupPayload = {
      backupDate: new Date(),
      version: '1.0.0',
      user,
      groceries
    };

    return sendSuccess(res, backupPayload, 'Data backup generated successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const restoreData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { groceries } = req.body;

    if (!userId) {
      return sendError(res, 'User identity not found', 401);
    }

    if (!groceries || !Array.isArray(groceries)) {
      return sendError(res, 'Invalid grocery backup array provided', 400);
    }

    // Insert imported groceries, mapping userId to current user
    const preparedGroceries = groceries.map((item: any) => ({
      userId,
      itemName: item.itemName || 'Restored Item',
      image: item.image || '',
      category: item.category || 'Others',
      quantity: item.quantity || '1 unit',
      purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : new Date(),
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: item.notes || '',
      status: item.status || 'Fresh',
      archived: item.archived || false
    }));

    // Clear user's existing active groceries first to prevent duplicates
    await Grocery.deleteMany({ userId });
    
    const restored = await Grocery.insertMany(preparedGroceries);

    // Emit Socket Update
    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('groceryUpdate', { userId });
    }

    return sendSuccess(res, { count: restored.length }, 'Data restored successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const sendProfileOTP = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await OTP.deleteMany({ email, type: 'reset' });
    await OTP.create({ email, otp: otpCode, expiresAt, type: 'reset' });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a;">
        <h2 style="color: #2E7D32;">Profile Security Verification</h2>
        <p>Please use the following 6-digit One-Time Password (OTP) to verify your identity:</p>
        <div style="background-color: #E8F5E9; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 8px; letter-spacing: 5px; color: #2E7D32; margin: 20px 0;">
          ${otpCode}
        </div>
        <p>This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail(email, 'Identity Verification - Grocery Expiry Tracker', emailHtml);
    return sendSuccess(res, null, 'OTP sent successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const verifyProfileOTP = async (req: AuthRequest, res: Response) => {
  try {
    const { email, otp } = req.body;
    const record = await OTP.findOne({ email, otp, type: 'reset' });
    
    if (!record) {
      return sendError(res, 'Invalid OTP or OTP has expired', 400);
    }

    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: record._id });
      return sendError(res, 'OTP has expired', 400);
    }

    await OTP.deleteOne({ _id: record._id });
    return sendSuccess(res, null, 'OTP verified successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const getArchives = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const archivedGroceries = await Grocery.find({ userId, archived: true });
    return sendSuccess(res, archivedGroceries, 'Archived items retrieved successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const restoreArchiveItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    const grocery = await Grocery.findOneAndUpdate(
      { _id: id, userId }, 
      { archived: false }, 
      { new: true }
    );
    
    if (!grocery) {
      return sendError(res, 'Grocery item not found', 404);
    }
    
    await Archive.deleteOne({ userId, groceryId: id });

    // Emit socket update
    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('groceryUpdate', { userId });
    }

    return sendSuccess(res, grocery, 'Item restored successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const deleteArchiveItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    const grocery = await Grocery.findOneAndDelete({ _id: id, userId });
    
    if (!grocery) {
      return sendError(res, 'Grocery item not found', 404);
    }
    
    await Archive.deleteOne({ userId, groceryId: id });

    // Emit socket update
    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('groceryUpdate', { userId });
    }

    return sendSuccess(res, null, 'Item permanently deleted');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const updateLanguage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { language } = req.body;
    const user = await User.findByIdAndUpdate(userId, { language }, { new: true }).select('-password');
    return sendSuccess(res, user, 'Language updated successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const updateTheme = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { theme } = req.body;
    const user = await User.findByIdAndUpdate(userId, { theme }, { new: true }).select('-password');
    return sendSuccess(res, user, 'Theme updated successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};
