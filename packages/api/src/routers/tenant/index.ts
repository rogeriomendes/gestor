import { router } from "../../index";
import { accountRouter } from "./account";
import { clientRouter } from "./client";
import { companiesRouter } from "./companies";
import { dashboardRouter } from "./dashboard";
import { financialBillsPayRouter } from "./financial-bills-pay";
import { financialBillsReceiveRouter } from "./financial-bills-receive";
import { financialClosingRouter } from "./financial-closing";
import { financialReceiptRouter } from "./financial-receipt";
import { groupRouter } from "./group";
import { invoiceDfeRouter } from "./invoice-dfe";
import { invoiceEntryRouter } from "./invoice-entry";
import { productsRouter } from "./products";
import { productsSaleRouter } from "./products-sale";
import { receiptTypeRouter } from "./receipt-type";
import { reportsRouter } from "./reports";
import { salesRouter } from "./sales";
import { salesBudgetRouter } from "./sales-budget";
import { sellerRouter } from "./seller";
import { subscriptionRouter } from "./subscription";
import { supplierRouter } from "./supplier";
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
  getMyProfile: tenantInfoRouter.getMyProfile,
  updateMyTenant: tenantInfoRouter.updateMyTenant,

  // Rotas de gerenciamento de usuários
  users: tenantUsersRouter,

  // Rotas de suporte
  support: tenantSupportRouter,

  // Rotas de banco de dados
  checkDatabaseCredentials: tenantDatabaseRouter.checkDatabaseCredentials,
  testGestorConnection: tenantDatabaseRouter.testGestorConnection,

  // Rotas de empresas
  account: accountRouter,
  client: clientRouter,
  dashboard: dashboardRouter,
  companies: companiesRouter,
  financialBillsPay: financialBillsPayRouter,
  financialClosing: financialClosingRouter,
  financialBillsReceive: financialBillsReceiveRouter,
  financialReceipt: financialReceiptRouter,
  group: groupRouter,
  invoiceDfe: invoiceDfeRouter,
  invoiceEntry: invoiceEntryRouter,
  products: productsRouter,
  productsSale: productsSaleRouter,
  receiptType: receiptTypeRouter,
  reports: reportsRouter,
  sales: salesRouter,
  seller: sellerRouter,
  salesBudget: salesBudgetRouter,
  supplier: supplierRouter,
});
