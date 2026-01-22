import { router } from "../../index";
import { subscriptionRouter } from "./subscription";
import { tenantSupportRouter } from "./support";
import { tenantDatabaseRouter } from "./tenant-database";
import { tenantInfoRouter } from "./tenant-info";
import { tenantUsersRouter } from "./tenant-users";

export const tenantRouter = router({
  // Sub-router para assinaturas
  subscription: subscriptionRouter,

  // Rotas de informações do tenant
  getTenantStats: tenantInfoRouter.getTenantStats,
  getMyTenant: tenantInfoRouter.getMyTenant,
  updateMyTenant: tenantInfoRouter.updateMyTenant,

  // Rotas de gerenciamento de usuários
  users: tenantUsersRouter,

  // Rotas de suporte
  support: tenantSupportRouter,

  // Rotas de banco de dados
  checkDatabaseCredentials: tenantDatabaseRouter.checkDatabaseCredentials,
  testGestorConnection: tenantDatabaseRouter.testGestorConnection,
});
