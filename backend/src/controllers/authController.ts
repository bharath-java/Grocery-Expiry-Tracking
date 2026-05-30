import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import OTP from '../models/OTP';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { sendEmail } from '../services/mailer';
import { sendSuccess, sendError } from '../utils/responses';

// Helper to generate a 6-digit numeric OTP string
const generateNumericOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'User already exists with this email address', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verified: true
    });

    const accessToken = generateToken(user._id.toString(), user.email, user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    return sendSuccess(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        verified: user.verified
      },
      accessToken,
      refreshToken
    }, 'Registration successful', 201);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp, type } = req.body;

  try {
    const record = await OTP.findOne({ email, otp, type });
    if (!record) {
      return sendError(res, 'Invalid OTP or OTP has expired', 400);
    }

    if (new Date() > record.expiresAt) {
      await OTP.deleteOne({ _id: record._id });
      return sendError(res, 'OTP has expired', 400);
    }

    // OTP is valid
    if (type === 'register') {
      const user = await User.findOneAndUpdate(
        { email },
        { verified: true },
        { new: true }
      );

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      await OTP.deleteOne({ _id: record._id });

      const accessToken = generateToken(user._id.toString(), user.email, user.role);
      const refreshToken = generateRefreshToken(user._id.toString());

      return sendSuccess(res, {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          verified: user.verified
        },
        accessToken,
        refreshToken
      }, 'Email verified successfully', 200);
    } else {
      // For password reset, keep the OTP verified status or proceed
      return sendSuccess(res, { email, verified: true }, 'OTP verified successfully. You can now reset your password.');
    }
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    if (!user.verified) {
      return sendError(res, 'Your email is not verified. Please register again to receive OTP.', 403);
    }

    if (!user.password) {
      return sendError(res, 'Account was created using social login. Please login using Google.', 400);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const accessToken = generateToken(user._id.toString(), user.email, user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    return sendSuccess(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        verified: user.verified
      },
      accessToken,
      refreshToken
    }, 'Login successful');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'No account found with this email address', 404);
    }

    return sendSuccess(res, { email }, 'Password reset initiated. You can now reset your password directly.');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.verified = true; // Ensure verified
    await user.save();

    return sendSuccess(res, null, 'Password reset successful. You can now login with your new password.');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  const { name, email, avatar, googleId } = req.body;

  try {
    // Verified Google OAuth verification mock
    // Find or create User
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: avatar || '',
        verified: true,
        role: 'user'
      });
    } else {
      // Sync avatar if empty
      if (!user.avatar) {
        user.avatar = avatar || '';
        await user.save();
      }
    }

    const accessToken = generateToken(user._id.toString(), user.email, user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    return sendSuccess(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        verified: user.verified
      },
      accessToken,
      refreshToken
    }, 'Google authentication successful');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const logout = async (req: Request, res: Response) => {
  return sendSuccess(res, null, 'Logged out successfully');
};
