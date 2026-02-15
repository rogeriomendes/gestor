import { Card, CardContent, CardDescription } from "@/components/ui/card";
import type { RouterOutputs } from "@/utils/trpc";

type entryData =
  RouterOutputs["tenant"]["invoiceEntry"]["byId"]["invoiceEntry"];

export function DetailEntryInformation({
  entryData,
}: {
  entryData: entryData;
}) {
  return (
    <div className="space-y-1.5 md:space-y-3">
      {entryData?.fin_lancamento_pagar[0]?.HISTORICO && (
        <Card className="break-all rounded-md py-1 md:py-2" size="sm">
          <CardDescription className="px-1 md:px-2">Histórico</CardDescription>
          <CardContent className="px-1 md:px-2">
            <div className="text-wrap text-xs leading-relaxed md:text-sm">
              {entryData?.fin_lancamento_pagar[0]?.HISTORICO}
            </div>
          </CardContent>
        </Card>
      )}
      {entryData?.INFORMACOES_ADD_FISCO && (
        <Card className="break-all rounded-md py-1 md:py-2" size="sm">
          <CardDescription className="px-1 md:px-2">Fisco</CardDescription>
          <CardContent className="px-1 md:px-2">
            <div className="text-wrap text-xs leading-relaxed md:text-sm">
              {entryData?.INFORMACOES_ADD_FISCO}
            </div>
          </CardContent>
        </Card>
      )}
      {entryData?.INFORMACOES_ADD_CONTRIBUINTE && (
        <Card
          className="mt-2 break-all rounded-md rounded-md py-1 md:mt-3 md:py-2"
          size="sm"
        >
          <CardDescription className="px-1 md:px-2">
            Contribuinte
          </CardDescription>
          <CardContent className="px-1 md:px-2">
            <div className="text-wrap text-xs leading-relaxed md:text-sm">
              {entryData?.INFORMACOES_ADD_CONTRIBUINTE}
            </div>
          </CardContent>
        </Card>
      )}
      {!(
        entryData?.fin_lancamento_pagar[0]?.HISTORICO ||
        entryData?.INFORMACOES_ADD_CONTRIBUINTE ||
        entryData?.INFORMACOES_ADD_FISCO
      ) && (
        <Card
          className="mt-2 rounded-md rounded-md py-1 md:mt-3 md:py-2"
          size="sm"
        >
          <CardContent className="px-1 md:px-2">
            <div className="text-wrap text-xs leading-relaxed md:text-sm">
              Sem informações adicionais para exibir
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
