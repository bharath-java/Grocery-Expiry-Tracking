import cron from 'node-cron';
import Grocery from '../models/Grocery';
import User from '../models/User';
import Notification from '../models/Notification';
import PushSubscription from '../models/PushSubscription';
import { sendEmail } from '../services/mailer';
import { sendPushNotification } from '../services/pushNotification';

export interface ExpiryCheckResult {
  processedCount: number;
  alertsSent: number;
}

export const runExpiryCheck = async (): Promise<ExpiryCheckResult> => {
  console.log('--- Starting Daily Grocery Expiry Check ---');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeGroceries = await Grocery.find({ archived: false }).populate('userId');
  
  // Group notifications by userId
  const userAlertMap: Record<string, { user: any; items: { name: string; daysLeft: number; status: string }[] }> = {};
  let alertsCount = 0;

  for (const item of activeGroceries) {
    const user = item.userId as any;
    if (!user) continue;

    const expDate = new Date(item.expiryDate);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let alertCondition = false;
    let message = '';
    let title = '';

    if (diffDays === 0) {
      alertCondition = true;
      title = 'Grocery Expired!';
      message = `Your grocery item "${item.itemName}" expires today! Please consume or discard it.`;
    } else if (diffDays === 1) {
      alertCondition = true;
      title = 'Expiring Tomorrow!';
      message = `Your grocery item "${item.itemName}" expires tomorrow. Plan to use it soon!`;
    } else if (diffDays === 3) {
      alertCondition = true;
      title = 'Expiring in 3 Days!';
      message = `Your grocery item "${item.itemName}" will expire in 3 days.`;
    } else if (diffDays === 7) {
      alertCondition = true;
      title = 'Expiring in 7 Days!';
      message = `Your grocery item "${item.itemName}" will expire in a week (7 days).`;
    }

    if (alertCondition) {
      // 1. Create a notification in Database
      await Notification.create({
        userId: user._id,
        groceryId: item._id,
        title,
        message,
        type: 'expiry',
        status: 'unread'
      });

      // 2. Add to User Digest Group for email sending
      const userIdStr = user._id.toString();
      if (!userAlertMap[userIdStr]) {
        userAlertMap[userIdStr] = { user, items: [] };
      }
      userAlertMap[userIdStr].items.push({
        name: item.itemName,
        daysLeft: diffDays,
        status: diffDays === 0 ? 'Expired' : 'Expiring Soon'
      });

      // 3. Try to send Browser Push Notification
      const pushSubscriptions = await PushSubscription.find({ userId: user._id });
      for (const pushSub of pushSubscriptions) {
        await sendPushNotification(pushSub.subscription, {
          title,
          body: message
        });
      }

      alertsCount++;
    }
  }

  // Send aggregated email digests to each user to avoid spamming multiple emails!
  for (const userId of Object.keys(userAlertMap)) {
    const { user, items } = userAlertMap[userId];
    
    let itemsListHtml = '';
    for (const item of items) {
      const color = item.status === 'Expired' ? '#EF5350' : '#FF9800';
      const daysText = item.daysLeft === 0 
        ? 'EXPIRES TODAY' 
        : item.daysLeft === 1 
          ? 'EXPIRES TOMORROW' 
          : `Expires in ${item.daysLeft} days`;

      itemsListHtml += `
        <tr style="border-bottom: 1px solid #eeeeee;">
          <td style="padding: 10px; font-weight: bold; color: #1a1a1a;">${item.name}</td>
          <td style="padding: 10px; font-weight: bold; color: ${color};">${daysText}</td>
        </tr>
      `;
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; max-width: 600px; margin: 0 auto; border: 1px solid #e8f5e9; border-radius: 8px;">
        <h2 style="color: #2E7D32; border-bottom: 2px solid #2E7D32; padding-bottom: 10px; margin-top: 0;">Grocery Expiry Digest</h2>
        <p>Hi ${user.name},</p>
        <p>This is a quick summary of your groceries that require immediate attention:</p>
        <table style="width: 100%; border-collapse: collapse; text-align: left; margin: 20px 0;">
          <thead>
            <tr style="background-color: #E8F5E9; color: #2E7D32;">
              <th style="padding: 10px;">Item Name</th>
              <th style="padding: 10px;">Expiry Status</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
        </table>
        <p>Consuming your food in time saves money and reduces waste!</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
             style="background-color: #2E7D32; color: #ffffff; text-decoration: none; padding: 10px 25px; border-radius: 20px; font-weight: bold; display: inline-block;">
             Open Dashboard
          </a>
        </div>
        <p style="font-size: 12px; color: #757575;">This is an automated reminder from your Grocery Expiry Tracker. You can configure notification settings in your profile.</p>
      </div>
    `;

    await sendEmail(user.email, 'Action Required: Grocery Expiry Reminder!', emailHtml);
  }

  console.log(`--- Expiry Check Completed. Dispatched ${alertsCount} notifications. ---`);
  return {
    processedCount: activeGroceries.length,
    alertsSent: alertsCount
  };
};

export const initCron = () => {
  // Schedule to run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      await runExpiryCheck();
    } catch (err) {
      console.error('Error running automated cron expiry check:', err);
    }
  });
  console.log('Automated Cron Expiry reminders scheduled daily at 9:00 AM');
};
