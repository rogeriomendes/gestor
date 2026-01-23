import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { ChangeEmailTemplate } from "./templates/change-email";
import { DeleteAccountEmail } from "./templates/delete-account";
import { ResetPasswordEmail } from "./templates/reset-password";
import { VerifyEmailTemplate } from "./templates/verify-email";

// ============================================
// Configuração de provedores de email
// ============================================

// Resend (produção)
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Nodemailer/Gmail (desenvolvimento/testes)
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const nodemailerTransport =
  smtpHost && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
    : null;

// Email padrão do remetente
const fromEmail =
  process.env.EMAIL_FROM || smtpUser || "FBI Gestor <noreply@fbigestor.com>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOptions) {
  // Prioridade 1: Resend (produção)
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
      });

      if (result.error) {
        console.error("[Email/Resend] Erro ao enviar email:", result.error);
        return { success: false, error: result.error };
      }

      console.log("[Email/Resend] Email enviado com sucesso:", {
        to,
        subject,
        id: result.data?.id,
      });
      return { success: true, data: result.data };
    } catch (error) {
      console.error("[Email/Resend] Erro ao enviar email:", error);
      return { success: false, error };
    }
  }

  // Prioridade 2: Nodemailer/Gmail (desenvolvimento)
  if (nodemailerTransport) {
    try {
      const result = await nodemailerTransport.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
      });

      console.log("[Email/SMTP] Email enviado com sucesso:", {
        to,
        subject,
        messageId: result.messageId,
      });
      return { success: true, data: { id: result.messageId } };
    } catch (error) {
      console.error("[Email/SMTP] Erro ao enviar email:", error);
      return { success: false, error };
    }
  }

  // Fallback: apenas loga em desenvolvimento
  console.warn("[Email] Nenhum provedor configurado. Email não enviado:", {
    to,
    subject,
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[Email] Preview do email:");
    console.log("---");
    console.log(`Para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log("---");
  }

  return { success: false, error: "Nenhum provedor de email configurado" };
}

// ============================================
// Funções específicas para cada tipo de email
// ============================================

export async function sendResetPasswordEmail(
  to: string,
  resetLink: string,
  userName?: string
) {
  const html = await render(ResetPasswordEmail({ resetLink, userName }));
  return sendEmail({
    to,
    subject: "Redefinir sua senha - FBI Gestor",
    html,
  });
}

export async function sendVerificationEmail(
  to: string,
  verificationLink: string,
  userName?: string
) {
  const html = await render(
    VerifyEmailTemplate({ verificationLink, userName })
  );
  return sendEmail({
    to,
    subject: "Verifique seu email - FBI Gestor",
    html,
  });
}

export async function sendChangeEmailVerification(
  to: string,
  verificationLink: string,
  newEmail: string,
  userName?: string
) {
  const html = await render(
    ChangeEmailTemplate({ verificationLink, userName, newEmail })
  );
  return sendEmail({
    to,
    subject: "Confirme a alteração de email - FBI Gestor",
    html,
  });
}

export async function sendDeleteAccountEmail(
  to: string,
  deleteLink: string,
  userName?: string
) {
  const html = await render(DeleteAccountEmail({ deleteLink, userName }));
  return sendEmail({
    to,
    subject: "Confirmação de exclusão de conta - FBI Gestor",
    html,
  });
}
