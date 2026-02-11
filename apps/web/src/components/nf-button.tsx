import { ExternalLinkIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface NfButtonProps {
  chaveAcesso: string;
  tipo?: "nfe" | "nfce";
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

export function NfButton({
  chaveAcesso,
  tipo = "nfe",
  className = "h-6 px-2 [&_svg]:size-3",
  size = "sm",
  variant = "ghost",
}: NfButtonProps) {
  if (!chaveAcesso) {
    return null;
  }

  const getUrl = () => {
    if (tipo === "nfce") {
      return `https://www.fazenda.rj.gov.br/nfce/consulta?nfce=${chaveAcesso}`;
    }
    return `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?NFe=${chaveAcesso}`;
  };

  const getLabel = () => {
    return tipo === "nfce"
      ? "Consultar NFCe na fazenda"
      : "Consultar NFe na fazenda";
  };

  return (
    <Link href={getUrl() as Route} rel="noopener noreferrer" target="_blank">
      <Button className={className} size={size} variant={variant}>
        <ExternalLinkIcon />
        <span className="text-muted-foreground text-xs">{getLabel()}</span>
      </Button>
    </Link>
  );
}
