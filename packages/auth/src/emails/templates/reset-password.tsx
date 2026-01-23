import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ResetPasswordEmailProps {
  resetLink: string;
  userName?: string;
}

export function ResetPasswordEmail({
  resetLink,
  userName,
}: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Redefina sua senha do FBI Gestor</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>FBI Gestor</Heading>
          <Section style={section}>
            <Text style={text}>Olá{userName ? `, ${userName}` : ""},</Text>
            <Text style={text}>
              Recebemos uma solicitação para redefinir a senha da sua conta.
              Clique no botão abaixo para criar uma nova senha:
            </Text>
            <Button href={resetLink} style={button}>
              Redefinir Senha
            </Button>
            <Text style={text}>
              Se você não solicitou a redefinição de senha, ignore este email.
              Sua senha permanecerá inalterada.
            </Text>
            <Text style={textMuted}>
              Este link expira em 1 hora por motivos de segurança.
            </Text>
            <Hr style={hr} />
            <Text style={textMuted}>
              Se o botão não funcionar, copie e cole o link abaixo no seu
              navegador:
            </Text>
            <Link href={resetLink} style={link}>
              {resetLink}
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
};

const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#0f172a",
  padding: "17px 0 0",
  textAlign: "center" as const,
};

const section = {
  padding: "0 40px",
};

const text = {
  margin: "0 0 16px",
  color: "#334155",
  fontSize: "16px",
  lineHeight: "24px",
};

const textMuted = {
  margin: "0 0 16px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "20px",
};

const button = {
  backgroundColor: "#0f172a",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
  margin: "24px 0",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const link = {
  color: "#3b82f6",
  fontSize: "14px",
  wordBreak: "break-all" as const,
};
