import type {
  ContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from "@orpc/contract"

import { catalogAdminContract, catalogContract } from "./contracts/catalog"
import { healthContract } from "./contracts/health"
import { settingsContract } from "./contracts/settings"
import { setupContract } from "./contracts/setup"
import { authMethodsContract, ssoContract } from "./contracts/sso"
import { userContract } from "./contracts/user"

/**
 * The API contract shared by the server (implementation) and client (typed calls).
 */
export const contract = {
  auth: authMethodsContract,
  catalog: catalogContract,
  catalogAdmin: catalogAdminContract,
  health: healthContract,
  settings: settingsContract,
  setup: setupContract,
  sso: ssoContract,
  user: userContract,
}

export type Contract = typeof contract
export type ApiClient = ContractRouterClient<Contract>
export type ApiInputs = InferContractRouterInputs<Contract>
export type ApiOutputs = InferContractRouterOutputs<Contract>

export * from "./schemas/catalog"
export * from "./schemas/settings"
export * from "./schemas/setup"
export * from "./schemas/sso"
export * from "./schemas/user"
