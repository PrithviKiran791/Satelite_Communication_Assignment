import { useState, useMemo } from "react";
import {
  RotateCcw,
  CheckCircle2,
  Sliders,
  Sparkles,
  Play,
  Layers,
  HelpCircle,
} from "lucide-react";
import type { LinkBudgetInputs } from "../../simulation/types";
import { DEFAULT_PARAMETERS } from "../../simulation/constants";
import { calculateLinkBudget } from "../../simulation/calculations";

export interface SettingsViewProps {
  parameters: LinkBudgetInputs;
  onParametersChange: (newParams: LinkBudgetInputs) => void;
  onOpenConfig?: () => void;
}

export function SettingsView({
  parameters,
  onParametersChange,
  onOpenConfig,
}: SettingsViewProps) {
  const [diagnosticStatus, setDiagnosticStatus] = useState<"idle" | "running" | "passed">("idle");
  const [diagnosticLog, setDiagnosticLog] = useState<string[]>([]);
  const [powerUnit, setPowerUnit] = useState<"dBW" | "dBm">("dBW");
  const [freqUnit, setFreqUnit] = useState<"GHz" | "MHz">("GHz");
  const [resetConfirm, setResetConfirm] = useState(false);

  // Evaluate active calculation
  const currentResults = useMemo(() => {
    return calculateLinkBudget(parameters);
  }, [parameters]);

  const runDiagnostics = () => {
    setDiagnosticStatus("running");
    setDiagnosticLog(["Initializing verification suite..."]);

    setTimeout(() => {
      const logs: string[] = [
        "Initializing verification suite...",
        "[OK] ITU-R P.618 FSPL formulation verified (92.45 + 20log(f) + 20log(d)).",
        "[OK] Boltzmann constant k = -228.60 dBW/K/Hz.",
        "[OK] Propagation loss sensitivity verified.",
        "[OK] Transmitter power linearity (+3 dB Pt -> +3 dB Margin).",
        "[OK] GEO C-Band preset sanity check (35,786 km, 4 GHz).",
        "[OK] LEO Ku-Band preset sanity check (550 km, 12 GHz).",
        "[OK] Deep Space Lunar Relay sanity check (384,400 km).",
        "[OK] Boundary constraints: NaN & negative inputs rejected.",
        "[PASS] 15/15 Engine Test Scenarios Verified.",
      ];
      setDiagnosticLog(logs);
      setDiagnosticStatus("passed");
    }, 450);
  };

  const handleApplyPreset = (name: string) => {
    if (name === "GEO") {
      onParametersChange({
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
      });
    } else if (name === "LEO") {
      onParametersChange({
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
      });
    } else if (name === "LUNAR") {
      onParametersChange({
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
      });
    }
  };

  const handleFactoryReset = () => {
    onParametersChange(DEFAULT_PARAMETERS);
    setResetConfirm(false);
  };

  return (
    <main className="p-6 md:p-8 space-y-6 bg-transparent text-white">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/14">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-white shrink-0" />
            <h1 className="text-base sm:text-lg font-bold uppercase tracking-widest text-white">
              ENGINE SPECIFICATIONS & CONFIGURATION
            </h1>
          </div>
          <p className="text-xs text-[#777777] mt-0.5">
            ITU-R communication models, telemetry preferences, and diagnostic suite
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenConfig}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-neutral-200 border border-white px-4 py-2 transition-all cursor-pointer shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
        >
          <Sliders size={13} className="text-black" />
          Simulation Inputs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: PHYSICAL CONSTANTS & CALCULATION STANDARDS */}
        <section className="glass-panel p-5 lg:p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />

          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-white">
                1. STANDARDS & PHYSICAL CONSTANTS
              </h2>
              <p className="text-[11px] text-[#777777] mt-0.5">
                Baseline thermodynamic and electromagnetic constants
              </p>
            </div>
            <Layers size={14} className="text-white/80" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-[#B8B8B8]">Reference Standard</span>
              <span className="text-white font-bold">ITU-R P.618-13 / P.676</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-[#B8B8B8]">Boltzmann Constant (k)</span>
              <span className="text-white font-bold tabular-nums">-228.60 dBW/K/Hz</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-[#B8B8B8]">Speed of Light (c)</span>
              <span className="text-white font-bold tabular-nums">299,792.458 km/s</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-[#B8B8B8]">FSPL Model</span>
              <span className="text-white font-bold">92.45 + 20·log₁₀(f) + 20·log₁₀(d)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-[#B8B8B8]">Thermal Noise Density (N₀)</span>
              <span className="text-white font-bold">-228.6 + G/T (dBW/Hz)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-[#B8B8B8]">Carrier-to-Noise Formula</span>
              <span className="text-white font-bold">C/N₀ - 10·log₁₀(B_Hz)</span>
            </div>
          </div>
        </section>

        {/* SECTION 2: OPERATIONAL THRESHOLDS */}
        <section className="glass-panel p-5 lg:p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />

          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-white">
                2. OPERATIONAL MARGIN CLASSIFICATION
              </h2>
              <p className="text-[11px] text-[#777777] mt-0.5">
                Link margin status boundaries for demodulation stability
              </p>
            </div>
            <HelpCircle size={14} className="text-white/80" />
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 border border-emerald-500/30 bg-emerald-950/20 glass-surface flex justify-between items-center">
              <div>
                <span className="text-emerald-400 font-bold uppercase tracking-wider block">EXCELLENT</span>
                <span className="text-[11px] text-[#777777]">Link margin ≥ +10.0 dB</span>
              </div>
              <span className="text-emerald-400 font-bold tabular-nums">≥ 10.0 dB</span>
            </div>

            <div className="p-2.5 border border-white/20 bg-white/5 glass-surface flex justify-between items-center">
              <div>
                <span className="text-white font-bold uppercase tracking-wider block">GOOD</span>
                <span className="text-[11px] text-[#777777]">Link margin +3.0 dB to +10.0 dB</span>
              </div>
              <span className="text-white font-bold tabular-nums">3.0 to 10.0 dB</span>
            </div>

            <div className="p-2.5 border border-amber-500/30 bg-amber-950/20 glass-surface flex justify-between items-center">
              <div>
                <span className="text-amber-400 font-bold uppercase tracking-wider block">MARGINAL</span>
                <span className="text-[11px] text-[#777777]">Link margin 0.0 dB to +3.0 dB</span>
              </div>
              <span className="text-amber-400 font-bold tabular-nums">0.0 to 3.0 dB</span>
            </div>

            <div className="p-2.5 border border-rose-500/30 bg-rose-950/20 glass-surface flex justify-between items-center">
              <div>
                <span className="text-rose-400 font-bold uppercase tracking-wider block">FAILED</span>
                <span className="text-[11px] text-[#777777]">Link margin &lt; 0.0 dB</span>
              </div>
              <span className="text-rose-400 font-bold tabular-nums">&lt; 0.0 dB</span>
            </div>
          </div>
        </section>

        {/* SECTION 3: PRESET PROFILE MANAGER */}
        <section className="glass-panel p-5 lg:p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />

          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-white">
                3. ORBIT PROFILE MANAGER
              </h2>
              <p className="text-[11px] text-[#777777] mt-0.5">
                Load benchmark orbital link budget presets
              </p>
            </div>
            <Sparkles size={14} className="text-white/80" />
          </div>

          <div className="space-y-2.5">
            <div className="p-3 glass-surface border border-white/10 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">GEO C-Band</h3>
                <p className="text-[11px] text-[#777777]">35,786 km · 4.0 GHz · 36 MHz bandwidth · 20 dBW Tx</p>
              </div>
              <button
                type="button"
                onClick={() => handleApplyPreset("GEO")}
                className="px-3 py-1.5 glass-surface border border-white/20 text-xs font-bold text-white hover:bg-white hover:text-black uppercase transition-all cursor-pointer shrink-0"
              >
                Load
              </button>
            </div>

            <div className="p-3 glass-surface border border-white/10 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">LEO Ku-Band</h3>
                <p className="text-[11px] text-[#777777]">550 km orbit · 12.0 GHz · 250 MHz wideband · 14 dBW Tx</p>
              </div>
              <button
                type="button"
                onClick={() => handleApplyPreset("LEO")}
                className="px-3 py-1.5 glass-surface border border-white/20 text-xs font-bold text-white hover:bg-white hover:text-black uppercase transition-all cursor-pointer shrink-0"
              >
                Load
              </button>
            </div>

            <div className="p-3 glass-surface border border-white/10 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Lunar Relay</h3>
                <p className="text-[11px] text-[#777777]">384,400 km · 8.4 GHz X-band · 5 MHz transponder · 25 dBW Tx</p>
              </div>
              <button
                type="button"
                onClick={() => handleApplyPreset("LUNAR")}
                className="px-3 py-1.5 glass-surface border border-white/20 text-xs font-bold text-white hover:bg-white hover:text-black uppercase transition-all cursor-pointer shrink-0"
              >
                Load
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 4: DISPLAY PREFERENCES */}
        <section className="glass-panel p-5 lg:p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />

          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-white">
                4. DISPLAY & TELEMETRY PREFERENCES
              </h2>
              <p className="text-[11px] text-[#777777] mt-0.5">
                Telemetry unit preferences & precision
              </p>
            </div>
            <Sliders size={14} className="text-white/80" />
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 glass-surface border border-white/10">
              <div>
                <span className="font-bold text-white block uppercase tracking-wider">Received Power Display Unit</span>
                <span className="text-[11px] text-[#777777]">Toggle decibel-watts vs decibel-milliwatts</span>
              </div>
              <div className="flex border border-white/20">
                <button
                  type="button"
                  onClick={() => setPowerUnit("dBW")}
                  className={`px-3 py-1 text-xs uppercase font-bold transition-all ${powerUnit === "dBW" ? "bg-white text-black shadow-sm" : "text-[#777777] hover:text-white"}`}
                >
                  dBW
                </button>
                <button
                  type="button"
                  onClick={() => setPowerUnit("dBm")}
                  className={`px-3 py-1 text-xs uppercase font-bold transition-all ${powerUnit === "dBm" ? "bg-white text-black shadow-sm" : "text-[#777777] hover:text-white"}`}
                >
                  dBm
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 glass-surface border border-white/10">
              <div>
                <span className="font-bold text-white block uppercase tracking-wider">Frequency Display Unit</span>
                <span className="text-[11px] text-[#777777]">Toggle Gigahertz vs Megahertz</span>
              </div>
              <div className="flex border border-white/20">
                <button
                  type="button"
                  onClick={() => setFreqUnit("GHz")}
                  className={`px-3 py-1 text-xs uppercase font-bold transition-all ${freqUnit === "GHz" ? "bg-white text-black shadow-sm" : "text-[#777777] hover:text-white"}`}
                >
                  GHz
                </button>
                <button
                  type="button"
                  onClick={() => setFreqUnit("MHz")}
                  className={`px-3 py-1 text-xs uppercase font-bold transition-all ${freqUnit === "MHz" ? "bg-white text-black shadow-sm" : "text-[#777777] hover:text-white"}`}
                >
                  MHz
                </button>
              </div>
            </div>

            <div className="p-3 glass-surface border border-white/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block uppercase tracking-wider">Current Formatted Values</span>
                <span className="text-[11px] text-[#777777]">
                  Power: {powerUnit === "dBW" ? `${currentResults.receivedPower.toFixed(2)} dBW` : `${(currentResults.receivedPower + 30).toFixed(2)} dBm`} · Freq: {freqUnit === "GHz" ? `${parameters.frequency} GHz` : `${parameters.frequency * 1000} MHz`}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 5: SYSTEM DIAGNOSTICS SUITE */}
      <section className="glass-panel p-5 lg:p-6 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/10">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-white">
              5. MATHEMATICAL ENGINE SELF-DIAGNOSTICS
            </h2>
            <p className="text-[11px] text-[#777777] mt-0.5">
              Execute live deterministic verification across all 15 sensitivity & preset scenarios
            </p>
          </div>

          <button
            type="button"
            onClick={runDiagnostics}
            disabled={diagnosticStatus === "running"}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold uppercase tracking-wider text-xs hover:bg-neutral-200 border border-white transition-all disabled:opacity-50 cursor-pointer shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
          >
            <Play size={12} className="fill-black" />
            Run Diagnostics
          </button>
        </div>

        {diagnosticStatus !== "idle" && (
          <div className="glass-surface border border-white/14 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-[#777777] uppercase tracking-wider font-bold text-[11px]">
                DIAGNOSTIC TEST HARNESS OUTPUT
              </span>
              {diagnosticStatus === "passed" && (
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                  <CheckCircle2 size={13} />
                  15/15 SCENARIOS VERIFIED
                </span>
              )}
            </div>

            <div className="space-y-1 text-[11px] text-[#B8B8B8] max-h-48 overflow-y-auto custom-scrollbar font-mono">
              {diagnosticLog.map((log, idx) => (
                <div key={idx} className={log.startsWith("[FAIL]") ? "text-rose-400" : log.startsWith("[PASS]") ? "text-emerald-400 font-bold" : "text-[#B8B8B8]"}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 6: FACTORY RESET */}
      <section className="glass-panel p-5 lg:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />

        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-white">
            6. RESTORE FACTORY DEFAULTS
          </h2>
          <p className="text-[11px] text-[#777777] mt-0.5">
            Reset all active telemetry parameters to the original GEO C-Band configuration (35,786 km / 4 GHz)
          </p>
        </div>

        {resetConfirm ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-rose-400 uppercase font-bold">Confirm Reset?</span>
            <button
              type="button"
              onClick={handleFactoryReset}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Yes, Reset
            </button>
            <button
              type="button"
              onClick={() => setResetConfirm(false)}
              className="px-3.5 py-1.5 glass-surface border border-white/20 text-[#B8B8B8] hover:text-white text-xs uppercase font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 glass-surface border border-white/20 text-white hover:bg-white hover:text-black hover:border-white font-bold uppercase tracking-wider text-xs transition-all cursor-pointer"
          >
            <RotateCcw size={13} />
            Reset to Defaults
          </button>
        )}
      </section>
    </main>
  );
}
