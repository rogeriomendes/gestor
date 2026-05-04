import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTenant } from "@/contexts/tenant-context";
import { formatDate } from "@/lib/format-date";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { FileSearch2Icon } from "lucide-react";
import { useState } from "react";
import { DetailAudit } from "../../../audit/_components/DetailAudit";

type ProductAuditItem =
  RouterOutputs["tenant"]["products"]["audit"]["audit"][number];

export function DetailProductsAudit({
  productId,
  dataCadastro,
}: {
  productId: number;
  dataCadastro?: Date | string | null;
}) {
  const { tenant } = useTenant();
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const productsAuditQuery = useQuery({
    ...trpc.tenant.products.audit.queryOptions({
      id: productId,
      ...(dataCadastro != null ? { dataCadastro } : {}),
    }),
    enabled: !!tenant && productId > 0,
  });

  return (
    <div className="space-y-3">
      <Card
        className="rounded-md data-[size=sm]:py-0 data-[size=sm]:md:py-0"
        size="sm"
      >
        <CardContent className="group-data-[size=sm]/card:px-0 group-data-[size=sm]/card:md:px-0">
          {productsAuditQuery.isLoading ? (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs md:text-sm">
                {Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (productsAuditQuery.data?.audit?.length ?? 0) === 0 ? (
            <div className="my-8 flex items-center justify-center text-muted-foreground text-sm">
              <FileSearch2Icon className="mr-5 size-10 md:size-14" /> Não existe
              auditoria para este produto.
            </div>
          ) : (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs md:text-sm">
                {productsAuditQuery.data?.audit.map(
                  (audit: ProductAuditItem) => (
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      key={audit.ID}
                      onClick={() => {
                        setSelectedAuditId(audit.ID);
                        setIsModalOpen(true);
                      }}
                    >
                      <TableCell className="py-3">{audit.ID}</TableCell>
                      <TableCell className="py-3">
                        {audit.DATA_REGISTRO
                          ? `${formatDate(audit.DATA_REGISTRO)} ${audit.HORA_REGISTRO || ""}`.trim()
                          : "—"}
                      </TableCell>
                      <TableCell className="py-3">
                        {audit.usuario?.LOGIN}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedAuditId && (
        <DetailAudit
          auditId={selectedAuditId}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setSelectedAuditId(null);
            }
          }}
          open={isModalOpen}
        />
      )}
    </div>
  );
}
