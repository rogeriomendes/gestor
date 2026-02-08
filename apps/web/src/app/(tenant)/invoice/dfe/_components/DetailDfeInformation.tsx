import { Card, CardContent, CardDescription } from "@/components/ui/card";
import type { NFeInfo } from "./DetailDfe";

export function DetailDfeInformation({ xml }: { xml: NFeInfo }) {
  return (
    <div className="space-y-1.5 md:space-y-3">
      {xml.infAdic?.infCpl && (
        <Card className="break-all rounded-md py-1 md:py-2">
          <CardDescription className="px-1 md:px-2">
            Contribuinte
          </CardDescription>
          <CardContent className="px-1 md:px-2">
            <div className="text-wrap text-xs leading-relaxed md:text-sm">
              {xml.infAdic?.infCpl}
            </div>
          </CardContent>
        </Card>
      )}
      {xml.infAdic?.infAdFisco && (
        <Card className="break-all rounded-md py-1 md:py-2">
          <CardDescription className="px-1 md:px-2">Fisco</CardDescription>
          <CardContent className="px-1 md:px-2">
            <div className="text-wrap text-xs leading-relaxed md:text-sm">
              {xml.infAdic?.infAdFisco}
            </div>
          </CardContent>
        </Card>
      )}
      {!(xml.infAdic?.infCpl || xml.infAdic?.infAdFisco) && (
        <Card className="mt-2 rounded-md rounded-md py-1 md:mt-3 md:py-2">
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
