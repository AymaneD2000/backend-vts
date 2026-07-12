import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

// Sends OTP email through standard SMTP. This works with a self-hosted mail
// server and does not require an email API/SaaS provider.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter?: Transporter;

  constructor(private readonly config: ConfigService) {
    if (this.config.get<string>('email.provider') === 'smtp') {
      const host = this.config.get<string>('email.host');
      if (host) {
        const user = this.config.get<string>('email.user');
        const password = this.config.get<string>('email.password');
        this.transporter = nodemailer.createTransport({
          host,
          port: this.config.get<number>('email.port') ?? 587,
          secure: this.config.get<boolean>('email.secure') ?? false,
          auth: user ? { user, pass: password } : undefined,
        });
      }
    }
  }

  async sendOtp(email: string, code: string): Promise<void> {
    const provider = this.config.get<string>('email.provider') ?? 'console';
    if (provider === 'console') {
      this.logger.log(`[EMAIL:console] to ${email}: Votre code VTS est ${code}`);
      return;
    }
    if (provider !== 'smtp' || !this.transporter) {
      throw new ServiceUnavailableException('Email delivery is not configured');
    }

    await this.transporter.sendMail({
      from: this.config.get<string>('email.from'),
      to: email,
      subject: 'Votre code de connexion VTS Mali',
      text: `Votre code de connexion VTS Mali est : ${code}. Il expire dans quelques minutes.`,
      html: [
        '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">',
        '<h2 style="color:#1B4D3E">VTS Mali</h2>',
        '<p>Votre code de connexion est :</p>',
        `<p style="font-size:30px;font-weight:700;letter-spacing:6px">${code}</p>`,
        '<p>Ce code expire dans quelques minutes. Ne le partagez avec personne.</p>',
        '</div>',
      ].join(''),
    });
  }
}
