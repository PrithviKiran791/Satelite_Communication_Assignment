import { calculateLinkBudget } from "./calculations";
import { DEFAULT_PARAMETERS } from "./constants";

const results = calculateLinkBudget(DEFAULT_PARAMETERS);

console.log("SATLINK SIMULATION RESULTS");

console.log("---------------------------");

console.log(`EIRP: ${results.eirp.toFixed(2)} dBW`);

console.log(`FSPL: ${results.fspl.toFixed(2)} dB`);

console.log(
  `Received Power: ${results.receivedPower.toFixed(2)} dBW`
);

console.log(`C/N0: ${results.cn0.toFixed(2)} dB-Hz`);

console.log(`C/N: ${results.cn.toFixed(2)} dB`);

console.log(`Link Margin: ${results.linkMargin.toFixed(2)} dB`);

console.log(`Link Status: ${results.linkStatus}`);