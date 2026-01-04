import prisma from "@gestor/db";

import { adminProcedure, router } from "../../index";
import { requirePermission } from "../../middleware/permissions";

export const statsRouter = router({
  /**
   * Obter estatísticas gerais do sistema (para dashboard)
   * Requer permissão DASHBOARD:READ
   */
  get: adminProcedure
    .use(requirePermission("DASHBOARD", "READ"))
    .query(async () => {
      const [
        totalTenants,
        activeTenants,
        inactiveTenants,
        totalUsers,
        recentTenants,
        recentUsers,
      ] = await Promise.all([
        // Tenants
        prisma.tenant.count({ where: { deletedAt: null } }),
        prisma.tenant.count({
          where: { deletedAt: null, active: true },
        }),
        prisma.tenant.count({
          where: { deletedAt: null, active: false },
        }),
        // Users
        prisma.user.count(),
        // Recent tenants
        prisma.tenant.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            _count: {
              select: { users: true, branches: true },
            },
          },
        }),
        // Recent users
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        }),
      ]);

      // Calcular crescimento de tenants (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newTenantsLast30Days = await prisma.tenant.count({
        where: {
          deletedAt: null,
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      // Calcular crescimento de usuários (últimos 30 dias)
      const newUsersLast30Days = await prisma.user.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      return {
        tenants: {
          total: totalTenants,
          active: activeTenants,
          inactive: inactiveTenants,
          newLast30Days: newTenantsLast30Days,
        },
        users: {
          total: totalUsers,
          newLast30Days: newUsersLast30Days,
        },
        recentTenants,
        recentUsers,
      };
    }),
});
