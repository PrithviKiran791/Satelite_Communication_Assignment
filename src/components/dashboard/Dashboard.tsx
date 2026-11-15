import { useState, useMemo } from "react";
import {
  Zap,
  Radio,
  Signal,
  Activity,
  Sliders,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import MetricCard from "./MetricCard";
import SatelliteGlobe from "../visualization/SatelliteGlobe";
import { SimulationForm } from "../simulation/SimulationForm";

import { calculateLinkBudget } from "../../simulation/calculations";
import { DEFAULT_PARAMETERS } from "../../simulation/constants";
import type { LinkBudgetInputs, LinkBudgetResults } from "../../simulation/types";

export interface DashboardProps {
  parameters?: LinkBudgetInputs;
  onParametersChange?: (params: LinkBudgetInputs) => void;
  isConfigOpen?: boolean;
  onConfigOpenChange?: (open: boolean) => void;
}

export default function Dashboard({
  parameters: controlledParameters,
  onParametersChange,
  isConfigOpen: controlledConfigOpen,
  onConfigOpenChange,
}: DashboardProps) {
  const [internalParameters, setInternalParameters] = useState<LinkBudgetInputs>(DEFAULT_PARAMETERS);
  const [internalConfigOpen, setInternalConfigOpen] = useState(false);
  const [simulationRanCount, setSimulationRanCount] = useState(0);

  const parameters = controlledParameters ?? internalParameters;

  // Support controlled or uncontrolled modal state
  const isConfigOpen = controlledConfigOpen ?? internalConfigOpen;
  const setConfigOpen = (open: boolean) => {
    if (onConfigOpenChange) {
      onConfigOpenChange(open);
    } else {
      setInternalConfigOpen(open);
    }
  };

  // Run calculation engine dynamically on parameter change
  const results = useMemo<LinkBudgetResults>(() => {
    return calculateLinkBudget(parameters);
  }, [parameters]);

  const metrics = useMemo(
    () => [
      {
        title: "EIRP",
        value: results.eirp.toFixed(2),
        unit: "dBW",
        description: "Effective radiated power",
        icon: Zap,
      },
      {
        title: "Free Space Loss",
        value: results.fspl.toFixed(2),
        unit: "dB",
        description: "Slant range path attenuation",
        icon: Radio,
      },
      {
        title: "Carrier-to-Noise",
        value: results.cn.toFixed(2),
        unit: "dB",
        description: "Transponder demodulation C/N",
        icon: Signal,
      },
      {
        title: "Link Margin",
        value: results.linkMargin.toFixed(2),
        unit: "dB",
        description: "Margin above required threshold",
        icon: Activity,
      },
    ],
    [results]
  );

  const configuration = useMemo(
    () => [
      ["Carrier Frequency", `${parameters.frequency.toFixed(2)} GHz`],
      ["Satellite Distance", `${parameters.distance.toLocaleString()} km`],
      ["Transmitter Power", `${parameters.transmitterPower.toFixed(1)} dBW`],
      ["Transmit Antenna Gain", `${parameters.transmitAntennaGain.toFixed(1)} dBi`],
      ["Transmit Losses", `${parameters.transmitLosses.toFixed(1)} dB`],
      ["Propagation Losses", `${parameters.propagationLosses.toFixed(1)} dB`],
      ["Receive Antenna Gain", `${parameters.receiveAntennaGain.toFixed(1)} dBi`],
      ["Receive Losses", `${parameters.receiveLosses.toFixed(1)} dB`],
      ["Receiver G/T", `${parameters.receiverGT.toFixed(1)} dB/K`],
      ["Transponder Bandwidth", `${parameters.bandwidth.toFixed(1)} MHz`],
      ["Required C/N Threshold", `${parameters.requiredCN.toFixed(1)} dB`],
    ],
    [parameters]
  );

  const handleRunSimulation = (newInputs: LinkBudgetInputs) => {
    if (onParametersChange) {
      onParametersChange(newInputs);
    } else {
      setInternalParameters(newInputs);
    }
    setSimulationRanCount((prev) => prev + 1);
  };

  const handleResetToDefault = () => {
    if (onParametersChange) {
      onParametersChange(DEFAULT_PARAMETERS);
    } else {
      setInternalParameters(DEFAULT_PARAMETERS);
    }
  };

  const getStatusBadge = (status: LinkBudgetResults["linkStatus"]) => {
    switch (status) {
      case "EXCELLENT":
        return {
          indicator: "bg-emerald-400",
          border: "border-emerald-500/30",
          bg: "bg-emerald-950/20",
          text: "text-emerald-400",
          icon: CheckCircle2,
          desc: "Link exceeds minimum threshold by >= 10 dB.",
        };
      case "GOOD":
        return {
          indicator: "bg-white",
          border: "border-white/20",
          bg: "bg-white/5",
          text: "text-white",
          icon: CheckCircle2,
          desc: "Nominal operational margin (3 to 10 dB).",
        };
      case "MARGINAL":
        return {
          indicator: "bg-amber-400",
          border: "border-amber-500/30",
          bg: "bg-amber-950/20",
          text: "text-amber-400",
          icon: AlertTriangle,
          desc: "Low margin (< 3 dB). Vulnerable to atmospheric fade.",
        };
      case "FAILED":
        return {
          indicator: "bg-rose-500",
          border: "border-rose-500/40",
          bg: "bg-rose-950/20",
          text: "text-rose-400",
          icon: XCircle,
          desc: "Signal is below demodulation threshold.",
        };
      default:
        return {
          indicator: "bg-slate-400",
          border: "border-white/20",
          bg: "bg-white/5",
          text: "text-slate-400",
          icon: AlertCircle,
          desc: "Status undefined.",
        };
    }
  };

  const statusBadge = getStatusBadge(results.linkStatus);
  const StatusIcon = statusBadge.icon;

  return (
    <main className="p-6 md:p-8 space-y-6 bg-transparent">
      {/* SECTION 1: LINK BUDGET PERFORMANCE METRICS */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-3 border-b border-white/14">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-white shrink-0" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-white">
                TELEMETRY // PERFORMANCE
              </h2>
            </div>
            <p className="text-xs text-[#777777] mt-0.5">
              Deterministic calculations evaluated via ITU-R space telecommunication standards
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfigOpen(true)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-neutral-200 border border-white px-4 py-2 transition-all cursor-pointer shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
            >
              <Sliders size={13} className="text-black" />
              Configure Simulation
            </button>

            <div className="glass-surface px-3 py-2 flex items-center gap-2 border border-white/14">
              <span className="w-1.5 h-1.5 bg-white animate-pulse" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                LIVE
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      </section>

      {/* SECTION 2: GLOBE & ACTIVE PARAMETERS COMPOSITION */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 3D VISUALIZATION - GLASS PANEL */}
        <div className="xl:col-span-2 glass-panel p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />

          <SatelliteGlobe />
        </div>

        {/* ACTIVE CONFIGURATION - GLASS PANEL */}
        <div className="glass-panel p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />

          <div>
            <div className="flex justify-between items-start pb-3 border-b border-white/10">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                  CONFIG // ACTIVE PARAMETERS
                </h3>
                <p className="text-[11px] text-[#777777] mt-0.5">
                  RF frequency, geometry & transponder gains
                </p>
              </div>

              <button
                type="button"
                onClick={() => setConfigOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white glass-surface hover:bg-white hover:text-black hover:border-white px-3 py-1 transition-all cursor-pointer"
              >
                <Sliders size={12} />
                Edit
              </button>
            </div>

            {/* SCROLLABLE PARAMETERS LIST - BRUTALIST DATA TABLE */}
            <div className="mt-4 border border-white/10 glass-surface p-3">
              <div className="flex justify-between items-center mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-[#777777] border-b border-white/10 pb-1.5">
                <span>Parameter</span>
                <span>Active Value</span>
              </div>

              <div className="space-y-1 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar">
                {configuration.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between items-center border-b border-white/[0.04] py-1 px-1 text-xs hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="text-[#B8B8B8] text-[11px]">{label}</span>
                    <span className="text-white font-bold text-[11px] tabular-nums">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LINK STATUS CARD */}
          <div
            className={`mt-5 p-4 glass-card border ${statusBadge.border}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon size={14} className={statusBadge.text} />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  OPERATIONAL STATUS
                </span>
              </div>
              {simulationRanCount > 0 && (
                <span className="text-[10px] text-[#777777]">
                  RUNS: {simulationRanCount}
                </span>
              )}
            </div>

            <div className="flex justify-between items-baseline mt-2.5 pt-2 border-t border-white/10">
              <span className={`text-xl font-black tracking-widest uppercase ${statusBadge.text}`}>
                {results.linkStatus}
              </span>
              <span className="text-xs text-[#B8B8B8]">
                MARGIN: <strong className="text-white font-extrabold tabular-nums">{results.linkMargin > 0 ? `+${results.linkMargin.toFixed(2)}` : results.linkMargin.toFixed(2)} dB</strong>
              </span>
            </div>

            <p className="text-[11px] text-[#777777] mt-1.5 leading-relaxed">
              {statusBadge.desc}
            </p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE CONFIGURATION MODAL */}
      {controlledConfigOpen === undefined && isConfigOpen && (
        <SimulationForm
          currentInputs={parameters}
          onRunSimulation={(newInputs) => {
            handleRunSimulation(newInputs);
            setConfigOpen(false);
          }}
          onResetToDefault={handleResetToDefault}
          onClose={() => setConfigOpen(false)}
          isModal={true}
        />
      )}
    </main>
  );
}
