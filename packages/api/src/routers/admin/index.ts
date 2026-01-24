import { router } from "../../index";

import { auditRouter } from "./audit";
import { branchRouter } from "./branch";
import { permissionRouter } from "./permission";
import { plansRouter } from "./plans";
import { statsRouter } from "./stats";
import { statusRouter } from "./status";
import { subscriptionsRouter } from "./subscriptions";
import { supportRouter } from "./support";
import { tenantsRouter } from "./tenants";
import { usersRouter } from "./users";

export const adminRouter = router({
  // Rotas de tenants (mantendo nomes originais para compatibilidade)
  listTenants: tenantsRouter.list,
  getTenant: tenantsRouter.get,
  createTenant: tenantsRouter.create,
  updateTenant: tenantsRouter.update,
  deleteTenant: tenantsRouter.delete,
  listDeletedTenants: tenantsRouter.listDeleted,
  restoreTenant: tenantsRouter.restore,
  permanentlyDeleteTenant: tenantsRouter.permanentlyDelete,
  testDatabaseConnection: tenantsRouter.testDatabaseConnection,

  // Rotas de usuários (mantendo nomes originais para compatibilidade)
  listAllUsers: usersRouter.listAll,
  listTenantUsers: usersRouter.listByTenant,
  createUser: usersRouter.create,
  updateUser: usersRouter.update,
  deleteUser: usersRouter.delete,
  restoreUser: usersRouter.restore,
  listDeletedUsers: usersRouter.listDeleted,
  resetUserPassword: usersRouter.resetPassword,
  resendInvite: usersRouter.resendInvite,
  addUserToTenant: usersRouter.addToTenant,
  removeUserFromTenant: usersRouter.removeFromTenant,
  updateUserRoleInTenant: usersRouter.updateRoleInTenant,

  // Estatísticas
  getStats: statsRouter.get,

  // Outras rotas
  branch: branchRouter,
  permission: permissionRouter,
  audit: auditRouter,
  support: supportRouter,
  plans: plansRouter,
  subscriptions: subscriptionsRouter,
  status: statusRouter,
});
