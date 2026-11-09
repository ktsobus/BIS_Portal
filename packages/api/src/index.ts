import type {
  ContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from "@orpc/contract"

import { healthContract } from "./contracts/health"
import { settingsContract } from "./contracts/settings"
import { setupContract } from "./contracts/setup"
import { authMethodsContract, ssoContract } from "./contracts/sso"
import { taskContract } from "./contracts/task"
import { userContract } from "./contracts/user"

/**
 * The API contract shared by the server (implementation) and client (typed calls).
 */
export const contract = {
  auth: authMethodsContract,
  health: healthContract,
  settings: settingsContract,
  setup: setupContract,
  sso: ssoContract,
  task: taskContract,
  user: userContract,
}

export type Contract = typeof contract
export type ApiClient = ContractRouterClient<Contract>
export type ApiInputs = InferContractRouterInputs<Contract>
export type ApiOutputs = InferContractRouterOutputs<Contract>

export * from "./schemas/settings"
export * from "./schemas/setup"
export * from "./schemas/sso"
export * from "./schemas/task"
export * from "./schemas/user"
