"use client";
import { useState, useMemo } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import {
  Satellite,
  ChartNoAxesCombined,
  Settings,
  Radio,
  Globe2,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import type { LinkBudgetInputs } from "../../simulation/types";
import { calculateLinkBudget } from "../../simulation/calculations";
import { DEFAULT_PARAMETERS } from "../../simulation/constants";

interface SidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  parameters?: LinkBudgetInputs;
  onParametersChange?: (params: LinkBudgetInputs) => void;
}

export default function AppSidebar({
  activeTab = "Analytics",
  onSelectTab,
  parameters = DEFAULT_PARAMETERS,
  onParametersChange,
}: SidebarProps) {
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    return calculateLinkBudget(parameters);
  }, [parameters]);

  const links = [
    {
      label: "Landing Page",
      icon: (
        <Globe2
          className={`h-4 w-4 shrink-0 transition-colors ${
            activeTab === "Landing" ? "text-black" : "text-[#B8B8B8] group-hover/sidebar:text-white"
          }`}
        />
      ),
      onClick: () => onSelectTab?.("Landing"),
      isActive: activeTab === "Landing",
    },
    {
      label: "Simulation Config",
      icon: (
        <Satellite className="h-4 w-4 shrink-0 text-[#B8B8B8] group-hover/sidebar:text-white transition-colors" />
      ),
      onClick: () => onSelectTab?.("Simulation"),
      isActive: false,
    },
    {
      label: "Analytics & Sweeps",
      icon: (
        <ChartNoAxesCombined
          className={`h-4 w-4 shrink-0 transition-colors ${
            activeTab === "Analytics" ? "text-black" : "text-[#B8B8B8] group-hover/sidebar:text-white"
          }`}
        />
      ),
      onClick: () => onSelectTab?.("Analytics"),
      isActive: activeTab === "Analytics",
    },
    {
      label: "System Settings",
      icon: (
        <Settings
          className={`h-4 w-4 shrink-0 transition-colors ${
            activeTab === "Settings" ? "text-black" : "text-[#B8B8B8] group-hover/sidebar:text-white"
          }`}
        />
      ),
      onClick: () => onSelectTab?.("Settings"),
      isActive: activeTab === "Settings",
    },
  ];

  const presets = [
    {
      name: "GEO C-Band",
      orbit: "35,786 km",
      freq: "4.0 GHz",
      isActive: parameters.distance === 35786 && parameters.frequency === 4,
      onSelect: () => {
        onParametersChange?.({
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
      },
    },
    {
      name: "LEO Ku-Band",
      orbit: "550 km",
      freq: "12.0 GHz",
      isActive: parameters.distance === 550 && parameters.frequency === 12,
      onSelect: () => {
        onParametersChange?.({
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
      },
    },
    {
      name: "Lunar Relay",
      orbit: "384,400 km",
      freq: "8.4 GHz",
      isActive: parameters.distance === 384400 && parameters.frequency === 8.4,
      onSelect: () => {
        onParametersChange?.({
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
      },
    },
  ];

  return (
    <Sidebar open={open} setOpen={setOpen} animate={true}>
      <SidebarBody className="h-full justify-between gap-4">
        <div className="flex flex-1 min-h-0 flex-col overflow-x-hidden overflow-y-auto custom-scrollbar pr-1">
          {/* Logo Section - Brutalist Aerospace */}
          <div className="h-16 flex items-center px-1 border-b border-white/14 pb-3 shrink-0">
            {open ? (
              <motion.button
                type="button"
                onClick={() => onSelectTab?.("Landing")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3.5 overflow-hidden cursor-pointer text-left w-full focus:outline-none"
                title="Return to Landing Page"
              >
                <div className="w-8 h-8 rounded-none bg-white text-black flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  <Radio className="text-black" size={17} />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold tracking-widest text-white uppercase font-sans">
                    SATLINK
                  </span>
                  <span className="text-[9px] text-[#777777] tracking-[0.25em] uppercase font-semibold">
                    AEROSPACE // v2.0
                  </span>
                </div>
              </motion.button>
            ) : (
              <button
                type="button"
                onClick={() => onSelectTab?.("Landing")}
                className="w-8 h-8 rounded-none bg-white text-black flex items-center justify-center shrink-0 mx-auto shadow-[0_0_15px_rgba(255,255,255,0.2)] cursor-pointer focus:outline-none"
                title="Return to Landing Page"
              >
                <Radio className="text-black" size={17} />
              </button>
            )}
          </div>

          {/* Primary Navigation Links */}
          <div className="mt-5 flex flex-col gap-1">
            {open && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] text-[#777777] uppercase tracking-[0.2em] mb-1 px-3 font-semibold"
              >
                Primary Modules
              </motion.span>
            )}
            {links.map((link) => (
              <SidebarLink key={link.label} link={link} />
            ))}
          </div>

          {/* Extended Section 1: Quick Orbit Mission Presets */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-1.5">
            {open ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center justify-between px-3 mb-1">
                  <span className="text-[10px] text-[#777777] uppercase tracking-[0.2em] font-semibold flex items-center gap-1.5">
                    <Sparkles size={11} className="text-white/60" />
                    Orbit Profiles
                  </span>
                  <span className="text-[9px] text-[#777777]">SWITCH</span>
                </div>

                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={preset.onSelect}
                    className={`flex items-center justify-between py-2.5 px-3 border text-left transition-all cursor-pointer ${
                      preset.isActive
                        ? "border-white/40 bg-white/10 text-white"
                        : "border-white/[0.08] glass-surface text-[#B8B8B8] hover:text-white hover:border-white/25 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-[#777777]">
                        {preset.orbit} · {preset.freq}
                      </span>
                    </div>
                    {preset.isActive && (
                      <span className="w-1.5 h-1.5 bg-white shrink-0" />
                    )}
                  </button>
                ))}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center py-2 text-white/40">
                <Globe2 size={16} />
              </div>
            )}
          </div>

          {/* Extended Section 2: Real-time Telemetry Digest Widget */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-2">
            {open ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-3 border border-white/14 space-y-2"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[10px] text-[#777777] uppercase tracking-wider font-bold flex items-center gap-1">
                    <Zap size={10} className="text-white" />
                    Live Telemetry
                  </span>
                  <span className="text-[10px] font-extrabold uppercase text-white">
                    {results.linkStatus}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#777777]">Margin:</span>
                    <strong className="text-white font-extrabold tabular-nums">
                      {results.linkMargin > 0 ? `+${results.linkMargin.toFixed(2)}` : results.linkMargin.toFixed(2)} dB
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#777777]">FSPL:</span>
                    <span className="text-[#B8B8B8] tabular-nums font-semibold">
                      {results.fspl.toFixed(1)} dB
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#777777]">EIRP:</span>
                    <span className="text-[#B8B8B8] tabular-nums font-semibold">
                      {results.eirp.toFixed(1)} dBW
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center py-2 text-white/40">
                <Zap size={16} />
              </div>
            )}
          </div>
        </div>

        {/* Minimal Glass Status Footer */}
        <div className="pt-3 border-t border-white/14 flex flex-col gap-2 shrink-0 mt-auto">
          {open ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 px-3 py-2.5 glass-surface border border-white/14"
            >
              <div className="w-1.5 h-1.5 bg-white animate-pulse shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider truncate">
                  TELEMETRY ENGINE ACTIVE
                </span>
                <span className="text-[10px] text-[#777777] truncate">
                  ITU-R P.618-13 STANDARDS
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="mx-auto py-2">
              <div className="w-2 h-2 bg-white animate-pulse" />
            </div>
          )}
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
