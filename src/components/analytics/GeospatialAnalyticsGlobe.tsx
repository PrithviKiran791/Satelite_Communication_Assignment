import { useState, useRef, Suspense } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, useTexture, Line } from "@react-three/drei";
import * as THREE from "three";
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  RotateCw,
  Compass,
  Zap,
  Globe as GlobeIcon,
  X,
  Target,
  Maximize2,
} from "lucide-react";

import type { LinkBudgetInputs, LinkBudgetResults } from "../../simulation/types";
import { latLngToVector3, vector3ToLatLng } from "@/lib/geo";
import { GROUND_STATIONS, type GroundStationNode } from "../../simulation/groundStations";
import { BaseStation } from "../ui/base-station";
import { SpaceBackground } from "../ui/space-background";

export interface GeospatialAnalyticsGlobeProps {
  parameters: LinkBudgetInputs;
  results: LinkBudgetResults;
  onOpenConfig?: () => void;
  className?: string;
}

// ============================================================================
// 3D INTERNAL COMPONENTS
// ============================================================================

// Procedural Satellite Model
function SatelliteCraft({
  scale = 0.04,
  isLunar = false,
}: {
  scale?: number;
  isLunar?: boolean;
}) {
  return (
    <group scale={scale}>
      {/* Main Bus Chassis */}
      <mesh>
        <boxGeometry args={[1.6, 1.6, 2.2]} />
        <meshStandardMaterial color="#d4d4d8" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Gold thermal insulation foil layer */}
      <mesh scale={1.01}>
        <boxGeometry args={[1.6, 1.2, 2.0]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Solar Panel Wings */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 3.8, 0, 0]}>
          <mesh>
            <boxGeometry args={[4.5, 0.08, 1.8]} />
            <meshStandardMaterial
              color="#1e3a8a"
              metalness={0.8}
              roughness={0.2}
              emissive="#1e40af"
              emissiveIntensity={0.3}
            />
          </mesh>
          <mesh position={[0, 0, 0]} scale={[1.01, 1.01, 1.01]}>
            <boxGeometry args={[4.52, 0.09, 1.82]} />
            <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.15} />
          </mesh>
        </group>
      ))}

      {/* Primary High-Gain Antenna Dish (Points towards Earth center) */}
      <mesh position={[0, -1.3, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.1, 0.6, 24, 1, true]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.9}
          roughness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Feed horn */}
      <mesh position={[0, -1.7, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
        <meshStandardMaterial color="#e5e5e5" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Lunar Relay Extra Radiators / Sensor Package */}
      {isLunar && (
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.4, 0.5, 0.6, 16]} />
          <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.2} />
        </mesh>
      )}
    </group>
  );
}

// 3D Scene Core Implementation
function GeospatialScene({
  parameters,
  results,
  activeStation,
  onSelectStation,
  selectedItem,
  onSelectItem,
  autoRotate,
  showGrid,
  showOrbit,
  showBeam,
  showSubpoint,
  setLiveSSP,
}: {
  parameters: LinkBudgetInputs;
  results: LinkBudgetResults;
  activeStation: GroundStationNode;
  onSelectStation: (st: GroundStationNode) => void;
  selectedItem: string;
  onSelectItem: (item: string) => void;
  autoRotate: boolean;
  showGrid: boolean;
  showOrbit: boolean;
  showBeam: boolean;
  showSubpoint: boolean;
  setLiveSSP: (coords: { lat: number; lng: number }) => void;
}) {
  const earthTexture = useTexture("/earth-texture.jpg");
  const globeGroupRef = useRef<THREE.Group>(null);
  const satelliteGroupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  // Scenario-Aware Orbital Dimensions
  const isLunar = parameters.distance > 100000;
  const isLEO = parameters.distance <= 2000;

  // Visual radii scaled proportionally for comprehension
  const orbitRadius = isLunar ? 3.8 : isLEO ? 1.28 : 2.35;
  const inclination = isLunar ? 0.45 : isLEO ? 0.92 : 0.05; // rad
  const orbitSpeed = isLunar ? 0.12 : isLEO ? 0.55 : 0.22;

  // Frame animation: Earth rotation & Satellite orbital propagation
  const [satWorldPos, setSatWorldPos] = useState<THREE.Vector3>(new THREE.Vector3(orbitRadius, 0, 0));
  const [stationWorldPos, setStationWorldPos] = useState<THREE.Vector3>(new THREE.Vector3(1, 0, 0));
  const [sspLocalPos, setSspLocalPos] = useState<THREE.Vector3>(new THREE.Vector3(1, 0, 0));

  useFrame((state, delta) => {
    // 1. Rotate Earth
    if (globeGroupRef.current && autoRotate) {
      globeGroupRef.current.rotation.y += delta * 0.08;
    }

    // 2. Propagate Satellite along inclined orbit
    const t = state.clock.elapsedTime * orbitSpeed;
    const x = Math.cos(t) * orbitRadius;
    const zBase = Math.sin(t) * orbitRadius;
    // Rotate by inclination around X
    const y = -Math.sin(inclination) * zBase;
    const z = Math.cos(inclination) * zBase;

    const currentSatPos = new THREE.Vector3(x, y, z);
    setSatWorldPos(currentSatPos);
    if (satelliteGroupRef.current) {
      satelliteGroupRef.current.position.copy(currentSatPos);
      satelliteGroupRef.current.lookAt(0, 0, 0); // Point antenna dish to Earth center
    }

    // 3. Compute Active Ground Station World Position
    if (globeGroupRef.current) {
      const localStation = latLngToVector3(activeStation.lat, activeStation.lng, 1.008);
      const worldStation = localStation.clone().applyMatrix4(globeGroupRef.current.matrixWorld);
      setStationWorldPos(worldStation);

      // 4. Compute Subsatellite Point (SSP) directly on Earth's surface
      const earthRadius = 1.002;
      const sspWorld = currentSatPos.clone().normalize().multiplyScalar(earthRadius);
      const sspLocal = sspWorld.clone().applyMatrix4(globeGroupRef.current.matrixWorld.clone().invert());
      setSspLocalPos(sspLocal);

      // Convert local coordinate to instantaneous lat/lng
      const sspCoords = vector3ToLatLng(sspLocal);
      setLiveSSP(sspCoords);
    }

    // 5. Animate Communication Signal Pulse (Downlink propagation)
    if (pulseRef.current) {
      const pulseCycle = (state.clock.elapsedTime * 1.8) % 1.0;
      pulseRef.current.position.lerpVectors(currentSatPos, stationWorldPos, pulseCycle);
    }
  });

  // Link status color
  const linkColor =
    results.linkStatus === "EXCELLENT"
      ? "#10b981"
      : results.linkStatus === "GOOD"
      ? "#ffffff"
      : results.linkStatus === "MARGINAL"
      ? "#f59e0b"
      : "#f43f5e";

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* ROTATING EARTH GROUP                                               */}
      {/* ------------------------------------------------------------------ */}
      <group ref={globeGroupRef}>
        {/* Photorealistic Earth Sphere */}
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial map={earthTexture} roughness={0.88} metalness={0.08} />
        </mesh>

        {/* Translucent Celestial Atmosphere */}
        <mesh scale={1.025}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshBasicMaterial
            color="#e2e8f0"
            transparent
            opacity={0.12}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Coordinate Grid (Parallels & Meridians) */}
        {showGrid && (
          <mesh scale={1.005}>
            <sphereGeometry args={[1, 24, 16]} />
            <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.12} />
          </mesh>
        )}

        {/* Equator & Prime Meridian Guidance Rings */}
        {showGrid && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.004, 1.007, 64]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.25} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Global Ground Station Teleport Nodes (BaseStation Lattice Towers) */}
        {GROUND_STATIONS.map((station) => {
          const isPrimary = station.id === activeStation.id;
          const isSelected = selectedItem === "ground-station" && isPrimary;

          return (
            <group key={station.id}>
              <BaseStation
                lat={station.lat}
                lng={station.lng}
                globeRadius={1.006}
                height={7}
                textureUrl="/textures/antenna-panel.jpg"
                color={isPrimary ? linkColor : "#4da6ff"}
                pulse={isPrimary}
                scale={isSelected ? 0.014 : isPrimary ? 0.012 : 0.009}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                  e.stopPropagation();
                  onSelectStation(station);
                  onSelectItem("ground-station");
                }}
              />

              {/* Ground Station Tooltip Label */}
              <Html
                distanceFactor={5}
                position={latLngToVector3(station.lat, station.lng, 1.14)}
                center
                style={{ pointerEvents: "none" }}
              >
                <div
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${
                    isPrimary
                      ? "bg-black/90 text-white border-white/40 shadow-lg scale-110"
                      : "bg-black/70 text-[#B8B8B8] border-white/10 hover:border-white/30"
                  }`}
                >
                  {station.name.split(" ")[0]} {isPrimary ? "★" : ""}
                </div>
              </Html>
            </group>
          );
        })}

        {/* Subsatellite Point (SSP) Target on Earth Surface */}
        {showSubpoint && (
          <group position={sspLocalPos}>
            {/* Target Crosshair Circle on Earth Surface */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.035, 0.05, 24]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.012, 12, 12]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Footprint Coverage Circle */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.18, 0.22, 32]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )}
      </group>

      {/* ------------------------------------------------------------------ */}
      {/* SATELLITE & ORBIT SYSTEM                                           */}
      {/* ------------------------------------------------------------------ */}
      {/* Orbital Path Ring */}
      {showOrbit && (
        <group rotation={[inclination, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[orbitRadius - 0.006, orbitRadius + 0.006, 128]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={isLunar ? 0.25 : 0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* Satellite Craft in Orbit */}
      <group
        ref={satelliteGroupRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelectItem("satellite");
        }}
      >
        <SatelliteCraft scale={isLunar ? 0.045 : isLEO ? 0.032 : 0.038} isLunar={isLunar} />

        {/* Selected Halo Indicator */}
        {selectedItem === "satellite" && (
          <mesh>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.4} />
          </mesh>
        )}

        {/* Satellite Callout Badge */}
        <Html distanceFactor={6} position={[0, 0.32, 0]} center style={{ pointerEvents: "none" }}>
          <div className="px-2 py-0.5 bg-black/90 border border-white/30 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-xl whitespace-nowrap">
            {isLunar ? "LUNAR RELAY" : isLEO ? "LEO KU-SAT" : "GEO C-SAT"} // {parameters.frequency} GHz
          </div>
        </Html>
      </group>

      {/* ------------------------------------------------------------------ */}
      {/* COMMUNICATION RF PATH & SIGNAL PULSES                              */}
      {/* ------------------------------------------------------------------ */}
      {showBeam && (
        <group
          onClick={(e) => {
            e.stopPropagation();
            onSelectItem("communication-link");
          }}
        >
          {/* Direct Line between Satellite and Active Ground Station */}
          <Line
            points={[satWorldPos, stationWorldPos]}
            color={linkColor}
            lineWidth={selectedItem === "communication-link" ? 2.5 : 1.5}
            transparent
            opacity={selectedItem === "communication-link" ? 0.9 : 0.6}
            dashed={results.linkStatus === "FAILED"}
          />

          {/* Animated Downlink Pulse Sphere */}
          <mesh ref={pulseRef}>
            <sphereGeometry args={[0.024, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      )}

      {/* Subsatellite Point (SSP) Tether Line from Satellite to Earth surface */}
      {showSubpoint && (
        <Line
          points={[
            satWorldPos,
            satWorldPos.clone().normalize().multiplyScalar(1.002),
          ]}
          color="#888888"
          lineWidth={1}
          transparent
          opacity={0.3}
          dashed
        />
      )}
    </>
  );
}

// ============================================================================
// MAIN COMPONENT & FULL HUD OVERLAYS
// ============================================================================
export function GeospatialAnalyticsGlobe({
  parameters,
  results,
  onOpenConfig,
  className = "",
}: GeospatialAnalyticsGlobeProps) {
  // Active Ground Station
  const [activeStation, setActiveStation] = useState<GroundStationNode>(GROUND_STATIONS[0]);
  const [selectedItem, setSelectedItem] = useState<string>("none"); // "none" | "satellite" | "ground-station" | "communication-link"

  // Controls State
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showOrbit, setShowOrbit] = useState<boolean>(true);
  const [showBeam, setShowBeam] = useState<boolean>(true);
  const [showSubpoint, setShowSubpoint] = useState<boolean>(true);
  const [showHUD, setShowHUD] = useState<boolean>(true);
  const [cameraKey, setCameraKey] = useState<number>(0);

  // Live Instantaneous Subsatellite Point (SSP)
  const [liveSSP, setLiveSSP] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  // Scenario Classification
  const isLunar = parameters.distance > 100000;
  const isLEO = parameters.distance <= 2000;
  const scenarioType = isLunar ? "Deep Space Relay" : isLEO ? "Low Earth Orbit (LEO)" : "Geostationary Orbit (GEO)";
  const scenarioName = isLunar ? "Deep Space Lunar Relay" : isLEO ? "LEO Ku-Band Mega-Constellation" : "GEO C-Band Commercial Relay";

  // Status Styling
  const statusColor =
    results.linkStatus === "EXCELLENT"
      ? "text-emerald-400 border-emerald-500/40 bg-emerald-950/20"
      : results.linkStatus === "GOOD"
      ? "text-white border-white/20 bg-white/5"
      : results.linkStatus === "MARGINAL"
      ? "text-amber-400 border-amber-500/40 bg-amber-950/20"
      : "text-rose-400 border-rose-500/40 bg-rose-950/20";

  const StatusIcon =
    results.linkStatus === "EXCELLENT" || results.linkStatus === "GOOD"
      ? CheckCircle2
      : results.linkStatus === "MARGINAL"
      ? AlertTriangle
      : XCircle;

  return (
    <div className={`glass-panel relative w-full h-[580px] lg:h-[620px] overflow-hidden border border-white/14 ${className}`}>
      {/* Corner crosshairs */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white/40 pointer-events-none z-10" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-white/40 pointer-events-none z-10" />

      {/* -------------------------------------------------------------------- */}
      {/* 3D CANVAS RENDERER                                                   */}
      {/* -------------------------------------------------------------------- */}
      <Canvas
        key={cameraKey}
        camera={{ position: [0, 1.2, 3.8], fov: 42, near: 0.1, far: 2500 }}
        dpr={[1, 1.5]}
        className="w-full h-full bg-[#030303]"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedItem("none");
          }
        }}
      >
        <SpaceBackground />
        <ambientLight intensity={1.1} />
        <directionalLight position={[6, 4, 6]} intensity={1.4} />
        <pointLight position={[-6, -3, -4]} intensity={0.6} color="#94a3b8" />

        <Suspense fallback={null}>
          <GeospatialScene
            parameters={parameters}
            results={results}
            activeStation={activeStation}
            onSelectStation={(st) => setActiveStation(st)}
            selectedItem={selectedItem}
            onSelectItem={(item) => setSelectedItem(item)}
            autoRotate={autoRotate}
            showGrid={showGrid}
            showOrbit={showOrbit}
            showBeam={showBeam}
            showSubpoint={showSubpoint}
            setLiveSSP={setLiveSSP}
          />
        </Suspense>

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={1.8}
          maxDistance={7.5}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI - 0.2}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {/* -------------------------------------------------------------------- */}
      {/* TOP CONTROLS TOOLBAR (Brutalist Glass Toolbar)                       */}
      {/* -------------------------------------------------------------------- */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Badge: Mission Telemetry Indicator */}
        <div className="pointer-events-auto flex items-center gap-2 glass-surface px-3 py-1.5 border border-white/14">
          <span className="w-1.5 h-1.5 bg-white animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            3D GEOSPATIAL MISSION CONTROL
          </span>
          <span className="text-[10px] text-[#777777] hidden sm:inline">|</span>
          <span className="text-[10px] text-[#B8B8B8] font-medium hidden sm:inline">
            {scenarioType}
          </span>
        </div>

        {/* Right Buttons: Controls Toolbar */}
        <div className="pointer-events-auto flex items-center gap-1.5 glass-surface p-1 border border-white/14">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Earth Auto-Rotation"
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
              autoRotate ? "bg-white text-black" : "text-[#B8B8B8] hover:text-white"
            }`}
          >
            <RotateCw size={11} className={autoRotate ? "animate-spin" : ""} />
            <span className="hidden md:inline">Rotate</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Coordinate Grid"
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
              showGrid ? "bg-white text-black" : "text-[#B8B8B8] hover:text-white"
            }`}
          >
            <Compass size={11} />
            <span className="hidden md:inline">Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOrbit(!showOrbit)}
            title="Toggle Orbit Ring"
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
              showOrbit ? "bg-white text-black" : "text-[#B8B8B8] hover:text-white"
            }`}
          >
            <GlobeIcon size={11} />
            <span className="hidden md:inline">Orbit</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBeam(!showBeam)}
            title="Toggle RF Beam & Pulse"
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
              showBeam ? "bg-white text-black" : "text-[#B8B8B8] hover:text-white"
            }`}
          >
            <Zap size={11} />
            <span className="hidden md:inline">RF Beam</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSubpoint(!showSubpoint)}
            title="Toggle Subsatellite Point"
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
              showSubpoint ? "bg-white text-black" : "text-[#B8B8B8] hover:text-white"
            }`}
          >
            <Target size={11} />
            <span className="hidden md:inline">Subpoint</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHUD(!showHUD)}
            title="Toggle Telemetry Overlays"
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
              showHUD ? "bg-white text-black" : "text-[#B8B8B8] hover:text-white"
            }`}
          >
            <Eye size={11} />
            <span className="hidden md:inline">HUD</span>
          </button>

          <button
            type="button"
            onClick={() => setCameraKey((k) => k + 1)}
            title="Reset Camera View"
            className="p-1 text-[#B8B8B8] hover:text-white transition cursor-pointer"
          >
            <Maximize2 size={13} />
          </button>

          {onOpenConfig && (
            <button
              type="button"
              onClick={onOpenConfig}
              title="Open Simulation Configuration"
              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black bg-white hover:bg-neutral-200 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sliders size={11} className="text-black" />
              <span className="hidden md:inline">Config</span>
            </button>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* ANALYTICAL HUD OVERLAYS (Feature 3 - Display Results Directly on Globe) */}
      {/* -------------------------------------------------------------------- */}
      {showHUD && (
        <>
          {/* HUD Top-Left: Satellite & Orbital Mission Metadata */}
          <div className="absolute top-14 left-3 z-10 w-64 max-w-[calc(100vw-32px)] glass-modal p-3 space-y-1.5 border border-white/14 pointer-events-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">
                MISSION GEOMETRY
              </span>
              <span className="text-[10px] font-bold text-white uppercase">
                {isLunar ? "RELAY" : isLEO ? "LEO" : "GEO"}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-white font-bold text-xs truncate">
                {scenarioName}
              </div>
              <div className="flex justify-between text-[11px] text-[#B8B8B8]">
                <span>Carrier Freq:</span>
                <strong className="text-white tabular-nums">{parameters.frequency} GHz</strong>
              </div>
              <div className="flex justify-between text-[11px] text-[#B8B8B8]">
                <span>Slant Distance:</span>
                <strong className="text-white tabular-nums">{parameters.distance.toLocaleString()} km</strong>
              </div>
              <div className="flex justify-between text-[11px] text-[#B8B8B8]">
                <span>Subpoint (SSP):</span>
                <strong className="text-white tabular-nums">
                  {liveSSP.lat.toFixed(1)}°N, {liveSSP.lng.toFixed(1)}°E
                </strong>
              </div>
            </div>

            <div className="pt-1.5 border-t border-white/10 text-[9px] text-[#777777] leading-tight">
              Illustrative geometry for parametric link budget analysis.
            </div>
          </div>

          {/* HUD Top-Right: Live Real-Time Link Budget Telemetry Overlay */}
          <div className="absolute top-14 right-3 z-10 w-72 max-w-[calc(100vw-32px)] glass-modal p-3.5 space-y-2 border border-white/14 pointer-events-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">
                ACTIVE LINK TELEMETRY
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase border ${statusColor}`}>
                {results.linkStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="glass-surface p-2 border border-white/[0.08]">
                <span className="text-[9px] text-[#777777] uppercase block font-bold">EIRP</span>
                <span className="text-sm font-extrabold text-white tabular-nums block">
                  {results.eirp.toFixed(1)} dBW
                </span>
              </div>
              <div className="glass-surface p-2 border border-white/[0.08]">
                <span className="text-[9px] text-[#777777] uppercase block font-bold">FSPL Path Loss</span>
                <span className="text-sm font-extrabold text-white tabular-nums block">
                  {results.fspl.toFixed(1)} dB
                </span>
              </div>
              <div className="glass-surface p-2 border border-white/[0.08]">
                <span className="text-[9px] text-[#777777] uppercase block font-bold">Carrier-to-Noise</span>
                <span className="text-sm font-extrabold text-white tabular-nums block">
                  {results.cn.toFixed(2)} dB
                </span>
              </div>
              <div className="glass-surface p-2 border border-white/[0.08]">
                <span className="text-[9px] text-[#777777] uppercase block font-bold">Link Margin</span>
                <span className={`text-sm font-extrabold tabular-nums block ${results.linkMargin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {results.linkMargin > 0 ? `+${results.linkMargin.toFixed(2)}` : results.linkMargin.toFixed(2)} dB
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-[#B8B8B8] pt-1">
              <span>Rx Power: <strong className="text-white">{results.receivedPower.toFixed(1)} dBW</strong></span>
              <span>C/N0: <strong className="text-white">{results.cn0.toFixed(1)} dB-Hz</strong></span>
            </div>
          </div>
        </>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* BOTTOM-LEFT: INTERACTIVE INSPECTION CARD (Feature 4)                 */}
      {/* -------------------------------------------------------------------- */}
      {selectedItem !== "none" && (
        <div className="absolute bottom-16 sm:bottom-4 left-3 z-20 w-80 max-w-[calc(100vw-24px)] glass-modal p-4 border border-white/25 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/14 mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8B8B8]">
              {selectedItem === "satellite"
                ? "SATELLITE INSPECTION"
                : selectedItem === "ground-station"
                ? "GROUND STATION INSPECTION"
                : "RF PROPAGATION BEAM INSPECTION"}
            </span>
            <button
              type="button"
              onClick={() => setSelectedItem("none")}
              className="text-[#777777] hover:text-white transition p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {selectedItem === "satellite" && (
            <div className="space-y-1.5 text-xs">
              <div className="font-extrabold text-sm text-white uppercase">
                {isLunar ? "Artemis Deep-Space Relay" : isLEO ? "Starlink-V2 LEO Node" : "Intelsat / Eutelsat GEO Node"}
              </div>
              <div className="text-[11px] text-[#B8B8B8] pb-1">
                Active Downlink Transmitter Payload
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06] text-[11px]">
                <span className="text-[#777777]">Amplifier Power (Pt):</span>
                <strong className="text-white tabular-nums">{parameters.transmitterPower} dBW ({Math.pow(10, parameters.transmitterPower / 10).toFixed(0)} W)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06] text-[11px]">
                <span className="text-[#777777]">Antenna Dish Gain (Gt):</span>
                <strong className="text-white tabular-nums">{parameters.transmitAntennaGain} dBi</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06] text-[11px]">
                <span className="text-[#777777]">Transmit Losses (Lt):</span>
                <strong className="text-white tabular-nums">{parameters.transmitLosses} dB</strong>
              </div>
              <div className="flex justify-between py-1 text-[11px]">
                <span className="text-[#777777]">Total Effective EIRP:</span>
                <strong className="text-white font-bold tabular-nums">{results.eirp.toFixed(2)} dBW</strong>
              </div>
            </div>
          )}

          {selectedItem === "ground-station" && (
            <div className="space-y-1.5 text-xs">
              <div className="font-extrabold text-sm text-white uppercase">
                {activeStation.name}
              </div>
              <div className="text-[11px] text-[#B8B8B8] pb-1">
                {activeStation.country} · Coordinates: {activeStation.lat.toFixed(2)}°N, {activeStation.lng.toFixed(2)}°E
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06] text-[11px]">
                <span className="text-[#777777]">Receive Dish Gain (Gr):</span>
                <strong className="text-white tabular-nums">{parameters.receiveAntennaGain} dBi</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06] text-[11px]">
                <span className="text-[#777777]">Receiver G/T Figure:</span>
                <strong className="text-white tabular-nums">{parameters.receiverGT} dB/K</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06] text-[11px]">
                <span className="text-[#777777]">Received Power (Prx):</span>
                <strong className="text-white tabular-nums">{results.receivedPower.toFixed(2)} dBW</strong>
              </div>
              <div className="flex justify-between py-1 text-[11px]">
                <span className="text-[#777777]">Demodulator Margin:</span>
                <strong className={`font-bold tabular-nums ${results.linkMargin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  +{results.linkMargin.toFixed(2)} dB
                </strong>
              </div>
            </div>
          )}

          {selectedItem === "communication-link" && (
            <div className="space-y-1.5 text-xs">
              <div className="font-extrabold text-sm text-white uppercase flex items-center justify-between">
                <span>Free-Space RF Path</span>
                <StatusIcon size={14} className={statusColor.split(" ")[0]} />
              </div>
              <div className="text-[11px] text-[#B8B8B8] pb-1">
                Slant Range: {parameters.distance.toLocaleString()} km @ {parameters.frequency} GHz
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06] text-[11px]">
                <span className="text-[#777777]">Free Space Loss (FSPL):</span>
                <strong className="text-white tabular-nums">{results.fspl.toFixed(2)} dB</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06] text-[11px]">
                <span className="text-[#777777]">Atmospheric Fade (Lp):</span>
                <strong className="text-white tabular-nums">{parameters.propagationLosses} dB</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06] text-[11px]">
                <span className="text-[#777777]">C/N Ratio vs Required:</span>
                <strong className="text-white tabular-nums">{results.cn.toFixed(2)} dB / {parameters.requiredCN} dB</strong>
              </div>
              <div className="flex justify-between py-1 text-[11px]">
                <span className="text-[#777777]">Link Margin:</span>
                <strong className={`font-bold tabular-nums ${results.linkMargin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {results.linkMargin > 0 ? `+${results.linkMargin.toFixed(2)}` : results.linkMargin.toFixed(2)} dB ({results.linkStatus})
                </strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* BOTTOM-RIGHT: GROUND STATION TELEPORT SELECTOR                       */}
      {/* -------------------------------------------------------------------- */}
      <div className="absolute bottom-3 right-3 z-10 glass-surface p-2 border border-white/14 flex items-center gap-1.5 pointer-events-auto overflow-x-auto max-w-[calc(100vw-24px)] custom-scrollbar">
        <span className="text-[10px] font-bold text-[#777777] uppercase px-1 hidden sm:inline">
          Active Gateway:
        </span>
        {GROUND_STATIONS.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => {
              setActiveStation(st);
              setSelectedItem("ground-station");
            }}
            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeStation.id === st.id
                ? "bg-white text-black shadow-sm"
                : "text-[#B8B8B8] hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            {st.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Click prompt helper if nothing selected */}
      {selectedItem === "none" && (
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none hidden md:block">
          <div className="glass-surface px-3 py-1.5 border border-white/10 text-[10px] text-[#777777] font-medium tracking-wide">
            Click on Satellite, Ground Station, or RF Beam to inspect real-time telemetry
          </div>
        </div>
      )}
    </div>
  );
}
