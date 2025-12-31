import nodemailer from 'nodemailer';
import config from '@config/environment';
import { logger } from '@utils/logger';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (config.smtp.host && config.smtp.user && config.smtp.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      logger.info('Servicio de Email configurado con SMTP');
    } else {
      logger.warn(
        'SMTP no configurado. Los correos se imprimirán en consola (Mock Mode).'
      );
    }
  }

  async sendWelcomeEmail(to: string, name: string, password: string) {
    const subject = 'Bienvenido a la Plataforma de Evaluación';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>¡Bienvenido/a, ${name}!</h2>
        <p>Has sido registrado en la Plataforma de Evaluación de Ejercicios de Programación.</p>
        <p>Tus credenciales de acceso son:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px;">
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Contraseña Temporal:</strong> <code>${password}</code></p>
        </div>
        <p>Por favor, cambia tu contraseña tan pronto como inicies sesión.</p>
        <p>Saludos,<br>El equipo de la Plataforma.</p>
      </div>
    `;

    if (!this.transporter) {
      logger.info(
        `[MOCK EMAIL] To: ${to} | Subject: ${subject} | Password: ${password}`
      );

      return;
    }

    try {
      await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
      });
      logger.info(`Email de bienvenida enviado a ${to}`);
    } catch (error) {
      logger.error(`Error enviando email a ${to}:`, error);
    }
  }
}

export const emailService = new EmailService();
