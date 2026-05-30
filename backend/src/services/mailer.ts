import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    const from = process.env.SMTP_FROM || 'noreply@groceryexpirytracker.com';
    
    // Fallback Mock Logger if SMTP keys are not present
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('\n===== [MOCK EMAIL SERVICE] =====');
      console.log(`TO      : ${to}`);
      console.log(`SUBJECT : ${subject}`);
      console.log(`BODY    : ${html.replace(/<[^>]*>/g, '').substring(0, 300).trim()}...`);
      console.log('=================================\n');
      return true;
    }

    await transporter.sendMail({
      from,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
