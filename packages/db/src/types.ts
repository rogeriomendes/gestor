/** biome-ignore-all lint/performance/noBarrelFile: <explanation> */
// Re-export Prisma types for easier imports
export {
  AuditAction,
  AuditResourceType,
  Role,
} from "../prisma/generated/client";
