"use client";

import { useEffect, useState } from "react";
import { Play, BarChart3, Radio, Orbit, ShieldCheck } from "lucide-react";
import { Globe3D, type GlobeMarker } from "../ui/3d-globe";

export interface LandingPageProps {
  onStartSimulation: () => void;
  onViewAnalytics: () => void;
}

const groundStationMarkers: GlobeMarker[] = [
  { lat: 12.9716, lng: 77.5946, src: "/ground-station-marker.svg", label: "Bengaluru Gateway" },
  { lat: 28.6139, lng: 77.209, src: "/ground-station-marker.svg", label: "New Delhi Gateway" },
  { lat: 1.3521, lng: 103.8198, src: "/ground-station-marker.svg", label: "Singapore Gateway" },
  { lat: 51.5074, lng: -0.1278, src: "/ground-station-marker.svg", label: "London Gateway" },
  { lat: 35.6762, lng: 139.6503, src: "/ground-station-marker.svg", label: "Tokyo Gateway" },
  { lat: 40.7128, lng: -74.006, src: "/ground-station-marker.svg", label: "New York Gateway" },
  { lat: -33.8688, lng: 151.2093, src: "/ground-station-marker.svg", label: "Sydney Gateway" },
];

export function LandingPage({ onStartSimulation, onViewAnalytics }: LandingPageProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <div className="relative w-screen h-screen min-h-[100svh] overflow-hidden bg-[#030303] text-white flex flex-col justify-between select-none">
      {/* -------------------------------------------------------------------- */}
      {/* 1. 3D EARTH GLOBE & ORBITING SATELLITE CANVAS                        */}
      {/* -------------------------------------------------------------------- */}
      <div className="absolute inset-0 lg:left-[22%] w-full lg:w-[78%] h-full z-0 pointer-events-auto">
        <Globe3D
          markers={groundStationMarkers}
          satellite={{
            orbitRadius: 1.54,
            speed: prefersReducedMotion ? 0 : 0.32,
            inclination: 0.48,
            scale: 1.25,
            showOrbitLine: true,
          }}
          spaceBackground={{
            nebula: true,
            shootingStars: !prefersReducedMotion,
            nebulaColorA: "#0a0a14",
            nebulaColorB: "#101827",
          }}
          className="w-full h-full"
          config={{
            globeColor: "#030303",
            atmosphereColor: "#38bdf8",
            atmosphereIntensity: 14,
            bumpScale: 5,
            autoRotateSpeed: prefersReducedMotion ? 0 : 0.22,
            showAtmosphere: true,
            enableZoom: false,
            enablePan: false,
            minDistance: 2.8,
            maxDistance: 4.5,
            ambientIntensity: 1.15,
            pointLightIntensity: 1.4,
            backgroundColor: null,
          }}
        />
      </div>

      {/* Subtle radial lighting to accentuate depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_70%_50%,rgba(56,189,248,0.03),transparent_70%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(255,255,255,0.025),transparent_50%)] pointer-events-none z-0" />

      {/* Corner crosshairs for brutalist aerospace look */}
      <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-white/40 pointer-events-none z-20" />
      <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-white/40 pointer-events-none z-20" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-white/40 pointer-events-none z-20" />
      <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-white/40 pointer-events-none z-20" />

      {/* -------------------------------------------------------------------- */}
      {/* 2. TOP TECHNICAL ANNOTATIONS (Brutalist HUD Header)                  */}
      {/* -------------------------------------------------------------------- */}
      <header className="relative z-10 p-6 md:p-8 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold text-xs shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            <Radio size={16} className="text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-[0.25em] text-white uppercase font-sans">
              SATLINK
            </span>
            <span className="text-[9px] tracking-[0.2em] text-[#777777] uppercase font-semibold">
              AEROSPACE // v2.0
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="glass-surface px-3 py-1.5 flex items-center gap-2 border border-white/14">
            <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
              TELEMETRY ENGINE ONLINE
            </span>
          </div>

          <div className="glass-surface px-3 py-1.5 border border-white/14 text-[10px] text-[#B8B8B8] font-medium tracking-wide">
            ITU-R P.618-13
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* 3. HERO CONTENT & PRIMARY ACTIONS                                    */}
      {/* -------------------------------------------------------------------- */}
      <main className="relative z-10 px-6 md:px-12 lg:px-16 py-4 flex-1 flex flex-col justify-center max-w-2xl pointer-events-none">
        {/* Module Sub-Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/20 glass-surface w-fit mb-4">
          <Orbit size={12} className="text-white" />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white">
            MISSION-CONTROL PLATFORM
          </span>
        </div>

        {/* Primary Identity */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tight text-white font-sans drop-shadow-[0_0_35px_rgba(255,255,255,0.25)]">
          SATLINK
        </h1>

        <p className="mt-2 text-xs sm:text-sm font-bold tracking-[0.2em] text-[#B8B8B8] uppercase">
          SATELLITE COMMUNICATION LINK BUDGET SIMULATOR
        </p>

        <p className="mt-4 text-xs sm:text-sm text-[#777777] max-w-lg font-medium leading-relaxed">
          Explore satellite communication performance through interactive link-budget simulation and 3D visualization.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pointer-events-auto">
          {/* START SIMULATION (Primary Action) */}
          <button
            type="button"
            onClick={onStartSimulation}
            aria-label="Start Simulation Configuration"
            className="flex items-center justify-center gap-2.5 px-8 py-4 bg-white text-black font-extrabold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.35)] hover:scale-[1.02] active:scale-[0.98] border border-white"
          >
            <Play size={13} className="fill-black text-black" />
            START SIMULATION
          </button>

          {/* VIEW ANALYTICS (Secondary Action) */}
          <button
            type="button"
            onClick={onViewAnalytics}
            aria-label="View Analytics Dashboard"
            className="flex items-center justify-center gap-2.5 px-8 py-4 glass-surface border border-white/30 text-white font-extrabold text-xs uppercase tracking-widest hover:bg-white/10 hover:border-white/60 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <BarChart3 size={14} className="text-white" />
            VIEW ANALYTICS
          </button>
        </div>

        {/* Technical Capabilities Annotations */}
        <div className="mt-10 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 max-w-md">
          <div>
            <span className="text-[10px] text-[#777777] uppercase font-bold block">ORBIT PRESETS</span>
            <span className="text-xs font-bold text-white mt-0.5 block">GEO · LEO · LUNAR</span>
          </div>
          <div>
            <span className="text-[10px] text-[#777777] uppercase font-bold block">RF SPECTRUM</span>
            <span className="text-xs font-bold text-white mt-0.5 block">C / Ku / Ka BANDS</span>
          </div>
          <div>
            <span className="text-[10px] text-[#777777] uppercase font-bold block">ANALYSIS</span>
            <span className="text-xs font-bold text-white mt-0.5 block">ITU-R PARAMETRIC</span>
          </div>
        </div>
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* 4. BOTTOM FOOTER TELEMETRY ANNOTATIONS                               */}
      {/* -------------------------------------------------------------------- */}
      <footer className="relative z-10 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] text-[#777777] uppercase tracking-widest pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-white shrink-0" />
          <span>DETERMINISTIC LINK MARGIN ENGINE</span>
          <span className="hidden md:inline">|</span>
          <span className="hidden md:inline">7 GLOBAL GROUND TELEPORTS</span>
        </div>

        <div className="flex items-center gap-2">
          <ShieldCheck size={12} className="text-white/60" />
          <span>VERIFIED ITU-R P.618-13 EQUATIONS</span>
        </div>
      </footer>
    </div>
  );
}
