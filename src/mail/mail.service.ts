import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationLink = `${process.env.APP_URL}/verify-email?token=${token}`;
    console.log(`[DEV ONLY] Verification Link: ${verificationLink}`);

    // Skip actual email sending in test environment
    if (process.env.NODE_ENV === 'test') {
      console.log(`[TEST] Skipping email send to ${email}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Verify your email - BiziFlow',
        html: `
          <h2>Welcome to BiziFlow</h2>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verificationLink}">Verify Email</a>
          <p>This link will expire in 15 minutes.</p>
        `,
      });
      console.log(`Verification email sent to ${email}`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
