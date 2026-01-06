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
   * @param name - Nombre del usuario
   * @param password - Contraseña generada
   */
  async sendWelcomeEmail(to: string, name: string, password: string) {
    const subject = 'Bienvenido a la Plataforma de Evaluación';
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .credentials {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .credential-item {
            margin: 10px 0;
          }
          .credential-label {
            font-weight: bold;
            color: #667eea;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            background: #e9ecef;
            padding: 8px 12px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 5px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>¡Bienvenido a la Plataforma!</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${name}</strong>,</p>
          
          <p>Tu cuenta ha sido creada exitosamente en la Plataforma de Evaluación Automática de Ejercicios de Programación.</p>
          
          <div class="credentials">
            <h3>Tus credenciales de acceso:</h3>
            <div class="credential-item">
              <div class="credential-label">📧 Email:</div>
              <div class="credential-value">${to}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">🔑 Contraseña temporal:</div>
              <div class="credential-value">${password}</div>
            </div>
          </div>

          <div class="warning">
            <strong>⚠️ Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña en tu primer inicio de sesión. Puedes hacerlo desde tu perfil de usuario.
          </div>

          <center>
            <a href="${config.cors.origin}" class="button">Acceder a la Plataforma</a>
          </center>

          <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar con el soporte técnico.</p>

          <p>¡Que tengas una excelente experiencia!</p>
        </div>
        <div class="footer">
          <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          <p>&copy; ${new Date().getFullYear()} Plataforma de Evaluación - Universidad de Granada</p>
        </div>
      </body>
      </html>
    `;

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
      throw error;
    }
  }
}

export const emailService = new EmailService();
