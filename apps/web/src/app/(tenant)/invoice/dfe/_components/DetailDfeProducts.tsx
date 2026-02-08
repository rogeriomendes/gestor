import { Card, CardContent } from "@/components/ui/card";
import { formatAsCurrency } from "@/lib/utils";
import type { NFeInfo, ProdutoDetalhe } from "./DetailDfe";

export function DetailDfeProducts({ xml }: { xml: NFeInfo }) {
  const products: ProdutoDetalhe[] = Array.isArray(xml.det)
    ? xml.det
    : [xml.det];

  return (
    <div className="space-y-3">
      <Card className="rounded-md py-1 md:py-2">
        <CardContent className="px-1 md:px-2">
          {products.map((item, index) => (
            <div
              className="group rounded-md p-2 transition-colors hover:bg-muted/50"
              key={index}
            >
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-xs leading-none md:text-sm">
                    {item.prod.xProd}
                  </p>
                  <div className="flex gap-2 text-muted-foreground text-xs md:text-sm">
                    <div className="flex items-center">
                      {Number(item.prod.qCom)} {item.prod.uCom}
                    </div>
                  </div>
                </div>
                <div className="ml-auto space-y-1">
                  <div className="flex flex-col items-center text-xs md:text-sm">
                    {formatAsCurrency(Number(item.prod.vProd))}
                  </div>
                  <div className="flex flex-col items-center text-muted-foreground text-xs md:text-sm">
                    {formatAsCurrency(
                      Number(item.prod.vProd) / Number(item.prod.qCom)
                    )}{" "}
                    {item.prod.uCom}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
