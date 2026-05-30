import { Response } from 'express';
import { AuthRequest } from '../types';
import Notification from '../models/Notification';
import PushSubscription from '../models/PushSubscription';
import { sendSuccess, sendError } from '../utils/responses';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'User identity not found', 401);
    }

    const notifications = await Notification.find({ userId })
      .sort({ sentAt: -1 })
      .limit(50); // limit to last 50 alerts

    return sendSuccess(res, notifications, 'Notifications fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'User identity not found', 401);
    }

    await Notification.updateMany(
      { userId, status: 'unread' },
      { $set: { status: 'read' } }
    );

    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const subscribePush = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { subscription } = req.body;

    if (!userId) {
      return sendError(res, 'User identity not found', 401);
    }

    if (!subscription) {
      return sendError(res, 'Push subscription details are required', 400);
    }

    // Check if subscription already exists for this user to avoid duplicates
    const existing = await PushSubscription.findOne({ 
      userId, 
      'subscription.endpoint': subscription.endpoint 
    });

    if (!existing) {
      await PushSubscription.create({
        userId,
        subscription
      });
    }

    return sendSuccess(res, null, 'Push notification subscription registered successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};
