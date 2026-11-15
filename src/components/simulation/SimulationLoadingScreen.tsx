import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  Zap,
  Radio,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Sparkles,
} from "lucide-react";

import type { LinkBudgetInputs, LinkBudgetResults } from "../../simulation/types";
import { calculateLinkBudget } from "../../simulation/calculations";
import { StarsBackground } from "../ui/stars-background";

export interface SimulationLoadingScreenProps {
  inputs: LinkBudgetInputs;
  onComplete: (inputs: LinkBudgetInputs, results: LinkBudgetResults) => void;
  onCancel?: () => void;
}

const SIMULATION_STAGES = [
  {
    id: 1,
    title: "VALIDATING INPUT PARAMETERS",
    description: "Verifying RF frequency bounds, transmitter limits & geometric propagation ranges",
  },
  {
    id: 2,
    title: "CALCULATING TRANSMITTER EIRP",
    description: "Computing Equivalent Isotropically Radiated Power (EIRP = Pt + Gt - Lt)",
  },
  {
    id: 3,
    title: "COMPUTING FREE SPACE PATH LOSS",
    description: "Evaluating spatial path attenuation (FSPL = 92.45 + 20 log10(f) + 20 log10(d))",
  },
  {
    id: 4,
    title: "EVALUATING RECEIVED SIGNAL POWER",
    description: "Computing ground terminal incident carrier power (Prx = EIRP - FSPL - Lp + Gr - Lr)",
  },
  {
    id: 5,
    title: "CALCULATING CARRIER-TO-NOISE RATIO",
    description: "Evaluating transponder C/N and spectral density C/N0 via Boltzmann relation",
  },
  {
    id: 6,
    title: "COMPUTING LINK MARGIN",
    description: "Determining operational safety margin above minimum demodulator threshold",
  },
  {
    id: 7,
    title: "GENERATING ANALYTICS",
    description: "Compiling multi-band parametric sweeps and environmental stress degradation matrix",
  },
  {
    id: 8,
    title: "SIMULATION COMPLETED",
    description: "All link budget vectors converged. Transitioning to Analytics Dashboard",
  },
];

// ============================================================================
// 3D EARTH GLOBE FOR LOADING SCREEN
// ============================================================================
function LoadingEarthGlobe() {
  const earthTexture = useTexture("/earth-texture.jpg");
  const globeRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <group ref={globeRef}>
      {/* Textured Earth Sphere */}
      <mesh>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      {/* Lat/Long Wireframe Overlay */}
      <mesh scale={1.006}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>

      {/* Atmospheric Rim Glow */}
      <mesh scale={1.06}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.14}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// ORBITING SATELLITE & ANIMATED RF SIGNAL DOWNLINK PULSES
// ============================================================================
function OrbitingSatelliteWithPulses({
  prefersReducedMotion,
}: {
  prefersReducedMotion: boolean;
}) {
  const orbitRadius = 1.62;
  const inclination = 0.44; // ~25° tilt
  const pivotRef = useRef<THREE.Group>(null);
  const satRef = useRef<THREE.Group>(null);

  // References for 3 staggered traveling signal pulses
  const pulse1Ref = useRef<THREE.Mesh>(null);
  const pulse2Ref = useRef<THREE.Mesh>(null);
  const pulse3Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    const speed = prefersReducedMotion ? 0.05 : 0.45;
    if (pivotRef.current) {
      pivotRef.current.rotation.y += speed * delta;
    }
    if (satRef.current) {
      satRef.current.rotation.y += 0.2 * delta;
    }

    // Staggered RF Signal Pulses traveling from Satellite orbit towards Earth surface (radius 1.0)
    const pulses = [
      { ref: pulse1Ref, offset: 0.0 },
      { ref: pulse2Ref, offset: 0.33 },
      { ref: pulse3Ref, offset: 0.66 },
    ];

    if (pivotRef.current) {
      const angle = pivotRef.current.rotation.y;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      pulses.forEach(({ ref, offset }) => {
        if (!ref.current) return;
        const progress = ((clock.elapsedTime * 1.5 + offset) % 1.0);
        // Interpolate distance from orbitRadius to Earth surface (1.0)
        const currentR = THREE.MathUtils.lerp(orbitRadius, 1.0, progress);

        ref.current.position.set(currentR * cosA, 0, currentR * sinA);

        // Pulse scale shrinks and fades as it hits Earth's atmosphere
        const scale = THREE.MathUtils.lerp(0.045, 0.015, progress);
        ref.current.scale.setScalar(scale);

        const mat = ref.current.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = (1 - progress * 0.7) * 0.9;
        }
      });
    }
  });

  return (
    <group rotation={[inclination, 0, 0]}>
      {/* Subtle Orbital Path Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbitRadius - 0.005, orbitRadius + 0.005, 128]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Rotating Pivot */}
      <group ref={pivotRef}>
        {/* Satellite Craft at orbit radius */}
        <group position={[orbitRadius, 0, 0]} ref={satRef} scale={0.038}>
          {/* Main Bus Chassis */}
          <mesh>
            <boxGeometry args={[2.5, 2.5, 3.5]} />
            <meshStandardMaterial
              color="#e5e5e5"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Gold Thermal Multi-Layer Insulation Foil */}
          <mesh scale={1.01}>
            <boxGeometry args={[2.52, 1.8, 3.2]} />
            <meshStandardMaterial
              color="#eab308"
              metalness={0.9}
              roughness={0.25}
            />
          </mesh>

          {/* Solar Panel Wings */}
          {[-1, 1].map((dir) => (
            <group key={dir} position={[dir * 5.2, 0, 0]}>
              <mesh>
                <boxGeometry args={[6.5, 0.1, 2.4]} />
                <meshStandardMaterial
                  color="#1e3a8a"
                  metalness={0.7}
                  roughness={0.2}
                  emissive="#1e40af"
                  emissiveIntensity={0.35}
                />
              </mesh>
              <mesh scale={[1.01, 1.01, 1.01]}>
                <boxGeometry args={[6.52, 0.12, 2.42]} />
                <meshBasicMaterial
                  color="#ffffff"
                  wireframe
                  transparent
                  opacity={0.18}
                />
              </mesh>
            </group>
          ))}

          {/* High-Gain Parabolic Dish pointed Earthward */}
          <mesh position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[1.2, 0.7, 24, 1, true]} />
            <meshStandardMaterial
              color="#ffffff"
              metalness={0.85}
              roughness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* 3 Animated RF Downlink Signal Packets */}
        <mesh ref={pulse1Ref}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
        <mesh ref={pulse2Ref}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
        <mesh ref={pulse3Ref}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// MAIN COMPONENT: SIMULATION LOADING SCREEN
// ============================================================================
export function SimulationLoadingScreen({
  inputs,
  onComplete,
  onCancel,
}: SimulationLoadingScreenProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const [prefersReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  // Calculate results safely without side-effects in render
  const { calculatedResults, calculationError } = useMemo(() => {
    try {
      const res = calculateLinkBudget(inputs);
      return { calculatedResults: res, calculationError: null };
    } catch (err) {
      return {
        calculatedResults: null,
        calculationError:
          err instanceof Error
            ? err.message
            : "An unexpected mathematical simulation error occurred.",
      };
    }
  }, [inputs]);

  const activeStage = SIMULATION_STAGES[currentStageIndex];

  // Stage progression timer
  useEffect(() => {
    // If calculation failed, do not advance stages
    if (!calculatedResults) return;

    // Normal mode: ~240ms per stage (under 2s total); reduced motion: ~120ms (under 1s)
    const stageDuration = prefersReducedMotion ? 120 : 240;

    const timer = setTimeout(() => {
      if (currentStageIndex < SIMULATION_STAGES.length - 1) {
        setCurrentStageIndex((prev) => prev + 1);
      } else {
        // Stage 8 completed, finish and notify parent
        const finishTimeout = setTimeout(() => {
          onComplete(inputs, calculatedResults);
        }, prefersReducedMotion ? 100 : 250);

        return () => clearTimeout(finishTimeout);
      }
    }, stageDuration);

    return () => clearTimeout(timer);
  }, [currentStageIndex, calculatedResults, prefersReducedMotion, inputs, onComplete]);

  const handleRetry = () => {
    setCurrentStageIndex(0);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 h-screen h-[100dvh] w-screen bg-[#030303] text-white flex flex-col justify-between overflow-hidden selection:bg-white selection:text-black"
    >
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 space-grid-pattern opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,255,255,0.06),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_60%)]" />
        <StarsBackground starDensity={0.00015} className="opacity-35" />
      </div>

      {/* Aerospace Corner Crosshairs */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/40 pointer-events-none z-20" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/40 pointer-events-none z-20" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/40 pointer-events-none z-20" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/40 pointer-events-none z-20" />

      {/* TOP HUD BAR */}
      <header className="relative z-10 shrink-0 px-6 py-4 border-b border-white/10 flex items-center justify-between backdrop-blur-md bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-white animate-pulse shrink-0" />
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-white">
            SATLINK // MISSION LINK ENGINE
          </span>
          <span className="hidden sm:inline-block text-[10px] text-[#777777] border-l border-white/10 pl-3">
            ITU-R P.618-13 STANDARDS
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-[#B8B8B8]">
          <span className="flex items-center gap-1.5 px-2.5 py-1 border border-white/14 glass-surface font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ENGINE: ACTIVE
          </span>
        </div>
      </header>

      {/* CENTER STAGE: 3D EARTH WITH ORBITING SATELLITE & SIGNAL DOWNLINK */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-0 px-4 py-2">
        {/* 3D Canvas Container */}
        <div className="w-full max-w-[420px] h-[220px] sm:h-[280px] lg:h-[320px] relative">
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center text-xs text-[#777777] uppercase tracking-widest">
                [ LOADING 3D SCENE... ]
              </div>
            }
          >
            <Canvas
              camera={{ position: [0, 1.2, 3.2], fov: 42 }}
              gl={{ antialias: true, alpha: true }}
            >
              <ambientLight intensity={0.9} />
              <directionalLight position={[5, 3, 5]} intensity={1.8} color="#ffffff" />
              <pointLight position={[-4, -2, -4]} intensity={0.35} color="#ffffff" />

              <LoadingEarthGlobe />
              <OrbitingSatelliteWithPulses prefersReducedMotion={prefersReducedMotion} />
            </Canvas>
          </Suspense>
        </div>

        {/* SIMULATION TITLE & SUBTEXT */}
        <div className="text-center max-w-xl px-4 space-y-1.5 mt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/14 glass-surface mb-1">
            <Sparkles size={11} className="text-white animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-[0.25em]">
              CALCULATION ENGINE RUNNING
            </span>
          </div>

          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-widest uppercase">
            INITIALIZING SATELLITE LINK SIMULATION
          </h1>

          <p className="text-xs sm:text-sm text-[#888888] font-normal leading-relaxed">
            Processing RF parameters and evaluating communication link performance.
          </p>
        </div>

        {/* ERROR DISPLAY PANEL */}
        {calculationError ? (
          <div className="mt-4 max-w-lg w-full p-4 glass-modal border border-rose-500/40 bg-rose-950/20 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-rose-400">
              <AlertTriangle size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">
                SIMULATION CALCULATION FAILED
              </span>
            </div>
            <p className="text-xs text-[#CCCCCC]">{calculationError}</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-neutral-200 transition cursor-pointer"
              >
                <RotateCcw size={13} />
                Retry
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white glass-surface border border-white/20 hover:border-white transition cursor-pointer"
                >
                  <Sliders size={13} />
                  Modify Parameters
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ACTIVE STAGE INDICATOR & PROGRESS */
          <div className="w-full max-w-md px-4 mt-5 space-y-3">
            {/* Active Stage Callout Card */}
            <div className="p-3.5 glass-panel border border-white/14 text-center space-y-1 relative overflow-hidden transition-all duration-200">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#777777] border-b border-white/10 pb-1.5 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Activity size={11} className="text-white animate-pulse" />
                  PROCESSING STEP
                </span>
                <span className="font-bold text-white tracking-widest">
                  [{String(activeStage.id).padStart(2, "0")} / {String(SIMULATION_STAGES.length).padStart(2, "0")}]
                </span>
              </div>

              <div className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
                {activeStage.title}
              </div>

              <div className="text-[11px] text-[#888888] font-normal truncate">
                {activeStage.description}
              </div>
            </div>

            {/* Stepped / Segmented Progress Bar (8 explicit stages, no fake percentages) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-[#777777] font-mono">
                <span>SIMULATION STAGES</span>
                <span>{Math.round(((currentStageIndex + 1) / SIMULATION_STAGES.length) * 100)}%</span>
              </div>

              <div className="grid grid-cols-8 gap-1.5 w-full">
                {SIMULATION_STAGES.map((stg, idx) => {
                  const isDone = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  return (
                    <div
                      key={stg.id}
                      className={`h-1.5 transition-all duration-200 ${
                        isDone
                          ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                          : isCurrent
                          ? "bg-white/80 animate-pulse ring-1 ring-white/60"
                          : "bg-white/10"
                      }`}
                      title={`${stg.id}. ${stg.title}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER: REAL-TIME PARAMETER READOUT & SYSTEM STATUS PILLS */}
      <footer className="relative z-10 shrink-0 px-6 py-3 border-t border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 max-w-6xl mx-auto text-xs">
          {/* Active Parameter Ticker */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 text-[11px] text-[#888888] font-mono">
            <span>
              FREQ: <strong className="text-white">{inputs.frequency.toFixed(2)} GHz</strong>
            </span>
            <span className="text-white/20">|</span>
            <span>
              DIST: <strong className="text-white">{inputs.distance.toLocaleString()} km</strong>
            </span>
            <span className="text-white/20">|</span>
            <span>
              PTX: <strong className="text-white">{inputs.transmitterPower.toFixed(1)} dBW</strong>
            </span>
            <span className="text-white/20">|</span>
            <span>
              BW: <strong className="text-white">{inputs.bandwidth.toFixed(1)} MHz</strong>
            </span>
            <span className="text-white/20">|</span>
            <span>
              G/T: <strong className="text-white">{inputs.receiverGT.toFixed(1)} dB/K</strong>
            </span>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider">
            <span className="flex items-center gap-1 text-[#888888]">
              <Radio size={10} className="text-white" />
              DOWNLINK BEAM
            </span>
            <span className="text-white/20">/</span>
            <span className="flex items-center gap-1 text-[#888888]">
              <Zap size={10} className="text-white" />
              RF ENGINE
            </span>
            <span className="text-white/20">/</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 size={10} />
              CONVERGING
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
