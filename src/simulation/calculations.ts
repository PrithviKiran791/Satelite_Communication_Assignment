import type {
  LinkBudgetInputs,
  LinkBudgetResults,
} from "./types";

import { BOLTZMANN_DB } from "./constants";

export function calculateLinkBudget(
  inputs: LinkBudgetInputs
): LinkBudgetResults {

  const {
    transmitterPower,
    transmitAntennaGain,
    transmitLosses,

    frequency,
    distance,

    propagationLosses,

    receiveAntennaGain,
    receiveLosses,

    receiverGT,
    bandwidth,
    requiredCN,
  } = inputs;

  // Validate inputs
  const values = Object.values(inputs);

  if (!values.every(Number.isFinite)) {
    throw new Error("All simulation parameters must be finite numbers.");
  }

  if (
    frequency <= 0 ||
    distance <= 0 ||
    bandwidth <= 0
  ) {
    throw new Error(
      "Frequency, distance and bandwidth must be greater than zero."
    );
  }

  if (
    transmitLosses < 0 ||
    propagationLosses < 0 ||
    receiveLosses < 0
  ) {
    throw new Error("Loss values cannot be negative.");
  }

  // 1. Effective Isotropic Radiated Power
  const eirp =
    transmitterPower +
    transmitAntennaGain -
    transmitLosses;

  // 2. Free Space Path Loss
  const fspl =
    92.45 +
    20 * Math.log10(frequency) +
    20 * Math.log10(distance);

  // 3. Total propagation and link losses
  const totalLosses =
    propagationLosses;

  // 4. Received Carrier Power
  const receivedPower =
    eirp -
    fspl -
    totalLosses +
    receiveAntennaGain -
    receiveLosses;

  // 5. Carrier-to-Noise Density Ratio
  const cn0 =
    eirp -
    fspl -
    totalLosses +
    receiverGT +
    BOLTZMANN_DB;

  // 6. Carrier-to-Noise Ratio
  const bandwidthHz = bandwidth * 1_000_000;

  const cn =
    cn0 - 10 * Math.log10(bandwidthHz);

  // 7. Link Margin
  const linkMargin =
    cn - requiredCN;

  // 8. Link Status
  let linkStatus: LinkBudgetResults["linkStatus"];

  if (linkMargin >= 10) {
    linkStatus = "EXCELLENT";
  } else if (linkMargin >= 3) {
    linkStatus = "GOOD";
  } else if (linkMargin >= 0) {
    linkStatus = "MARGINAL";
  } else {
    linkStatus = "FAILED";
  }

  return {
    eirp,
    fspl,
    receivedPower,
    cn0,
    cn,
    linkMargin,
    linkStatus,
  };
}