import webpush from 'web-push';

let isPushConfigured = false;

export const initPush = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@groceryexpirytracker.com';

  if (publicKey && privateKey) {
    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      isPushConfigured = true;
      console.log('Web Push VAPID keys configured successfully');
    } catch (err) {
      console.error('Failed to set VAPID details:', err);
    }
  } else {
    console.log('Web Push VAPID keys missing. Push notifications disabled (mock logs active).');
  }
};

export const sendPushNotification = async (
  subscription: any, 
  payload: { title: string; body: string; icon?: string }
) => {
  if (!isPushConfigured) {
    console.log('\n===== [MOCK PUSH NOTIFICATION] =====');
    console.log(`TO SUB : ${JSON.stringify(subscription).substring(0, 100)}...`);
    console.log(`TITLE  : ${payload.title}`);
    console.log(`BODY   : ${payload.body}`);
    console.log('====================================\n');
    return;
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};
