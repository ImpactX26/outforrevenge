import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface LoginMetadata {
  ip?: string;
  userAgent?: string;
  timestamp?: Date;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string = '"Nexora" <no-reply@nexora.de>';

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;

    const host = process.env.MAIL_HOST || 'smtp.gmail.com';
    const user = process.env.MAIL_USER || 'nexora.hackathon699@gmail.com';
    const rawPass = process.env.MAIL_PASSWORD || 'dcge edfm qxay pbil';
    const pass = rawPass.replace(/\s+/g, '');

    this.fromAddress = process.env.MAIL_FROM || `"Nexora" <${user}>`;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false,
        },
      });

      this.transporter.verify((err) => {
        if (err) {
          this.logger.warn(`Mail transporter verification failed: ${err.message}`);
        } else {
          this.logger.log(`✓ Mail service ready. Connected via Gmail (${user})`);
        }
      });
    } else {
      this.logger.warn('Mail credentials not provided. Outgoing emails will only be logged.');
    }

    return this.transporter;
  }

  /**
   * Send 6-Digit One-Time Password Email
   */
  async sendOtpEmail(email: string, code: string, purpose: 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'): Promise<boolean> {
    const purposeTitles: Record<string, { subject: string; heading: string; desc: string }> = {
      LOGIN: {
        subject: 'Nexora ? Your Login Verification Code',
        heading: 'Sign In Verification Code',
        desc: 'Use the following 6-digit one-time code to securely sign in to your Nexora account.',
      },
      REGISTER: {
        subject: 'Nexora ? Verify Your Email Address',
        heading: 'Welcome to Nexora ? Confirm Your Email',
        desc: 'Thank you for starting your Germany journey with Nexora. Use this code to verify your email address.',
      },
      FORGOT_PASSWORD: {
        subject: 'Nexora ? Password Reset Verification Code',
        heading: 'Password Recovery Code',
        desc: 'We received a request to reset your Nexora account password. Use this code to choose a new password.',
      },
    };

    const info = purposeTitles[purpose] || {
      subject: 'Nexora ? Your One-Time Password',
      heading: 'Verification Code',
      desc: 'Use the 6-digit code below to proceed with your Nexora verification.',
    };

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0b1120; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #2563eb, #6366f1); padding: 24px 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">Nexora</h1>
          <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Your Intelligent Journey to Germany</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="margin: 0 0 12px 0; color: #ffffff; font-size: 19px; font-weight: 700;">${info.heading}</h2>
          <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">${info.desc}</p>
          
          <div style="text-align: center; margin: 28px 0; padding: 20px; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px;">
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #38bdf8; margin-bottom: 8px;">Your 6-Digit Code</div>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 0.25em; color: #ffffff; font-family: 'Courier New', monospace;">${code}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Valid for 10 minutes ? Do not share with anyone</div>
          </div>

          <p style="margin: 20px 0 0 0; color: #64748b; font-size: 13px; line-height: 1.5;">
            If you did not request this verification code, you can safely ignore this email. Someone may have entered your email address by mistake.
          </p>
        </div>
        <div style="padding: 16px 28px; background: #070d19; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b;">
          &copy; ${new Date().getFullYear()} Nexora. In collaboration with Educaro Deutschland GmbH.
        </div>
      </div>
    `;

    return this.sendMail(email, info.subject, html, `Your Nexora verification code is: ${code}`);
  }

  /**
   * Send Account Registration Success Email
   */
  async sendRegistrationSuccessEmail(email: string, firstName: string): Promise<boolean> {
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    const subject = 'Welcome to Nexora ? Your Journey to Germany Begins!';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0b1120; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #2563eb, #6366f1); padding: 24px 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">Nexora</h1>
          <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Your Intelligent Journey to Germany</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="margin: 0 0 12px 0; color: #ffffff; font-size: 19px; font-weight: 700;">Account Successfully Created</h2>
          <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">${greeting}</p>
          <p style="margin: 0 0 16px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
            Welcome to Nexora! Your account has been registered and initialized with our autonomous qualification pipeline.
          </p>

          <div style="margin: 20px 0; padding: 18px; background: rgba(30, 41, 59, 0.6); border: 1px solid #334155; border-radius: 10px;">
            <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 8px;">Next steps on your journey:</div>
            <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13px; line-height: 1.7;">
              <li>Complete your applicant profile and target pathway</li>
              <li>Upload your academic transcripts & language certificates</li>
              <li>Receive real-time German statutory qualification & Anabin match</li>
              <li>Access verified opportunities and Educaro partner programs</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 26px 0 12px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">
              Access Your Dashboard &rarr;
            </a>
          </div>
        </div>
        <div style="padding: 16px 28px; background: #070d19; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b;">
          &copy; ${new Date().getFullYear()} Nexora. In collaboration with Educaro Deutschland GmbH.
        </div>
      </div>
    `;

    return this.sendMail(email, subject, html, `Welcome to Nexora, ${firstName}! Your account is ready.`);
  }

  /**
   * Send Successful Login / New Device Notification Email
   */
  async sendLoginSuccessEmail(email: string, firstName: string, meta?: LoginMetadata): Promise<boolean> {
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    const subject = 'Nexora ? Successful Login to Your Account';
    const timestampStr = (meta?.timestamp || new Date()).toUTCString();
    const deviceStr = meta?.userAgent || 'Web Browser';
    const ipStr = meta?.ip || 'Direct Connection';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0b1120; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #2563eb, #6366f1); padding: 24px 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">Nexora</h1>
          <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Account Security Alert</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="margin: 0 0 12px 0; color: #ffffff; font-size: 19px; font-weight: 700;">Successful Sign-In Detected</h2>
          <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">${greeting}</p>
          <p style="margin: 0 0 18px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
            We noticed a successful sign-in to your Nexora account with the following session details:
          </p>

          <div style="padding: 16px; background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 8px; font-size: 13px; line-height: 1.7; color: #cbd5e1;">
            <div><strong style="color: #94a3b8;">Time (UTC):</strong> ${timestampStr}</div>
            <div><strong style="color: #94a3b8;">Device / Client:</strong> <span style="font-family: monospace; font-size: 12px; color: #e2e8f0;">${deviceStr.slice(0, 100)}</span></div>
            <div><strong style="color: #94a3b8;">IP Address:</strong> <span style="font-family: monospace; font-size: 12px; color: #e2e8f0;">${ipStr}</span></div>
          </div>

          <p style="margin: 20px 0 0 0; color: #64748b; font-size: 13px; line-height: 1.5;">
            If this was you, you do not need to take any action. If you did not sign in or suspect unauthorized access, please reset your password immediately via the Nexora portal.
          </p>
        </div>
        <div style="padding: 16px 28px; background: #070d19; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b;">
          &copy; ${new Date().getFullYear()} Nexora. In collaboration with Educaro Deutschland GmbH.
        </div>
      </div>
    `;

    return this.sendMail(email, subject, html, `Nexora account sign-in detected at ${timestampStr}`);
  }

  /**
   * Send Password Reset Success Confirmation Email
   */
  async sendPasswordResetSuccessEmail(email: string, firstName: string): Promise<boolean> {
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    const subject = 'Nexora ? Your Password Has Been Changed';
    const timestampStr = new Date().toUTCString();

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0b1120; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #2563eb, #6366f1); padding: 24px 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">Nexora</h1>
          <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Security Notice</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="margin: 0 0 12px 0; color: #ffffff; font-size: 19px; font-weight: 700;">Password Successfully Changed</h2>
          <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">${greeting}</p>
          <p style="margin: 0 0 16px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
            The password for your Nexora account (${email}) was successfully changed on <strong>${timestampStr}</strong>.
          </p>

          <div style="padding: 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; font-size: 13px; line-height: 1.6; color: #34d399;">
            All previous active sessions have been safely invalidated. You can now sign in using your new password.
          </div>

          <p style="margin: 22px 0 0 0; color: #ef4444; font-size: 13px; line-height: 1.5;">
            <strong>Important:</strong> If you did not make this change, please contact support immediately or use the Forgot Password recovery flow to secure your account.
          </p>
        </div>
        <div style="padding: 16px 28px; background: #070d19; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b;">
          &copy; ${new Date().getFullYear()} Nexora. In collaboration with Educaro Deutschland GmbH.
        </div>
      </div>
    `;

    return this.sendMail(email, subject, html, `Your Nexora account password was successfully changed at ${timestampStr}.`);
  }

  private async sendMail(to: string, subject: string, html: string, text: string): Promise<boolean> {
    const transporter = this.initTransporter();
    if (!transporter) {
      this.logger.warn(`[Mail Simulation] Outgoing email to ${to} skipped because mail transporter is not initialized.`);
      return false;
    }

    try {
      const sendPromise = transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
        text,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP timeout - host firewall dropped connection')), 25000),
      );

      const info: any = await Promise.race([sendPromise, timeoutPromise]);
      this.logger.log(`? Email delivered to ${to} [${subject}]: messageId=${info?.messageId}`);
      return true;
    } catch (err: any) {
      this.logger.warn(`Failed to send email to ${to}: ${err.message}`);
      return false;
    }
  }
}
