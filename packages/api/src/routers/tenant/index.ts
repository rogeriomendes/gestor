import { router } from "../../index";
import { subscriptionRouter } from "./subscription";
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
  listUsers: tenantUsersRouter.listUsers,
  inviteUser: tenantUsersRouter.inviteUser,
  updateUserRole: tenantUsersRouter.updateUserRole,
  removeUser: tenantUsersRouter.removeUser,

  // Rotas de banco de dados
  checkDatabaseCredentials: tenantDatabaseRouter.checkDatabaseCredentials,
  testGestorConnection: tenantDatabaseRouter.testGestorConnection,
});
