import nodemailer from 'nodemailer';
import { config } from '../config';

// Интерфейс для email опций
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Если email не настроен, просто логируем в консоль
    if (!config.EMAIL_HOST || !config.EMAIL_USER) {
      console.log('⚠️ Email service not configured. Emails will be logged to console.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: config.EMAIL_HOST,
        port: config.EMAIL_PORT || 587,
        secure: config.EMAIL_SECURE || false,
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASSWORD,
        },
      });

      // Проверяем соединение
      this.transporter.verify((error) => {
        if (error) {
          console.error('❌ Email service connection failed:', error);
          this.transporter = null;
        } else {
          console.log('✅ Email service ready');
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    // Если транспортер не настроен, логируем в консоль
    if (!this.transporter) {
      console.log('📧 Email (console mode):');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Content:', options.text || options.html);
      console.log('---');
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${config.EMAIL_FROM_NAME || 'GramChat'}" <${config.EMAIL_FROM || config.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log('✅ Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      // Fallback to console
      console.log('📧 Email (fallback to console):');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Content:', options.text || options.html);
      return false;
    }
  }

  // Отправка данных для входа менеджеру
  async sendManagerCredentials(email: string, password: string, shopName: string, ownerName: string) {
    const loginUrl = `${config.FRONTEND_URL || 'http://localhost:5173'}/login`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Добро пожаловать в GramChat!</h2>
        <p>Здравствуйте!</p>
        <p>${ownerName} пригласил вас в качестве менеджера в магазин "${shopName}".</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Ваши данные для входа:</h3>
          <p><strong>Email (логин):</strong> ${email}</p>
          <p><strong>Пароль:</strong> ${password}</p>
          <p style="margin-top: 15px;">
            <a href="${loginUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Войти в систему
            </a>
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Рекомендуем сменить пароль при первом входе в систему.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">
          Это автоматическое письмо. Пожалуйста, не отвечайте на него.
        </p>
      </div>
    `;

    const text = `
Добро пожаловать в GramChat!

${ownerName} пригласил вас в качестве менеджера в магазин "${shopName}".

Ваши данные для входа:
Email (логин): ${email}
Пароль: ${password}

Войти в систему: ${loginUrl}

Рекомендуем сменить пароль при первом входе в систему.
    `;

    return this.sendEmail({
      to: email,
      subject: `Приглашение в GramChat - ${shopName}`,
      html,
      text,
    });
  }

  // Отправка нового пароля
  async sendPasswordReset(email: string, newPassword: string, shopName: string) {
    const loginUrl = `${config.FRONTEND_URL || 'http://localhost:5173'}/login`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Смена пароля в GramChat</h2>
        <p>Здравствуйте!</p>
        <p>Ваш пароль для входа в магазин "${shopName}" был изменен.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Новые данные для входа:</h3>
          <p><strong>Email (логин):</strong> ${email}</p>
          <p><strong>Новый пароль:</strong> ${newPassword}</p>
          <p style="margin-top: 15px;">
            <a href="${loginUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Войти с новым паролем
            </a>
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Если вы не запрашивали смену пароля, обратитесь к владельцу магазина.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">
          Это автоматическое письмо. Пожалуйста, не отвечайте на него.
        </p>
      </div>
    `;

    const text = `
Смена пароля в GramChat

Ваш пароль для входа в магазин "${shopName}" был изменен.

Новые данные для входа:
Email (логин): ${email}
Новый пароль: ${newPassword}

Войти в систему: ${loginUrl}

Если вы не запрашивали смену пароля, обратитесь к владельцу магазина.
    `;

    return this.sendEmail({
      to: email,
      subject: `Новый пароль для GramChat - ${shopName}`,
      html,
      text,
    });
  }
}

export const emailService = new EmailService();