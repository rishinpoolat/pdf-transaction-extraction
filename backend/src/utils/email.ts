import { Resend } from 'resend';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ email, subject, message }: EmailOptions): Promise<void> => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: email,
      subject: subject,
      html: message,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data?.id);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Email templates
export const otpEmailTemplate = (otp: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .otp-box { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Verify Your Email</h2>
        <p>Thank you for signing up! Please use the following OTP to verify your email address:</p>
        <div class="otp-box">${otp}</div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <div class="footer">
          <p>PDF Transaction Extraction App</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const resetPasswordEmailTemplate = (resetLink: string, userName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Reset Your Password</h2>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <a href="${resetLink}" class="button">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <div class="footer">
          <p>PDF Transaction Extraction App</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
