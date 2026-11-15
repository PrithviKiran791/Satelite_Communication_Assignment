import { useState, useMemo, useEffect, useRef } from "react";
import {
  Play,
  RotateCcw,
  X,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Radio,
  Signal,
  Sliders,
  Sparkles,
} from "lucide-react";
import type { LinkBudgetInputs, LinkBudgetResults } from "../../simulation/types";
import { DEFAULT_PARAMETERS } from "../../simulation/constants";
import { calculateLinkBudget } from "../../simulation/calculations";

export interface SimulationFormProps {
  currentInputs: LinkBudgetInputs;
  onRunSimulation: (inputs: LinkBudgetInputs) => void;
  onResetToDefault?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

interface FieldConfig {
  key: keyof LinkBudgetInputs;
  label: string;
  unit: string;
  min?: number;
  max?: number;
  description: string;
}

const SECTIONS: {
  title: string;
  icon: typeof Zap;
  fields: FieldConfig[];
}[] = [
  {
    title: "Transmitter Parameters",
    icon: Zap,
    fields: [
      {
        key: "transmitterPower",
        label: "Transmitter Power",
        unit: "dBW",
        description: "Output RF power at amplifier",
      },
      {
        key: "transmitAntennaGain",
        label: "Transmit Antenna Gain",
        unit: "dBi",
        min: 0,
        description: "Boresight directive gain",
      },
      {
        key: "transmitLosses",
        label: "Transmit Losses",
        unit: "dB",
        min: 0,
        description: "Feeder & waveguide attenuation",
      },
    ],
  },
  {
    title: "Channel & Propagation",
    icon: Radio,
    fields: [
      {
        key: "frequency",
        label: "Carrier Frequency",
        unit: "GHz",
        min: 0.1,
        description: "Carrier RF frequency (> 0)",
      },
      {
        key: "distance",
        label: "Slant Range Distance",
        unit: "km",
        min: 0.1,
        description: "Path distance through space (> 0)",
      },
      {
        key: "propagationLosses",
        label: "Propagation Losses",
        unit: "dB",
        min: 0,
        description: "Atmospheric & rain losses",
      },
    ],
  },
  {
    title: "Receiver Parameters",
    icon: Signal,
    fields: [
      {
        key: "receiveAntennaGain",
        label: "Receive Antenna Gain",
        unit: "dBi",
        min: 0,
        description: "Ground station dish gain",
      },
      {
        key: "receiveLosses",
        label: "Receive Losses",
        unit: "dB",
        min: 0,
        description: "Waveguide & LNA coupling loss",
      },
      {
        key: "receiverGT",
        label: "Receiver G/T",
        unit: "dB/K",
        description: "Antenna gain-to-noise figure",
      },
    ],
  },
  {
    title: "Link Requirements",
    icon: Sliders,
    fields: [
      {
        key: "bandwidth",
        label: "Channel Bandwidth",
        unit: "MHz",
        min: 0.01,
        description: "Transponder noise bandwidth",
      },
      {
        key: "requiredCN",
        label: "Required C/N",
        unit: "dB",
        description: "Target demodulation threshold",
      },
    ],
  },
];

const PRESETS: {
  name: string;
  description: string;
  params: LinkBudgetInputs;
}[] = [
  {
    name: "GEO C-Band",
    description: "35,786 km · 4.0 GHz · 36 MHz",
    params: {
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
    },
  },
  {
    name: "LEO Ku-Band",
    description: "550 km · 12.0 GHz · 250 MHz",
    params: {
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
    },
  },
  {
    name: "Lunar Relay",
    description: "384,400 km · 8.4 GHz · 5 MHz",
    params: {
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
    },
  },
];

export function SimulationForm({
  currentInputs,
  onRunSimulation,
  onResetToDefault,
  onClose,
  isModal = true,
}: SimulationFormProps) {
  const [formData, setFormData] = useState<Record<keyof LinkBudgetInputs, string>>(() => {
    const init: Record<string, string> = {};
    for (const [k, v] of Object.entries(currentInputs)) {
      init[k] = String(v);
    }
    return init as Record<keyof LinkBudgetInputs, string>;
  });

  const [hasSuccessNotification, setHasSuccessNotification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const { parsedInputs, errors, isValid } = useMemo(() => {
    const errs: Record<string, string> = {};
    const parsed: Partial<LinkBudgetInputs> = {};

    for (const sec of SECTIONS) {
      for (const field of sec.fields) {
        const raw = formData[field.key]?.trim() ?? "";

        if (raw === "") {
          errs[field.key] = `${field.label} is required.`;
          continue;
        }

        const num = parseFloat(raw);
        if (Number.isNaN(num)) {
          errs[field.key] = `${field.label} must be a valid number.`;
          continue;
        }

        if (field.min !== undefined && num < field.min) {
          errs[field.key] = `Must be at least ${field.min} ${field.unit}.`;
          continue;
        }

        if (field.max !== undefined && num > field.max) {
          errs[field.key] = `Cannot exceed ${field.max} ${field.unit}.`;
          continue;
        }

        parsed[field.key] = num;
      }
    }

    const valid = Object.keys(errs).length === 0;
    return {
      parsedInputs: parsed as LinkBudgetInputs,
      errors: errs,
      isValid: valid,
    };
  }, [formData]);

  const previewResults = useMemo<LinkBudgetResults | null>(() => {
    if (!isValid) return null;
    try {
      return calculateLinkBudget(parsedInputs);
    } catch {
      return null;
    }
  }, [parsedInputs, isValid]);

  const handleFieldChange = (key: keyof LinkBudgetInputs, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasSuccessNotification(false);
  };

  const handleApplyPreset = (presetParams: LinkBudgetInputs) => {
    const updated: Record<string, string> = {};
    for (const [k, v] of Object.entries(presetParams)) {
      updated[k] = String(v);
    }
    setFormData(updated as Record<keyof LinkBudgetInputs, string>);
    setHasSuccessNotification(false);
  };

  const handleReset = () => {
    const def: Record<string, string> = {};
    for (const [k, v] of Object.entries(DEFAULT_PARAMETERS)) {
      def[k] = String(v);
    }
    setFormData(def as Record<keyof LinkBudgetInputs, string>);
    setHasSuccessNotification(false);
    onResetToDefault?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    onRunSimulation(parsedInputs);
    setHasSuccessNotification(true);

    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = setTimeout(() => {
      setHasSuccessNotification(false);
      setIsSubmitting(false);
    }, 3000);
  };

  const statusColor = (status: LinkBudgetResults["linkStatus"]) => {
    switch (status) {
      case "EXCELLENT":
        return "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
      case "GOOD":
        return "text-white border-white/20 bg-white/5";
      case "MARGINAL":
        return "text-amber-400 border-amber-500/30 bg-amber-950/20";
      case "FAILED":
        return "text-rose-400 border-rose-500/30 bg-rose-950/20";
      default:
        return "text-neutral-400 border-neutral-700 bg-neutral-900";
    }
  };

  const formContent = (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#060608]/90">
      {/* HEADER - Glassmorphic Header */}
      <div className="shrink-0 p-5 border-b border-white/14 flex items-center justify-between bg-black/40 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-white shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-widest uppercase">
              SIMULATION CONFIGURATION // PARAMETERS
            </h2>
          </div>
          <p className="text-xs text-[#777777] mt-0.5">
            Configure transmission power, orbital geometry & receiver figures
          </p>
        </div>

        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border border-white/20 text-[#B8B8B8] hover:text-white hover:border-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close configuration"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* BODY - Fluidly Scrollable Container */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-6 custom-scrollbar select-text">
        {/* PRESET CHIPS - High-Contrast Glass Selectors */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles size={13} className="text-white" />
            <span className="text-[11px] font-bold text-[#B8B8B8] uppercase tracking-wider">
              QUICK ORBIT PRESETS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset.params)}
                className="text-left p-3.5 glass-surface border border-white/14 hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer group w-full relative overflow-hidden"
              >
                <div className="text-xs font-bold text-white group-hover:text-black uppercase tracking-wider">
                  {preset.name}
                </div>
                <div className="text-[11px] text-[#777777] group-hover:text-neutral-800 mt-1 line-clamp-1">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* NOTIFICATION BANNER */}
        {hasSuccessNotification && (
          <div className="p-3 border border-white/30 glass-surface flex items-center gap-3">
            <CheckCircle2 size={16} className="text-white shrink-0" />
            <div className="text-xs text-white font-semibold uppercase tracking-wider">
              PARAMETERS COMMITTED. LINK BUDGET UPDATED.
            </div>
          </div>
        )}

        {/* INPUT GRID BY SECTIONS */}
        <form id="sim-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {SECTIONS.map((section) => {
              const Icon = section.icon;

              return (
                <div
                  key={section.title}
                  className="glass-panel p-4 space-y-3.5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-white/40" />

                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <Icon size={14} className="text-white" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {section.fields.map((field) => {
                      const error = errors[field.key];
                      const val = formData[field.key] ?? "";

                      return (
                        <div key={field.key} className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <label
                              htmlFor={field.key}
                              className="text-xs font-semibold text-[#B8B8B8]"
                            >
                              {field.label}
                            </label>
                            <span className="text-[10px] text-[#777777] uppercase font-bold">
                              {field.unit}
                            </span>
                          </div>

                          <div className="relative flex items-center">
                            <input
                              id={field.key}
                              type="number"
                              step="any"
                              value={val}
                              onWheel={(e) => e.currentTarget.blur()}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              className={`w-full bg-[#030303]/80 border pl-3 pr-14 py-2 text-xs text-white placeholder-neutral-600 tabular-nums transition focus:outline-none focus:ring-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                error
                                  ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/50"
                                  : "border-white/20 hover:border-white/40 focus:border-white focus:ring-white/40"
                              }`}
                            />
                            <div className="absolute right-2 pointer-events-none text-[10px] text-[#B8B8B8] font-bold glass-surface px-2 py-0.5 border border-white/10">
                              {field.unit}
                            </div>
                          </div>

                          {error ? (
                            <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-0.5">
                              <AlertTriangle size={12} className="shrink-0" />
                              {error}
                            </p>
                          ) : (
                            <p className="text-[10px] text-[#777777] line-clamp-1">
                              {field.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </form>

        {/* LIVE SIMULATION PREVIEW - High-Contrast Telemetry Banner */}
        {previewResults && (
          <div className="p-4 glass-panel border border-white/20 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-[#777777] font-bold tracking-widest">
                REAL-TIME PREVIEW // CALCULATED RESULTS
              </span>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-[#B8B8B8]">
                  EIRP: <strong className="text-white font-extrabold tabular-nums">{previewResults.eirp.toFixed(1)} dBW</strong>
                </span>
                <span className="text-[#444444]">|</span>
                <span className="text-[#B8B8B8]">
                  FSPL: <strong className="text-white font-extrabold tabular-nums">{previewResults.fspl.toFixed(1)} dB</strong>
                </span>
                <span className="text-[#444444]">|</span>
                <span className="text-[#B8B8B8]">
                  C/N: <strong className="text-white font-extrabold tabular-nums">{previewResults.cn.toFixed(2)} dB</strong>
                </span>
                <span className="text-[#444444]">|</span>
                <span className="text-[#B8B8B8]">
                  MARGIN: <strong className="text-white font-extrabold tabular-nums">{previewResults.linkMargin > 0 ? `+${previewResults.linkMargin.toFixed(2)}` : previewResults.linkMargin.toFixed(2)} dB</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#777777] uppercase font-bold">STATUS:</span>
              <span
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${statusColor(
                  previewResults.linkStatus
                )}`}
              >
                {previewResults.linkStatus}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="shrink-0 p-4 sm:p-5 border-t border-white/14 bg-black/60 backdrop-blur-xl flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 glass-surface border border-white/20 hover:border-white hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
        >
          <RotateCcw size={13} />
          Reset Defaults
        </button>

        <div className="flex items-center gap-3">
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#B8B8B8] hover:text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            form="sim-form"
            disabled={!isValid || isSubmitting}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
              isValid && !isSubmitting
                ? "bg-white text-black hover:bg-neutral-200 border border-white shadow-[0_2px_12px_rgba(255,255,255,0.2)] active:scale-95"
                : "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed"
            }`}
          >
            <Play size={13} className={isValid && !isSubmitting ? "fill-black text-black" : "text-neutral-500"} />
            {isSubmitting ? "Initializing..." : "Run Simulation"}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isModal) {
    return (
      <div className="glass-modal h-[85vh] max-h-[85vh] flex flex-col min-h-0">
        {formContent}
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xl animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-4xl h-[90vh] max-h-[90vh] glass-modal overflow-hidden flex flex-col min-h-0 animate-in zoom-in-95 duration-150">
        {formContent}
      </div>
    </div>
  );
}
