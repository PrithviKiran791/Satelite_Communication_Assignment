import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import type { LinkBudgetInputs, LinkBudgetResults } from "../../simulation/types";
import { calculateLinkBudget } from "../../simulation/calculations";
import { GeospatialAnalyticsGlobe } from "./GeospatialAnalyticsGlobe";

export interface AnalyticsDashboardProps {
  parameters: LinkBudgetInputs;
  onOpenConfig?: () => void;
}

// Custom Glassmorphism Tooltip for Recharts
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number | string; unit?: string }[];
  label?: string | number;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-modal p-3 border border-white/20 text-xs shadow-2xl">
        <p className="font-bold text-white border-b border-white/14 pb-1 mb-1.5 uppercase tracking-wider text-[11px]">
          {label}
        </p>
        {payload.map((item, idx) => (
          <p key={idx} className="text-[#B8B8B8] flex justify-between gap-4 text-[11px]">
            <span>{item.name}:</span>
            <strong className="text-white font-bold tabular-nums">{item.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function AnalyticsDashboard({
  parameters,
  onOpenConfig,
}: AnalyticsDashboardProps) {
  // Current link budget results
  const currentResults = useMemo<LinkBudgetResults>(() => {
    return calculateLinkBudget(parameters);
  }, [parameters]);

  /* -------------------------------------------------------------------------- */
  /* 1. FREQUENCY VS FREE SPACE PATH LOSS (FSPL)                                */
  /* -------------------------------------------------------------------------- */
  const frequencyChartData = useMemo(() => {
    const points: { frequency: number; fspl: number; band: string }[] = [];
    const baseFreqs = [
      1.2, 1.5, 2.0, 2.4, 3.0, 4.0, 5.0, 6.0, 7.2, 8.4, 10.0,
      11.7, 12.5, 14.25, 17.7, 20.0, 24.0, 28.0, 30.0, 35.0, 40.0, 44.0
    ];

    if (!baseFreqs.some((f) => Math.abs(f - parameters.frequency) < 0.2)) {
      baseFreqs.push(parameters.frequency);
    }
    baseFreqs.sort((a, b) => a - b);

    for (const f of baseFreqs) {
      let band: string;
      if (f < 2) band = "L-band";
      else if (f < 4) band = "S-band";
      else if (f < 8) band = "C-band";
      else if (f < 12) band = "X-band";
      else if (f < 18) band = "Ku-band";
      else if (f < 27) band = "K/Ka-band";
      else if (f < 40) band = "Ka-band";
      else band = "Q/V-band";

      const res = calculateLinkBudget({ ...parameters, frequency: f });
      points.push({
        frequency: parseFloat(f.toFixed(2)),
        fspl: parseFloat(res.fspl.toFixed(2)),
        band,
      });
    }

    return points;
  }, [parameters]);

  /* -------------------------------------------------------------------------- */
  /* 2. DISTANCE VS RECEIVED POWER (LEO -> GEO -> LUNAR)                        */
  /* -------------------------------------------------------------------------- */
  const distanceChartData = useMemo(() => {
    const points: { distance: number; receivedPower: number; orbit: string }[] = [];
    const distances = [
      200, 350, 550, 800, 1200, 2000, 5000, 10000, 20000, 35786, 50000,
      100000, 200000, 384400
    ];

    if (!distances.some((d) => Math.abs(d - parameters.distance) < d * 0.05)) {
      distances.push(parameters.distance);
    }
    distances.sort((a, b) => a - b);

    for (const d of distances) {
      let orbit: string;
      if (d <= 2000) orbit = "LEO";
      else if (d <= 35785) orbit = "MEO";
      else if (d <= 36000) orbit = "GEO";
      else orbit = "Deep Space";

      const res = calculateLinkBudget({ ...parameters, distance: d });
      points.push({
        distance: d,
        receivedPower: parseFloat(res.receivedPower.toFixed(2)),
        orbit,
      });
    }

    return points;
  }, [parameters]);

  /* -------------------------------------------------------------------------- */
  /* 3. BANDWIDTH VS CARRIER-TO-NOISE (C/N)                                     */
  /* -------------------------------------------------------------------------- */
  const bandwidthChartData = useMemo(() => {
    const points: { bandwidth: number; cn: number; cn0: number }[] = [];
    const bandwidths = [
      1, 2, 5, 10, 18, 27, 36, 54, 72, 100, 125, 150, 200, 250, 350, 500
    ];

    if (!bandwidths.some((b) => Math.abs(b - parameters.bandwidth) < 2)) {
      bandwidths.push(parameters.bandwidth);
    }
    bandwidths.sort((a, b) => a - b);

    for (const b of bandwidths) {
      const res = calculateLinkBudget({ ...parameters, bandwidth: b });
      points.push({
        bandwidth: b,
        cn: parseFloat(res.cn.toFixed(2)),
        cn0: parseFloat(res.cn0.toFixed(2)),
      });
    }

    return points;
  }, [parameters]);

  /* -------------------------------------------------------------------------- */
  /* 4. ENVIRONMENTAL STRESS SCENARIOS                                          */
  /* -------------------------------------------------------------------------- */
  const marginScenarios = useMemo(() => {
    const scenarios = [
      {
        id: "nominal",
        name: "Nominal",
        description: "Clear sky baseline",
        modifiedParams: { ...parameters },
      },
      {
        id: "light-cloud",
        name: "Light Cloud (+1.0 dB)",
        description: "Atmospheric cloud absorption",
        modifiedParams: {
          ...parameters,
          propagationLosses: parameters.propagationLosses + 1.0,
        },
      },
      {
        id: "moderate-rain",
        name: "Moderate Rain (+2.5 dB)",
        description: "Precipitation fade ~12 mm/hr",
        modifiedParams: {
          ...parameters,
          propagationLosses: parameters.propagationLosses + 2.5,
        },
      },
      {
        id: "heavy-rain",
        name: "Heavy Rain (+6.0 dB)",
        description: "Tropical precipitation ~40 mm/hr",
        modifiedParams: {
          ...parameters,
          propagationLosses: parameters.propagationLosses + 6.0,
        },
      },
      {
        id: "severe-storm",
        name: "Severe Storm (+10.0 dB)",
        description: "Convective cell deep fade",
        modifiedParams: {
          ...parameters,
          propagationLosses: parameters.propagationLosses + 10.0,
        },
      },
      {
        id: "antenna-misalign",
        name: "Misalignment (+1.5 dB)",
        description: "Boresight pointing offset",
        modifiedParams: {
          ...parameters,
          receiveLosses: parameters.receiveLosses + 1.5,
        },
      },
      {
        id: "tx-backoff",
        name: "Tx Back-off (-3 dBW)",
        description: "HPA amplifier linear back-off",
        modifiedParams: {
          ...parameters,
          transmitterPower: parameters.transmitterPower - 3,
        },
      },
    ];

    const nominalResult = calculateLinkBudget(parameters);

    return scenarios.map((scenario) => {
      const result = calculateLinkBudget(scenario.modifiedParams);
      const degradation = nominalResult.linkMargin - result.linkMargin;

      return {
        id: scenario.id,
        scenario: scenario.name,
        description: scenario.description,
        margin: parseFloat(result.linkMargin.toFixed(2)),
        cn: parseFloat(result.cn.toFixed(2)),
        status: result.linkStatus,
        degradation: parseFloat(degradation.toFixed(2)),
        receivedPower: parseFloat(result.receivedPower.toFixed(2)),
      };
    });
  }, [parameters]);

  const getStatusColor = (status: LinkBudgetResults["linkStatus"]) => {
    switch (status) {
      case "EXCELLENT":
        return "#10b981";
      case "GOOD":
        return "#ffffff";
      case "MARGINAL":
        return "#f59e0b";
      case "FAILED":
        return "#f43f5e";
      default:
        return "#777777";
    }
  };

  const statusBadgeColor = (status: LinkBudgetResults["linkStatus"]) => {
    switch (status) {
      case "EXCELLENT":
        return {
          text: "text-emerald-400",
          border: "border-emerald-500/30",
          bg: "bg-emerald-950/20",
          icon: CheckCircle2,
        };
      case "GOOD":
        return {
          text: "text-white",
          border: "border-white/20",
          bg: "bg-white/5",
          icon: CheckCircle2,
        };
      case "MARGINAL":
        return {
          text: "text-amber-400",
          border: "border-amber-500/30",
          bg: "bg-amber-950/20",
          icon: AlertTriangle,
        };
      case "FAILED":
        return {
          text: "text-rose-400",
          border: "border-rose-500/40",
          bg: "bg-rose-950/20",
          icon: XCircle,
        };
      default:
        return {
          text: "text-neutral-400",
          border: "border-neutral-700",
          bg: "bg-neutral-900/40",
          icon: AlertTriangle,
        };
    }
  };

  const badge = statusBadgeColor(currentResults.linkStatus);
  const StatusIcon = badge.icon;
  const receivedPowerDBm = currentResults.receivedPower + 30;

  return (
    <main className="p-6 md:p-8 space-y-6 bg-transparent">
      {/* HEADER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/14">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-white shrink-0" />
            <h1 className="text-base sm:text-lg font-bold text-white uppercase tracking-widest">
              PARAMETRIC SENSITIVITY & LINK ANALYTICS
            </h1>
          </div>
          <p className="text-xs text-[#777777] mt-0.5">
            Multi-band sweeps, distance attenuation, noise floor & stress testing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 border ${badge.border} ${badge.bg} glass-surface`}
          >
            <StatusIcon size={14} className={badge.text} />
            <span className={`text-xs font-bold uppercase tracking-wider ${badge.text}`}>
              {currentResults.linkStatus} (
              {currentResults.linkMargin >= 0
                ? `+${currentResults.linkMargin.toFixed(2)}`
                : currentResults.linkMargin.toFixed(2)}{" "}
              dB)
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenConfig}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-neutral-200 border border-white px-4 py-2 transition-all cursor-pointer shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
          >
            <Sliders size={13} className="text-black" />
            Configure
          </button>
        </div>
      </div>

      {/* ACTIVE LINK PERFORMANCE SUMMARY - GLASS PANEL */}
      <section className="glass-panel p-5 lg:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />

        <div className="flex justify-between items-center pb-3 mb-4 border-b border-white/10">
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">
              ACTIVE LINK PERFORMANCE SUMMARY
            </h2>
            <p className="text-[11px] text-[#777777] mt-0.5">
              Deterministic values evaluated using active transmission and propagation configuration
            </p>
          </div>
          <span className="text-[10px] text-white border border-white/20 glass-surface px-2.5 py-1 uppercase font-bold">
            11 PARAMETERS
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="glass-surface border border-white/10 p-3.5 hover:border-white/25 transition-all">
            <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider block">EIRP</span>
            <span className="text-xl font-extrabold text-white block mt-1 tabular-nums">
              {currentResults.eirp.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#777777] font-semibold">dBW</span>
          </div>

          <div className="glass-surface border border-white/10 p-3.5 hover:border-white/25 transition-all">
            <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider block">FSPL</span>
            <span className="text-xl font-extrabold text-white block mt-1 tabular-nums">
              {currentResults.fspl.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#777777] font-semibold">dB</span>
          </div>

          <div className="glass-surface border border-white/10 p-3.5 hover:border-white/25 transition-all">
            <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider block">Rx Power</span>
            <span className="text-xl font-extrabold text-white block mt-1 tabular-nums">
              {currentResults.receivedPower.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#777777] font-semibold">{receivedPowerDBm.toFixed(1)} dBm</span>
          </div>

          <div className="glass-surface border border-white/10 p-3.5 hover:border-white/25 transition-all">
            <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider block">C/N0 Density</span>
            <span className="text-xl font-extrabold text-white block mt-1 tabular-nums">
              {currentResults.cn0.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#777777] font-semibold">dB-Hz</span>
          </div>

          <div className="glass-surface border border-white/10 p-3.5 hover:border-white/25 transition-all">
            <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider block">Carrier-to-Noise</span>
            <span className="text-xl font-extrabold text-white block mt-1 tabular-nums">
              {currentResults.cn.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#777777] font-semibold">Req: {parameters.requiredCN} dB</span>
          </div>

          <div className="glass-surface border border-white/10 p-3.5 hover:border-white/25 transition-all">
            <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider block">Link Margin</span>
            <span className={`text-xl font-extrabold block mt-1 tabular-nums ${badge.text}`}>
              {currentResults.linkMargin > 0 ? `+${currentResults.linkMargin.toFixed(2)}` : currentResults.linkMargin.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#777777] font-semibold">{currentResults.linkStatus}</span>
          </div>
        </div>

        {/* Operating Configuration Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-[#B8B8B8]">
          <div>
            <span className="text-[#777777]">FREQUENCY:</span> <strong className="text-white font-bold">{parameters.frequency} GHz</strong>
          </div>
          <div>
            <span className="text-[#777777]">SLANT DISTANCE:</span> <strong className="text-white font-bold">{parameters.distance.toLocaleString()} km</strong>
          </div>
          <div>
            <span className="text-[#777777]">BANDWIDTH:</span> <strong className="text-white font-bold">{parameters.bandwidth} MHz</strong>
          </div>
          <div>
            <span className="text-[#777777]">RECEIVER G/T:</span> <strong className="text-white font-bold">{parameters.receiverGT} dB/K</strong>
          </div>
          <div>
            <span className="text-[#777777]">PROPAGATION LOSS:</span> <strong className="text-white font-bold">{parameters.propagationLosses} dB</strong>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 2. INTERACTIVE 3D SATELLITE & GEOSPATIAL VISUALIZATION               */}
      {/* -------------------------------------------------------------------- */}
      <section>
        <GeospatialAnalyticsGlobe
          parameters={parameters}
          results={currentResults}
          onOpenConfig={onOpenConfig}
        />
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 3. 2×2 ANALYTICS VISUALIZATION GRID                                  */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: FREQUENCY VS FSPL */}
        <section className="glass-panel p-5 lg:p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                  1. FREQUENCY VS FREE SPACE PATH LOSS
                </h3>
                <p className="text-[11px] text-[#777777] mt-0.5">
                  Microwave & millimeter path attenuation (d = {parameters.distance.toLocaleString()} km)
                </p>
              </div>
              <Radio size={14} className="text-white/80" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={frequencyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="monochromeFreq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="frequency"
                    stroke="#737373"
                    tick={{ fill: "#a3a3a3", fontSize: 10 }}
                    unit=" GHz"
                  />
                  <YAxis
                    stroke="#737373"
                    tick={{ fill: "#a3a3a3", fontSize: 10 }}
                    unit=" dB"
                    domain={["auto", "auto"]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    x={parameters.frequency}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{
                      value: `Active: ${parameters.frequency} GHz`,
                      fill: "#ffffff",
                      fontSize: 10,
                      position: "insideTopLeft",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="fspl"
                    name="FSPL"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#monochromeFreq)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#777777]">
            <span>Model: FSPL = 92.45 + 20·log₁₀(f) + 20·log₁₀(d)</span>
            <span className="text-white font-bold">Active FSPL: {currentResults.fspl.toFixed(2)} dB</span>
          </div>
        </section>

        {/* CHART 2: DISTANCE VS RECEIVED POWER */}
        <section className="glass-panel p-5 lg:p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                  2. DISTANCE VS RECEIVED SIGNAL POWER
                </h3>
                <p className="text-[11px] text-[#777777] mt-0.5">
                  Inverse-square loss from LEO to Lunar orbit (f = {parameters.frequency} GHz)
                </p>
              </div>
              <Radio size={14} className="text-white/80" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={distanceChartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="monochromeDist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="distance"
                    stroke="#737373"
                    tick={{ fill: "#a3a3a3", fontSize: 10 }}
                    tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : `${val}`)}
                    unit=" km"
                  />
                  <YAxis
                    stroke="#737373"
                    tick={{ fill: "#a3a3a3", fontSize: 10 }}
                    unit=" dBW"
                    domain={["auto", "auto"]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    x={parameters.distance}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{
                      value: `Active: ${parameters.distance.toLocaleString()} km`,
                      fill: "#ffffff",
                      fontSize: 10,
                      position: "insideTopLeft",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="receivedPower"
                    name="Rx Power (dBW)"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#monochromeDist)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#777777]">
            <span>Dynamic scale: 200 km - 384,400 km</span>
            <span className="text-white font-bold">Rx: {currentResults.receivedPower.toFixed(2)} dBW</span>
          </div>
        </section>

        {/* CHART 3: BANDWIDTH VS CARRIER-TO-NOISE */}
        <section className="glass-panel p-5 lg:p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                  3. BANDWIDTH VS CARRIER-TO-NOISE (C/N)
                </h3>
                <p className="text-[11px] text-[#777777] mt-0.5">
                  Thermal noise floor vs allocated transponder bandwidth (kTB)
                </p>
              </div>
              <Sliders size={14} className="text-white/80" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bandwidthChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="bandwidth"
                    stroke="#737373"
                    tick={{ fill: "#a3a3a3", fontSize: 10 }}
                    unit=" MHz"
                  />
                  <YAxis
                    stroke="#737373"
                    tick={{ fill: "#a3a3a3", fontSize: 10 }}
                    unit=" dB"
                    domain={["auto", "auto"]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={parameters.requiredCN}
                    stroke="#f43f5e"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{
                      value: `Req: ${parameters.requiredCN} dB`,
                      fill: "#f43f5e",
                      fontSize: 10,
                      position: "insideBottomRight",
                    }}
                  />
                  <ReferenceLine
                    x={parameters.bandwidth}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    label={{
                      value: `Active: ${parameters.bandwidth} MHz`,
                      fill: "#ffffff",
                      fontSize: 10,
                      position: "insideTopLeft",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cn"
                    name="C/N Ratio"
                    stroke="#ffffff"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#ffffff" }}
                    activeDot={{ r: 5, fill: "#ffffff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#777777]">
            <span>Demodulation Threshold: {parameters.requiredCN} dB</span>
            <span className="text-white font-bold">Current C/N: {currentResults.cn.toFixed(2)} dB</span>
          </div>
        </section>

        {/* CHART 4: ENVIRONMENTAL STRESS ANALYSIS */}
        <section className="glass-panel p-5 lg:p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                  4. ENVIRONMENTAL STRESS ANALYSIS
                </h3>
                <p className="text-[11px] text-[#777777] mt-0.5">
                  Link margin resilience across 7 rain, fade & misalignment scenarios
                </p>
              </div>
              <Sliders size={14} className="text-white/80" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marginScenarios} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="scenario"
                    stroke="#737373"
                    tick={{ fill: "#a3a3a3", fontSize: 9 }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    stroke="#737373"
                    tick={{ fill: "#a3a3a3", fontSize: 10 }}
                    unit=" dB"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#f43f5e" strokeWidth={1.5} />
                  <Bar dataKey="margin" name="Link Margin (dB)">
                    {marginScenarios.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getStatusColor(entry.status)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#777777]">
            <span>Nominal Margin: +{currentResults.linkMargin.toFixed(2)} dB</span>
            <span className="text-white font-bold">Worst Case: {marginScenarios[4]?.margin} dB</span>
          </div>
        </section>
      </div>

      {/* 5. ENVIRONMENTAL STRESS SCENARIO DETAILED TABLE - GLASS PANEL */}
      <section className="glass-panel p-5 lg:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />

        <div className="flex justify-between items-center pb-3 mb-4 border-b border-white/10">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">
              DETAILED SCENARIO DEGRADATION BREAKDOWN
            </h3>
            <p className="text-[11px] text-[#777777] mt-0.5">
              Side-by-side evaluation against nominal baseline (non-mutating calculations)
            </p>
          </div>
          <span className="text-[10px] text-white border border-white/20 glass-surface px-2.5 py-1 uppercase font-bold">
            7 SCENARIOS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/14 text-[10px] text-[#777777] uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3">Scenario</th>
                <th className="py-2.5 px-3">Condition / Fade Mechanism</th>
                <th className="py-2.5 px-3">C/N Ratio</th>
                <th className="py-2.5 px-3">Link Margin</th>
                <th className="py-2.5 px-3">Degradation</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {marginScenarios.map((sc) => {
                const statusInfo = statusBadgeColor(sc.status);
                return (
                  <tr key={sc.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{sc.scenario}</td>
                    <td className="py-2.5 px-3 text-[#B8B8B8] text-[11px]">{sc.description}</td>
                    <td className="py-2.5 px-3 text-white tabular-nums font-semibold">{sc.cn.toFixed(2)} dB</td>
                    <td className="py-2.5 px-3 font-bold tabular-nums">
                      <span className={statusInfo.text}>
                        {sc.margin > 0 ? `+${sc.margin.toFixed(2)}` : sc.margin.toFixed(2)} dB
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#B8B8B8] tabular-nums font-medium">
                      {sc.degradation > 0 ? `-${sc.degradation.toFixed(2)} dB` : "0.00 dB"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold border ${statusInfo.border} ${statusInfo.text} ${statusInfo.bg}`}>
                        {sc.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
