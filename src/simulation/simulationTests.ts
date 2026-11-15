import { calculateLinkBudget } from "./calculations";
import { DEFAULT_PARAMETERS } from "./constants";
import type { LinkBudgetInputs, LinkBudgetResults } from "./types";

declare const process: { exit: (code?: number) => never };

interface TestScenario {
  name: string;
  run: () => boolean;
}

const scenarios: TestScenario[] = [];

function assertApprox(actual: number, expected: number, tolerance = 0.05, label = ""): boolean {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    console.error(`  FAIL: ${label} - Expected ~${expected}, got ${actual} (diff: ${diff.toFixed(4)} > ${tolerance})`);
    return false;
  }
  return true;
}

function assertEqual<T>(actual: T, expected: T, label = ""): boolean {
  if (actual !== expected) {
    console.error(`  FAIL: ${label} - Expected ${expected}, got ${actual}`);
    return false;
  }
  return true;
}

// --------------------------------------------------------------------------
// 1. DEFAULT GEO C-BAND SIMULATION
// --------------------------------------------------------------------------
scenarios.push({
  name: "1. Default GEO C-Band Simulation",
  run: () => {
    const res = calculateLinkBudget(DEFAULT_PARAMETERS);
    let ok = true;
    ok = assertApprox(res.eirp, 59.00, 0.05, "EIRP") && ok;
    ok = assertApprox(res.fspl, 195.57, 0.05, "FSPL") && ok;
    ok = assertApprox(res.receivedPower, -104.07, 0.05, "Received Power") && ok;
    ok = assertApprox(res.cn0, 105.53, 0.05, "C/N0") && ok;
    ok = assertApprox(res.cn, 29.97, 0.05, "C/N") && ok;
    ok = assertApprox(res.linkMargin, 19.97, 0.05, "Link Margin") && ok;
    ok = assertEqual(res.linkStatus, "EXCELLENT", "Link Status") && ok;
    return ok;
  },
});

// --------------------------------------------------------------------------
// 2. GEO KU-BAND SIMULATION
// --------------------------------------------------------------------------
scenarios.push({
  name: "2. GEO Ku-Band Simulation (12 GHz, 35786 km)",
  run: () => {
    const kuInputs: LinkBudgetInputs = {
      ...DEFAULT_PARAMETERS,
      frequency: 12,
      propagationLosses: 2.5,
    };
    const res = calculateLinkBudget(kuInputs);
    // FSPL = 92.45 + 20*log10(12) + 20*log10(35786) = 92.45 + 21.5836 + 91.0743 = 205.11 dB
    let ok = true;
    ok = assertApprox(res.fspl, 205.11, 0.1, "FSPL") && ok;
    ok = assertApprox(res.eirp, 59.00, 0.05, "EIRP") && ok;
    // C/N0 = 59 - 205.11 - 2.5 + 15 + 228.6 = 94.99 dB-Hz
    ok = assertApprox(res.cn0, 94.99, 0.1, "C/N0") && ok;
    // C/N = 94.99 - 10*log10(36e6) = 94.99 - 75.56 = 19.43 dB
    ok = assertApprox(res.cn, 19.43, 0.1, "C/N") && ok;
    ok = assertApprox(res.linkMargin, 9.43, 0.1, "Link Margin") && ok;
    ok = assertEqual(res.linkStatus, "GOOD", "Link Status") && ok;
    return ok;
  },
});

// --------------------------------------------------------------------------
// 3. FREQUENCY SENSITIVITY TEST
// --------------------------------------------------------------------------
scenarios.push({
  name: "3. Frequency Sensitivity (Doubling frequency increases FSPL by 6.02 dB)",
  run: () => {
    const base = calculateLinkBudget({ ...DEFAULT_PARAMETERS, frequency: 4 });
    const doubled = calculateLinkBudget({ ...DEFAULT_PARAMETERS, frequency: 8 });
    const deltaFspl = doubled.fspl - base.fspl;
    // 20 * log10(2) = 6.0206 dB
    const ok = assertApprox(deltaFspl, 6.02, 0.05, "FSPL delta on frequency doubling");
    return ok;
  },
});

// --------------------------------------------------------------------------
// 4. BANDWIDTH SENSITIVITY TEST
// --------------------------------------------------------------------------
scenarios.push({
  name: "4. Bandwidth Sensitivity (Doubling bandwidth decreases C/N by 3.01 dB, C/N0 unchanged)",
  run: () => {
    const base = calculateLinkBudget({ ...DEFAULT_PARAMETERS, bandwidth: 36 });
    const doubled = calculateLinkBudget({ ...DEFAULT_PARAMETERS, bandwidth: 72 });
    let ok = true;
    ok = assertApprox(base.cn0, doubled.cn0, 0.01, "C/N0 unchanged") && ok;
    ok = assertApprox(base.cn - doubled.cn, 3.01, 0.05, "C/N drops by 3.01 dB on 2x bandwidth") && ok;
    return ok;
  },
});

// --------------------------------------------------------------------------
// 5. DISTANCE SENSITIVITY TEST
// --------------------------------------------------------------------------
scenarios.push({
  name: "5. Distance Sensitivity (Doubling distance increases FSPL by 6.02 dB)",
  run: () => {
    const base = calculateLinkBudget({ ...DEFAULT_PARAMETERS, distance: 10000 });
    const doubled = calculateLinkBudget({ ...DEFAULT_PARAMETERS, distance: 20000 });
    const deltaFspl = doubled.fspl - base.fspl;
    return assertApprox(deltaFspl, 6.02, 0.05, "FSPL delta on distance doubling");
  },
});

// --------------------------------------------------------------------------
// 6. PROPAGATION LOSS SENSITIVITY (User Prompt Test 1)
// --------------------------------------------------------------------------
scenarios.push({
  name: "6. User Prompt Test 1 - Propagation Loss Sensitivity",
  run: () => {
    const test1Inputs: LinkBudgetInputs = {
      transmitterPower: 25,
      transmitAntennaGain: 42,
      transmitLosses: 1.5,
      frequency: 24,
      distance: 17900,
      propagationLosses: 4.5,
      receiveAntennaGain: 38,
      receiveLosses: 1,
      receiverGT: 18,
      bandwidth: 108.1,
      requiredCN: 12,
    };
    const r = calculateLinkBudget(test1Inputs);
    let ok = true;
    ok = assertApprox(r.eirp, 65.50, 0.05, "EIRP: 65.50 dBW") && ok;
    ok = assertApprox(r.fspl, 205.11, 0.05, "FSPL: ~205.11 dB") && ok;
    ok = assertApprox(r.receivedPower, -107.11, 0.05, "Received Power: ~-107.11 dBW") && ok;
    ok = assertApprox(r.cn0, 102.49, 0.05, "C/N0: ~102.49 dB-Hz") && ok;
    ok = assertApprox(r.cn, 22.15, 0.05, "C/N: ~22.15 dB") && ok;
    ok = assertApprox(r.linkMargin, 10.15, 0.05, "Link Margin: ~+10.15 dB") && ok;
    ok = assertEqual(r.linkStatus, "EXCELLENT", "Status: EXCELLENT") && ok;
    return ok;
  },
});

// --------------------------------------------------------------------------
// 7. TRANSMITTER POWER SENSITIVITY (User Prompt Test 2)
// --------------------------------------------------------------------------
scenarios.push({
  name: "7. User Prompt Test 2 - Transmitter Power Sensitivity (+3 dB Pt)",
  run: () => {
    const test1Inputs: LinkBudgetInputs = {
      transmitterPower: 25,
      transmitAntennaGain: 42,
      transmitLosses: 1.5,
      frequency: 24,
      distance: 17900,
      propagationLosses: 4.5,
      receiveAntennaGain: 38,
      receiveLosses: 1,
      receiverGT: 18,
      bandwidth: 108.1,
      requiredCN: 12,
    };
    const r1 = calculateLinkBudget(test1Inputs);
    const r2 = calculateLinkBudget({ ...test1Inputs, transmitterPower: 28 });
    let ok = true;
    ok = assertApprox(r2.eirp - r1.eirp, 3.00, 0.01, "EIRP increases by 3 dB") && ok;
    ok = assertApprox(r2.receivedPower - r1.receivedPower, 3.00, 0.01, "Received power increases by 3 dB") && ok;
    ok = assertApprox(r2.cn0 - r1.cn0, 3.00, 0.01, "C/N0 increases by 3 dB") && ok;
    ok = assertApprox(r2.cn - r1.cn, 3.00, 0.01, "C/N increases by 3 dB") && ok;
    ok = assertApprox(r2.linkMargin - r1.linkMargin, 3.00, 0.01, "Link margin increases by 3 dB") && ok;
    ok = assertApprox(r2.fspl - r1.fspl, 0.00, 0.01, "FSPL unchanged") && ok;
    return ok;
  },
});

// --------------------------------------------------------------------------
// 8. GEO C-BAND PRESET (User Prompt Test 3)
// --------------------------------------------------------------------------
scenarios.push({
  name: "8. User Prompt Test 3 - GEO C-Band Preset (35,786 km, 4 GHz)",
  run: () => {
    const geoInputs: LinkBudgetInputs = {
      distance: 35786,
      frequency: 4,
      bandwidth: 36,
      transmitterPower: 20,
      transmitAntennaGain: 40,
      transmitLosses: 1,
      receiveAntennaGain: 35,
      receiveLosses: 1,
      receiverGT: 15,
      propagationLosses: 1.5,
      requiredCN: 10,
    };
    const r = calculateLinkBudget(geoInputs);
    let ok = true;
    ok = assertApprox(r.eirp, 59.00, 0.05, "EIRP") && ok;
    ok = assertApprox(r.fspl, 195.57, 0.05, "FSPL") && ok;
    ok = assertApprox(r.linkMargin, 19.97, 0.05, "Margin") && ok;
    ok = assertEqual(r.linkStatus, "EXCELLENT", "Status") && ok;
    return ok;
  },
});

// --------------------------------------------------------------------------
// 9. LEO KU-BAND PRESET (User Prompt Test 4: 550 km, 12 GHz)
// --------------------------------------------------------------------------
scenarios.push({
  name: "9. User Prompt Test 4 - LEO Ku-Band Preset (550 km, 12 GHz)",
  run: () => {
    const leoInputs: LinkBudgetInputs = {
      distance: 550,
      frequency: 12,
      bandwidth: 250,
      transmitterPower: 14,
      transmitAntennaGain: 34,
      transmitLosses: 1,
      receiveAntennaGain: 38,
      receiveLosses: 1,
      receiverGT: 12,
      propagationLosses: 2.2,
      requiredCN: 8,
    };
    const r = calculateLinkBudget(leoInputs);
    // FSPL = 92.45 + 20*log10(12) + 20*log10(550) = 92.45 + 21.5836 + 54.807 = 168.84 dB
    let ok = true;
    ok = assertApprox(r.fspl, 168.84, 0.1, "LEO FSPL (~168.84 dB)") && ok;
    ok = assertApprox(r.eirp, 47.00, 0.05, "LEO EIRP (47 dBW)") && ok;
    ok = assertEqual(r.linkStatus === "EXCELLENT" || r.linkStatus === "GOOD", true, "Status is healthy") && ok;
    return ok;
  },
});

// --------------------------------------------------------------------------
// 10. DEEP SPACE LUNAR RELAY PRESET (User Prompt Test 5: 384,400 km, 8.4 GHz)
// --------------------------------------------------------------------------
scenarios.push({
  name: "10. User Prompt Test 5 - Lunar Relay Preset (384,400 km, 8.4 GHz)",
  run: () => {
    const lunarInputs: LinkBudgetInputs = {
      distance: 384400,
      frequency: 8.4,
      bandwidth: 5,
      transmitterPower: 25,
      transmitAntennaGain: 48,
      transmitLosses: 1,
      receiveAntennaGain: 60,
      receiveLosses: 1,
      receiverGT: 28,
      propagationLosses: 0.5,
      requiredCN: 6,
    };
    const r = calculateLinkBudget(lunarInputs);
    // FSPL = 92.45 + 20*log10(8.4) + 20*log10(384400) = 92.45 + 18.4856 + 111.696 = 222.63 dB
    let ok = true;
    ok = assertApprox(r.fspl, 222.63, 0.1, "Lunar FSPL (~222.63 dB)") && ok;
    ok = assertApprox(r.eirp, 72.00, 0.05, "Lunar EIRP (72 dBW)") && ok;
    ok = (r.linkMargin > 0) && ok;
    return ok;
  },
});

// --------------------------------------------------------------------------
// 11. ENVIRONMENTAL STRESS TESTS (7 Scenarios from Prompt Section 5)
// --------------------------------------------------------------------------
scenarios.push({
  name: "11. Environmental Stress Testing (7 Realistic Scenarios)",
  run: () => {
    const base = calculateLinkBudget(DEFAULT_PARAMETERS);
    const stressScenarios = [
      { name: "Clear Sky", delta: {}, expDelta: 0 },
      { name: "Light Cloud", delta: { propagationLosses: DEFAULT_PARAMETERS.propagationLosses + 0.5 }, expDelta: -0.5 },
      { name: "Moderate Rain", delta: { propagationLosses: DEFAULT_PARAMETERS.propagationLosses + 2.5 }, expDelta: -2.5 },
      { name: "Heavy Rain Fade", delta: { propagationLosses: DEFAULT_PARAMETERS.propagationLosses + 6.0 }, expDelta: -6.0 },
      { name: "Severe Storm", delta: { propagationLosses: DEFAULT_PARAMETERS.propagationLosses + 10.0 }, expDelta: -10.0 },
      { name: "Antenna Misalignment", delta: { receiveLosses: DEFAULT_PARAMETERS.receiveLosses + 1.5 }, expDelta: 0 }, // note: receiveLosses affects receivedPower
      { name: "Transmitter Power Back-off", delta: { transmitterPower: DEFAULT_PARAMETERS.transmitterPower - 3.0 }, expDelta: -3.0 },
    ];

    let allOk = true;
    for (const sc of stressScenarios) {
      const res = calculateLinkBudget({ ...DEFAULT_PARAMETERS, ...sc.delta });
      if (sc.name !== "Antenna Misalignment") {
        const marginDelta = res.linkMargin - base.linkMargin;
        const ok = assertApprox(marginDelta, sc.expDelta, 0.05, `${sc.name} margin delta`);
        allOk = allOk && ok;
      } else {
        const pwrDelta = res.receivedPower - base.receivedPower;
        const ok = assertApprox(pwrDelta, -1.5, 0.05, "Antenna Misalignment received power delta");
        allOk = allOk && ok;
      }
    }
    return allOk;
  },
});

// --------------------------------------------------------------------------
// 12. INVALID INPUT HANDLING (Prompt Section 6)
// --------------------------------------------------------------------------
scenarios.push({
  name: "12. Invalid Input Rejection (zero/negative/NaN constraints)",
  run: () => {
    let ok = true;
    // Zero frequency
    try {
      calculateLinkBudget({ ...DEFAULT_PARAMETERS, frequency: 0 });
      ok = false;
    } catch {
      // Expected
    }

    // Negative distance
    try {
      calculateLinkBudget({ ...DEFAULT_PARAMETERS, distance: -500 });
      ok = false;
    } catch {
      // Expected
    }

    // Zero bandwidth
    try {
      calculateLinkBudget({ ...DEFAULT_PARAMETERS, bandwidth: 0 });
      ok = false;
    } catch {
      // Expected
    }

    // Negative propagation loss
    try {
      calculateLinkBudget({ ...DEFAULT_PARAMETERS, propagationLosses: -1 });
      ok = false;
    } catch {
      // Expected
    }

    // NaN parameter
    try {
      calculateLinkBudget({ ...DEFAULT_PARAMETERS, transmitterPower: NaN });
      ok = false;
    } catch {
      // Expected
    }

    return ok;
  },
});

// --------------------------------------------------------------------------
// 13. RESET TO DEFAULTS
// --------------------------------------------------------------------------
scenarios.push({
  name: "13. Reset to Defaults Integrity",
  run: () => {
    const res = calculateLinkBudget(DEFAULT_PARAMETERS);
    return res.eirp === 59 && res.linkStatus === "EXCELLENT";
  },
});

// --------------------------------------------------------------------------
// 14. PRESET INTEGRITY (Complete parameter sets)
// --------------------------------------------------------------------------
scenarios.push({
  name: "14. Preset Integrity (All fields defined, no NaN)",
  run: () => {
    const presets = [
      { distance: 35786, frequency: 4, bandwidth: 36, transmitterPower: 20, transmitAntennaGain: 40, transmitLosses: 1, receiveAntennaGain: 35, receiveLosses: 1, receiverGT: 15, propagationLosses: 1.5, requiredCN: 10 },
      { distance: 550, frequency: 12, bandwidth: 250, transmitterPower: 14, transmitAntennaGain: 34, transmitLosses: 1, receiveAntennaGain: 38, receiveLosses: 1, receiverGT: 12, propagationLosses: 2.2, requiredCN: 8 },
      { distance: 384400, frequency: 8.4, bandwidth: 5, transmitterPower: 25, transmitAntennaGain: 48, transmitLosses: 1, receiveAntennaGain: 60, receiveLosses: 1, receiverGT: 28, propagationLosses: 0.5, requiredCN: 6 },
    ];

    for (const p of presets) {
      const res = calculateLinkBudget(p);
      if (!Number.isFinite(res.eirp) || !Number.isFinite(res.fspl) || !Number.isFinite(res.cn)) {
        return false;
      }
    }
    return true;
  },
});

// --------------------------------------------------------------------------
// 15. LINK MARGIN THRESHOLD CLASSIFICATION
// --------------------------------------------------------------------------
scenarios.push({
  name: "15. Link Margin Status Classification Thresholds",
  run: () => {
    const testStatus = (margin: number): LinkBudgetResults["linkStatus"] => {
      // simulate margin
      const requiredCN = 10;
      const inputs: LinkBudgetInputs = { ...DEFAULT_PARAMETERS, requiredCN, transmitterPower: 20 + (margin - 19.97) };
      return calculateLinkBudget(inputs).linkStatus;
    };

    let ok = true;
    ok = assertEqual(testStatus(12), "EXCELLENT", ">= 10 dB -> EXCELLENT") && ok;
    ok = assertEqual(testStatus(5), "GOOD", "3 to 10 dB -> GOOD") && ok;
    ok = assertEqual(testStatus(1.5), "MARGINAL", "0 to 3 dB -> MARGINAL") && ok;
    ok = assertEqual(testStatus(-2), "FAILED", "< 0 dB -> FAILED") && ok;
    return ok;
  },
});

// --------------------------------------------------------------------------
// RUNNER
// --------------------------------------------------------------------------
console.log("=================================================");
console.log("  SATLINK COMPREHENSIVE SIMULATION TEST SUITE");
console.log("=================================================");

let passed = 0;
let failed = 0;

for (const sc of scenarios) {
  try {
    const ok = sc.run();
    if (ok) {
      console.log(`[PASS] ${sc.name}`);
      passed++;
    } else {
      console.log(`[FAIL] ${sc.name}`);
      failed++;
    }
  } catch (err) {
    console.error(`[ERROR] ${sc.name}:`, err);
    failed++;
  }
}

console.log("=================================================");
console.log(`Total: ${scenarios.length} | Passed: ${passed} | Failed: ${failed}`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
