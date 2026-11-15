import type { LinkBudgetInputs } from "./types";

export const BOLTZMANN_DB = 228.6;

export const DEFAULT_PARAMETERS: LinkBudgetInputs = {
  transmitterPower: 20,
  transmitAntennaGain: 40,
  transmitLosses: 1,

  frequency: 4,
  distance: 35786,

  propagationLosses: 1.5,

  receiveAntennaGain: 35,
  receiveLosses: 1,

  receiverGT: 15,
  bandwidth: 36,

  requiredCN: 10,
};