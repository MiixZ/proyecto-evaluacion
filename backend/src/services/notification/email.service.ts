import nodemailer from 'nodemailer';
import config from '@config/environment';
import { logger } from '@utils/logger';

/**
 * Servicio de envío de correos electrónicos
 * Soporta SMTP real o modo mock para desarrollo
 */
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
      logger.warn('SMTP no configurado. Modo Mock activado.');
    }
  }

  /**
   * Envía email de bienvenida a nuevo usuario con credenciales
   * @param to - Email del destinatario
   * @param _name - Nombre del usuario (sin usar actualmente)
   * @param password - Contraseña generada
   */
  async sendWelcomeEmail(to: string, _name: string, password: string) {
    const subject = 'Bienvenido a la Plataforma de Evaluación';
    const html = `... (HTML Content) ...`;

    if (!this.transporter) {
      if (config.nodeEnv === 'production') {
        logger.info(
          `[MOCK EMAIL] Email simulado enviado a ${to}. (Contenido oculto en producción)`
        );
      } else {
        logger.info(
          `[MOCK EMAIL] To: ${to} | Subject: ${subject} | Password: ${password}`
        );
      }
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
