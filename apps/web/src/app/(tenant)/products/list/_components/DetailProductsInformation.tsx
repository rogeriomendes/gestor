import { Card, CardContent, CardDescription } from "@/components/ui/card";
import type { RouterOutputs } from "@/utils/trpc";

type productData =
  RouterOutputs["tenant"]["products"]["all"]["products"][number];

export function DetailProductsInformation({
  productData,
}: {
  productData: productData;
}) {
  return (
    <div className="space-y-3">
      <Card className="rounded-md leading-none">
        <CardDescription className="px-2 pt-2">Informações</CardDescription>
        <CardContent className="p-2">
          <div className="text-wrap text-xs leading-relaxed md:text-sm">
            {productData?.DESCRICAO}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
