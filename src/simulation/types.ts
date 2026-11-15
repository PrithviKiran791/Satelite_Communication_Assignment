export interface LinkBudgetInputs {
  transmitterPower: number;
  transmitAntennaGain: number;
  transmitLosses: number;

  frequency: number;
  distance: number;

  propagationLosses: number;

  receiveAntennaGain: number;
  receiveLosses: number;

  receiverGT: number;
  bandwidth: number;

  requiredCN: number;
}

export interface LinkBudgetResults {
  eirp: number;
  fspl: number;
  receivedPower: number;
  cn0: number;
  cn: number;
  linkMargin: number;
  linkStatus: "EXCELLENT" | "GOOD" | "MARGINAL" | "FAILED";
}