import nodemailer from 'nodemailer';
import logger from './logger.js';

// Configure transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendConfirmationEmail = async (associate) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: associate.email,
      subject: 'ADIP - Confirmação de Registro',
      html: `
        <h1>Registro Recebido, ${associate.nome}!</h1>
        <p>Seu registro foi recebido e está em processo de análise.</p>
        <p>Número de Associado: ${associate.associateNumber}</p>
        <p>Entraremos em contato em breve para mais informações.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Confirmation email sent to ${associate.email}`);
  } catch (error) {
    logger.error('Error sending confirmation email', error);
  }
};

export const sendApprovalEmail = async (associate) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: associate.email,
      subject: 'ADIP - Candidatura Aprovada',
      html: `
        <h1>Parabéns, ${associate.nome}!</h1>
        <p>Sua candidatura para associado da ADIP foi aprovada.</p>
        <p>Seu número de associado é: ${associate.associateNumber}</p>
        <p>Próximos passos: Entre em contato conosco para mais informações.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Approval email sent to ${associate.email}`);
  } catch (error) {
    logger.error('Error sending approval email', error);
  }
};

export const sendRejectionEmail = async (associate) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: associate.email,
      subject: 'ADIP - Status do Registro',
      html: `
        <h1>Informação sobre seu Registro, ${associate.nome}</h1>
        <p>Sua candidatura está em análise ou passou por ajustes.</p>
        <p>Entraremos em contato em breve para mais informações.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Rejection email sent to ${associate.email}`);
  } catch (error) {
    logger.error('Error sending rejection email', error);
  }
};