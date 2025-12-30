"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  MoreHorizontal,
  PlusCircle,
  RotateCcw,
  Trash2,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TenantListSkeleton } from "@/components/tenant-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { trpc, trpcClient } from "@/utils/trpc";

function _AdminTenantsPageContent() {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] =
    useState(false);
  const [selectedTenant, setSelectedTenant] = useState<
    | {
        id: string;
        name: string;
        slug: string;
        active: boolean;
      }
    | undefined
  >(undefined);
  const [activeTab, setActiveTab] = useState("active");

  const {
    data: tenantsData,
    isLoading: isTenantsLoading,
    refetch: refetchTenants,
  } = useQuery({
    ...trpc.admin.listTenants.queryOptions({ page: 1, limit: 100 }),
  });

  const {
    data: deletedTenantsData,
    isLoading: isDeletedTenantsLoading,
    refetch: refetchDeletedTenants,
  } = useQuery({
    ...trpc.admin.listDeletedTenants.queryOptions({ page: 1, limit: 100 }),
    enabled: activeTab === "deleted",
  });

  const deleteTenantMutation = useMutation({
    mutationFn: (input: { id: string }) =>
      trpcClient.admin.deleteTenant.mutate({ tenantId: input.id }),
  });

  const restoreTenantMutation = useMutation({
    mutationFn: (input: { id: string }) =>
      trpcClient.admin.restoreTenant.mutate({ tenantId: input.id }),
  });

  const permanentDeleteTenantMutation = useMutation({
    mutationFn: (input: { id: string }) =>
      trpcClient.admin.permanentlyDeleteTenant.mutate({ tenantId: input.id }),
  });

  const handleDeleteTenant = async () => {
    if (!selectedTenant) {
      return;
    }
    await deleteTenantMutation.mutateAsync(
      { id: selectedTenant.id },
      {
        onSuccess: () => {
          toast.success("Tenant deletado com sucesso!");
          refetchTenants();
          setDeleteDialogOpen(false);
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const handleRestoreTenant = async () => {
    if (!selectedTenant) {
      return;
    }
    await restoreTenantMutation.mutateAsync(
      { id: selectedTenant.id },
      {
        onSuccess: () => {
          toast.success("Tenant restaurado com sucesso!");
          refetchDeletedTenants();
          refetchTenants();
          setRestoreDialogOpen(false);
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const handlePermanentDeleteTenant = async () => {
    if (!selectedTenant) {
      return;
    }
    await permanentDeleteTenantMutation.mutateAsync(
      { id: selectedTenant.id },
      {
        onSuccess: () => {
          toast.success("Tenant excluído permanentemente!");
          refetchDeletedTenants();
          setPermanentDeleteDialogOpen(false);
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const _isLoading = isTenantsLoading;

  const tenants = tenantsData?.data || [];
  const deletedTenants = deletedTenantsData?.data || [];

  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Tenants", isCurrent: true },
  ];

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">Gerenciar Tenants</h2>
          <p className="text-muted-foreground text-sm">
            Criar e gerenciar todos os tenants do sistema
          </p>
        </div>
        <Link href="/admin/tenants/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Criar Tenant
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <nav className="flex space-x-4 border-b">
          <button
            className={`border-b-2 px-1 py-4 font-medium text-sm ${
              activeTab === "active"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("active")}
            type="button"
          >
            Ativos
          </button>
          <button
            className={`border-b-2 px-1 py-4 font-medium text-sm ${
              activeTab === "deleted"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("deleted")}
            type="button"
          >
            Lixeira ({deletedTenants.length})
          </button>
        </nav>

        {activeTab === "active" && (
          <div className="space-y-4">
            {tenants.length > 0 ? (
              <div className="rounded-md border">
                {tenants.map((tenant) => (
                  <div
                    className="flex items-center justify-between border-b p-4 last:border-b-0"
                    key={tenant.id}
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <Link
                          className="font-medium hover:underline"
                          href={`/admin/tenants/${tenant.id}`}
                        >
                          {tenant.name}
                        </Link>
                        <p className="text-muted-foreground text-sm">
                          {tenant.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {tenant.active ? (
                        <Badge
                          className="text-green-700 ring-1 ring-green-600/20 ring-inset"
                          variant="outline"
                        >
<<<<<<< Updated upstream
                          Active
=======
                          Ativo
>>>>>>> Stashed changes
                        </Badge>
                      ) : (
                        <Badge
                          className="text-red-700 ring-1 ring-red-600/20 ring-inset"
                          variant="outline"
                        >
<<<<<<< Updated upstream
                          Inactive
=======
                          Inativo
>>>>>>> Stashed changes
                        </Badge>
                      )}
                      <span className="text-muted-foreground text-xs">
                        {tenant._count.users} usuário
                        {tenant._count.users > 1 ? "s" : null}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button className="h-8 w-8 p-0" variant="ghost" />
                          }
                        >
<<<<<<< Updated upstream
                          <span className="sr-only">Open menu</span>
=======
                          <span className="sr-only">Abrir menu</span>
>>>>>>> Stashed changes
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
<<<<<<< Updated upstream
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
=======
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
>>>>>>> Stashed changes
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/tenants/${tenant.id}`)
                              }
                            >
                              <MoreHorizontal className="mr-2 h-4 w-4" />{" "}
                              Ver/Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedTenant({
                                  id: tenant.id,
                                  name: tenant.name,
                                  slug: tenant.slug,
                                  active: tenant.active,
                                });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Deletar
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PlusCircle className="h-6 w-6" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum tenant encontrado</EmptyTitle>
                  <EmptyDescription>
                    Comece criando seu primeiro tenant.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => router.push("/admin/tenants/new")}>
                    Criar Tenant
                  </Button>
                </EmptyContent>
              </Empty>
            )}
          </div>
        )}

        {activeTab === "deleted" && (
          <div className="space-y-4">
            {isDeletedTenantsLoading ? (
              <TenantListSkeleton />
            ) : deletedTenants.length > 0 ? (
              <div className="rounded-md border">
                {deletedTenants.map((tenant: any) => (
                  <div
                    className="flex items-center justify-between border-b p-4 last:border-b-0"
                    key={tenant.id}
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        <p className="text-muted-foreground text-sm">
                          {tenant.slug}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Deletado em:{" "}
                          {new Date(tenant.deletedAt).toLocaleString("pt-BR")}
                          {tenant.deletedByUser && (
                            <>
                              {" "}
                              por{" "}
                              {tenant.deletedByUser.name ||
                                tenant.deletedByUser.email}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground text-xs">
                        {tenant._count.users} usuários
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button className="h-8 w-8 p-0" variant="ghost" />
                          }
                        >
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTenant({
                                  id: tenant.id,
                                  name: tenant.name,
                                  slug: tenant.slug,
                                  active: tenant.active,
                                });
                                setRestoreDialogOpen(true);
                              }}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" /> Restaurar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedTenant({
                                  id: tenant.id,
                                  name: tenant.name,
                                  slug: tenant.slug,
                                  active: tenant.active,
                                });
                                setPermanentDeleteDialogOpen(true);
                              }}
                            >
                              <TrashIcon className="mr-2 h-4 w-4" /> Excluir
                              Permanentemente
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <TrashIcon className="h-6 w-6" />
                  </EmptyMedia>
                  <EmptyTitle>Lixeira vazia</EmptyTitle>
                  <EmptyDescription>
                    Nenhum tenant foi deletado ainda.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        )}
      </div>

      {/* Delete Tenant Dialog */}
      <Dialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Tenant</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar {selectedTenant?.name} (
              {selectedTenant?.slug})? O tenant será movido para a lixeira e
              poderá ser restaurado posteriormente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={deleteTenantMutation.isPending}
              onClick={() => setDeleteDialogOpen(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={deleteTenantMutation.isPending}
              onClick={handleDeleteTenant}
              variant="destructive"
            >
              {deleteTenantMutation.isPending ? "Deletando..." : "Deletar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Tenant Dialog */}
      <Dialog onOpenChange={setRestoreDialogOpen} open={restoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar Tenant</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja restaurar {selectedTenant?.name} (
              {selectedTenant?.slug})? O tenant será reativado e voltará a
              aparecer na lista de tenants ativos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={restoreTenantMutation.isPending}
              onClick={() => setRestoreDialogOpen(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={restoreTenantMutation.isPending}
              onClick={handleRestoreTenant}
            >
              {restoreTenantMutation.isPending ? "Restaurando..." : "Restaurar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Tenant Dialog */}
      <Dialog
        onOpenChange={setPermanentDeleteDialogOpen}
        open={permanentDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Permanentemente</DialogTitle>
            <DialogDescription>
              <strong className="text-destructive">
                ATENÇÃO: Esta ação é irreversível!
              </strong>
              <br />
              <br />
              Tem certeza que deseja excluir permanentemente{" "}
              {selectedTenant?.name} ({selectedTenant?.slug})? Todos os dados
              relacionados serão perdidos e não poderão ser recuperados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={permanentDeleteTenantMutation.isPending}
              onClick={() => setPermanentDeleteDialogOpen(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={permanentDeleteTenantMutation.isPending}
              onClick={handlePermanentDeleteTenant}
              variant="destructive"
            >
              {permanentDeleteTenantMutation.isPending
                ? "Excluindo..."
                : "Excluir Permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminTenantsPage() {
  return (
    <AdminGuard>
      <_AdminTenantsPageContent />
    </AdminGuard>
  );
}
