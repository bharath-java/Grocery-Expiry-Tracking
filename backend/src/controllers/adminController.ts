import { Request, Response } from 'express';
import User from '../models/User';
import Grocery from '../models/Grocery';
import Notification from '../models/Notification';
import { runExpiryCheck } from '../cron/reminderCron';
import { sendSuccess, sendError } from '../utils/responses';

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ verified: true });
    
    const expiredCount = await Grocery.countDocuments({ status: 'Expired' });
    const expiringSoonCount = await Grocery.countDocuments({ status: 'Expiring Soon' });
    const goodCount = await Grocery.countDocuments({ status: 'Fresh' });
    
    const totalNotifications = await Notification.countDocuments();

    // Construct activity logs by joining recent groceries and users
    const recentGroceries = await Grocery.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const activityLogs = [
      ...recentUsers.map(u => ({
        timestamp: u.createdAt,
        type: 'user_register',
        message: `New user registered: ${u.name} (${u.email})`
      })),
      ...recentGroceries.map(g => ({
        timestamp: g.createdAt,
        type: 'grocery_added',
        message: `Grocery item added: "${g.itemName}" by ${(g.userId as any)?.name || 'Unknown'}`
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

    return sendSuccess(res, {
      kpis: {
        totalUsers,
        activeUsers,
        totalNotifications,
        expiredCount,
        expiringSoonCount,
        goodCount
      },
      activityLogs
    }, 'Admin metrics gathered successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return sendSuccess(res, users, 'Users lists fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return sendError(res, 'Invalid role specified', 400);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { role } },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, updatedUser, 'User role updated successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const triggerSystemCron = async (req: Request, res: Response) => {
  try {
    console.log('Manual Cron execution triggered by Administrator');
    
    // Call the cron function
    const result = await runExpiryCheck();
    
    return sendSuccess(
      res, 
      result, 
      `Scan completed successfully. Processed ${result.processedCount} users and dispatched ${result.alertsSent} notifications.`
    );
  } catch (error: any) {
    return sendError(res, error.message);
  }
};
