"use client";

import QRCode from "react-qr-code";
import { NfeAccessKey } from "@/components/nfe-access-key";
import { formatCNPJ } from "@/lib/format-cnpj";
import { formatDateTime } from "@/lib/format-date";
import {
  formatProductQuantityByRule,
  type UnitFractionRulesMap,
} from "@/lib/product-quantity-format";
import { formatAsCurrency } from "@/lib/utils";

/** Substitui "ADM" (palavra inteira) pelo nome do vendedor quando disponível. */
const ADM_TOKEN = /\bADM\b/g;

function replaceAdmWithSellerName(
  line: string,
  sellerName: string | null | undefined
): string {
  const name = sellerName?.trim();
  if (!name) {
    return line;
  }
  return line.replace(ADM_TOKEN, name);
}

interface NfceItem {
  code: string;
  codeBar: string;
  description: string;
  qty: string;
  totalPrice: string;
  unit: string;
  unitPrice: string;
}

interface ParsedNfce {
  accessKey: string;
  additionalInfo: string;
  customerAddress: string;
  customerDocument: string;
  customerName: string;
  discount: string;
  emitterAddress: string;
  emitterCnpj: string;
  emitterIe: string;
  emitterName: string;
  issueDateTime: string;
  items: NfceItem[];
  legalMessage: string;
  number: string;
  otherExpenses: string;
  payments: Array<{ label: string; value: string }>;
  protocol: string;
  protocolDateTime: string;
  qrCodeValue: string;
  series: string;
  totalProducts: string;
  totalTaxes: string;
  totalValue: string;
}

function firstByTag(root: Document | Element, tagName: string): Element | null {
  return (
    root.getElementsByTagNameNS("*", tagName)[0] ??
    root.getElementsByTagName(tagName)[0] ??
    null
  );
}

function textOf(root: Document | Element, tagName: string): string {
  return firstByTag(root, tagName)?.textContent?.trim() ?? "";
}

function parseNfceXml(xml: string): ParsedNfce | null {
  if (!xml.trim()) {
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    return null;
  }

  const emit = firstByTag(doc, "emit");
  const dest = firstByTag(doc, "dest");
  const ide = firstByTag(doc, "ide");
  const total = firstByTag(doc, "ICMSTot");
  const infAdic = firstByTag(doc, "infAdic");
  const infNFeSupl = firstByTag(doc, "infNFeSupl");
  const protNFe = firstByTag(doc, "protNFe");
  const totalTrib = textOf(total ?? doc, "vTotTrib") || "0";

  const emitterStreet = textOf(emit ?? doc, "xLgr");
  const emitterNumber = textOf(emit ?? doc, "nro");
  const emitterDistrict = textOf(emit ?? doc, "xBairro");
  const emitterCity = textOf(emit ?? doc, "xMun");
  const emitterUf = textOf(emit ?? doc, "UF");

  const customerStreet = textOf(dest ?? doc, "xLgr");
  const customerNumber = textOf(dest ?? doc, "nro");
  const customerDistrict = textOf(dest ?? doc, "xBairro");
  const customerCity = textOf(dest ?? doc, "xMun");
  const customerUf = textOf(dest ?? doc, "UF");

  const detList = Array.from(doc.getElementsByTagNameNS("*", "det"));
  const items: NfceItem[] = detList.map((det) => {
    const prod = firstByTag(det, "prod");
    return {
      code: textOf(prod ?? det, "cProd") || "—",
      codeBar: textOf(prod ?? det, "cEAN") || "—",
      description: textOf(prod ?? det, "xProd") || "—",
      qty: textOf(prod ?? det, "qCom") || "0",
      unit: textOf(prod ?? det, "uCom") || "UN",
      unitPrice: textOf(prod ?? det, "vUnCom") || "0",
      totalPrice: textOf(prod ?? det, "vProd") || "0",
    };
  });

  const accessKey =
    textOf(doc, "chNFe") ||
    firstByTag(doc, "infNFe")?.getAttribute("Id")?.replace(/^NFe/, "") ||
    "";

  const paymentTypeMap: Record<string, string> = {
    "01": "Dinheiro",
    "02": "Cheque",
    "03": "Cartão de Crédito",
    "04": "Cartão de Débito",
    "05": "Crédito Loja",
    "10": "Vale Alimentação",
    "11": "Vale Refeição",
    "12": "Vale Presente",
    "13": "Vale Combustível",
    "14": "Duplicata Mercantil",
    "15": "Boleto Bancário",
    "16": "Depósito Bancário",
    "17": "Pagamento Instantâneo (PIX)",
    "18": "Transferência Bancária, Carteira Digital",
    "19": "Programa de fidelidade, Cashback, Crédito Virtual",
    "20": "PIX Estático",
    "21": "Crédito em Loja (por Devolução)",
    "22": "Pagamento Eletrônico não Informado",
    "23": "PIX Automático",
    "90": "Sem pagamento",
    "99": "Outros",
  };

  const detPagList = Array.from(doc.getElementsByTagNameNS("*", "detPag"));
  const payments = detPagList.map((detPag) => {
    const tPag = textOf(detPag, "tPag");
    const vPag = textOf(detPag, "vPag") || "0";
    return {
      label: paymentTypeMap[tPag] ?? `Tipo ${tPag || "--"}`,
      value: vPag,
    };
  });

  const legalMessage =
    textOf(infAdic ?? doc, "infAdFisco") ||
    "NÃO PERMITE APROVEITAMENTO DE CRÉDITO DE ICMS";

  return {
    emitterName: textOf(emit ?? doc, "xNome"),
    emitterCnpj: textOf(emit ?? doc, "CNPJ"),
    emitterIe: textOf(emit ?? doc, "IE"),
    emitterAddress:
      [emitterStreet, emitterNumber].filter(Boolean).join(", ") +
      (emitterDistrict ? ` - ${emitterDistrict}` : "") +
      (emitterCity || emitterUf ? ` - ${emitterCity} ${emitterUf}` : ""),
    number: textOf(ide ?? doc, "nNF"),
    series: textOf(ide ?? doc, "serie"),
    issueDateTime: formatDateTime(textOf(ide ?? doc, "dhEmi")),
    legalMessage,
    protocol: textOf(protNFe ?? doc, "nProt"),
    protocolDateTime: formatDateTime(textOf(protNFe ?? doc, "dhRecbto")),
    customerName: textOf(dest ?? doc, "xNome"),
    customerDocument: textOf(dest ?? doc, "CNPJ") || textOf(dest ?? doc, "CPF"),
    customerAddress:
      [customerStreet, customerNumber].filter(Boolean).join(", ") +
      (customerDistrict ? ` - ${customerDistrict}` : "") +
      (customerCity || customerUf ? ` - ${customerCity} ${customerUf}` : ""),
    totalProducts: textOf(total ?? doc, "vProd") || "0",
    totalTaxes: totalTrib,
    discount: textOf(total ?? doc, "vDesc") || "0",
    otherExpenses: textOf(total ?? doc, "vOutro") || "0",
    totalValue: textOf(total ?? doc, "vNF") || "0",
    additionalInfo: textOf(infAdic ?? doc, "infCpl"),
    qrCodeValue: textOf(infNFeSupl ?? doc, "qrCode") || accessKey || "NFCe",
    accessKey,
    items,
    payments,
  };
}

export function NfcePrintPreview({
  consumerDocument,
  consumerName,
  sellerName,
  valorTroco,
  xml,
  unitFractionRules,
}: {
  consumerDocument?: string | null;
  consumerName?: string | null;
  sellerName?: string | null;
  /** Soma de `venda_recebimento.VALOR_TROCO` da venda. Troco só é exibido se o valor for positivo. */
  valorTroco?: number | null;
  xml: string;
  unitFractionRules?: UnitFractionRulesMap;
}) {
  const data = parseNfceXml(xml);
  if (!data) {
    return (
      <div className="rounded-md border p-3 text-muted-foreground text-sm">
        Não foi possível recuperar a NFC-e.
      </div>
    );
  }

  const normalizedConsumerName = consumerName?.trim() || "";
  const normalizedConsumerDocument = consumerDocument?.trim() || "";
  const hasPdvConsumerInfo =
    !!normalizedConsumerName || !!normalizedConsumerDocument;

  const trocoNum = Number(valorTroco);
  const showTroco = Number.isFinite(trocoNum) && trocoNum > 0;

  return (
    <div className="flex justify-center bg-zinc-200 px-4 py-2">
      <div className="w-80 max-w-full bg-white p-2 font-mono text-[11px] text-black leading-tight">
        <div className="text-center font-bold text-[12px] uppercase">
          {data.emitterName}
        </div>
        <div className="text-center font-semibold">
          CNPJ: {formatCNPJ(data.emitterCnpj)} IE: {data.emitterIe}
        </div>
        <div className="text-center uppercase">{data.emitterAddress}</div>
        <div className="my-2 text-center">
          Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica
        </div>

        <div className="grid grid-cols-[60px_1fr_55px_59px] gap-1 border-black border-b border-dashed pb-0.5 font-bold text-[10px]">
          <div>CÓDIGO</div>
          <div>DESCRIÇÃO</div>
          <div className="text-right">QTD UN</div>
          <div className="text-right">VL TOTAL</div>
        </div>

        <div className="space-y-1 py-2 text-[10px]">
          {data.items.map((item, index) => (
            <div key={`${item.code}-${index}`}>
              <div className="grid grid-cols-[60px_1fr_38px] gap-1">
                <div className="text-left text-[8px]">
                  {item.unit?.toUpperCase() === "KG"
                    ? item.code
                    : item.codeBar &&
                        item.codeBar !== "—" &&
                        item.codeBar.toUpperCase() !== "SEM GTIN"
                      ? item.codeBar
                      : item.code}
                </div>
                <div className="truncate">{item.description}</div>
                <div className="text-right">
                  {Number(item.totalPrice).toFixed(2)}
                </div>
              </div>
              <div className="pl-[65px] text-[9px]">
                {formatProductQuantityByRule(
                  item.qty,
                  item.unit,
                  unitFractionRules
                )}{" "}
                {item.unit} x {Number(item.unitPrice).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-0.5 border-black border-t border-dashed pt-2">
          <div className="flex justify-between">
            <span>Qtd. Total de Itens</span>
            <span>{data.items.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Valor Produtos R$</span>
            <span>{Number(data.totalProducts).toFixed(2)}</span>
          </div>
          {Number(data.discount) > 0 && (
            <div className="flex justify-between">
              <span>Desconto R$</span>
              <span>{Number(data.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold">
            <span>Valor a Pagar R$</span>
            <span>{Number(data.totalValue).toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-2 flex justify-between border-black border-t border-dashed pt-2 font-medium">
          <span>FORMA DE PAGAMENTO</span>
          <span>VALOR PAGO R$</span>
        </div>
        <div className="space-y-0.5">
          {data.payments.length > 0 ? (
            data.payments.map((payment, index) => (
              <div
                className="flex justify-between"
                key={`${payment.label}-${index}`}
              >
                <span>{payment.label}</span>
                <span>{Number(payment.value).toFixed(2)}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between">
              <span>Sem informação</span>
              <span>0,00</span>
            </div>
          )}
        </div>
        {showTroco && (
          <div className="flex justify-between">
            <span>Troco R$</span>
            <span>{formatAsCurrency(trocoNum)}</span>
          </div>
        )}

        <div className="mt-2 border-black border-t border-dashed pt-1.5 text-center text-[10px] leading-tight">
          <div className="pb-2 text-center font-bold">
            Consulte pela chave de acesso em
          </div>
          <div className="font-semibold">
            www.fazenda.jr.gov.br/nfce/consulta
          </div>
        </div>
        <div className="truncate text-center text-[9px]">
          <NfeAccessKey accessKey={data.accessKey || ""} />
        </div>

        <div className="mt-1 pt-1">
          <div className="mx-2 grid grid-cols-[108px_1fr] items-center justify-center gap-2">
            <QRCode size={104} value={data.qrCodeValue} />
            <div className="text-center text-[10px] leading-tight">
              {hasPdvConsumerInfo ? (
                <>
                  <div className="font-semibold">
                    {normalizedConsumerName || "CONSUMIDOR"}
                  </div>
                  {normalizedConsumerDocument ? (
                    <div>{normalizedConsumerDocument}</div>
                  ) : null}
                </>
              ) : (
                <div className="font-semibold">CONSUMIDOR NÃO IDENTIFICADO</div>
              )}
              <div className="mt-1 font-semibold">
                NFC-e nº {data.number} Série {data.series}
              </div>
              <div>{data.issueDateTime}</div>
              <div className="mt-1 font-semibold">Protocolo de Autorização</div>
              <div>
                {data.protocol
                  ? `${data.protocol} ${data.protocolDateTime}`
                  : "NFC-e sem autorização de uso da SEFAZ"}
              </div>
            </div>
          </div>
        </div>

        {data.additionalInfo ? (
          <div className="my-2 space-y-1.5 border-black border-t border-dashed pt-1.5 text-[10px] leading-tight">
            {data.additionalInfo.split("|").map((part, index) => (
              <div key={`${part}-${index}`}>
                {replaceAdmWithSellerName(part.trim(), sellerName)}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-[10px]">
            NFC-E EMITIDO PARA TESTE DE IMPRESSÃO
          </div>
        )}

        <div className="my-2 text-[10px] leading-tight">
          Tributos Incidentes (Lei Federal 12.741/2012):{" "}
          {formatAsCurrency(Number(data.totalTaxes))}
        </div>

        {/* <div className="text-center font-semibold text-[10px]">CaixaPro</div> */}
      </div>
    </div>
  );
}
