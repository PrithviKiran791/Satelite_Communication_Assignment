import { Suspense, useRef, useState } from "react";
import { Html, OrbitControls, useTexture } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { Satellite, type SatelliteProps } from "./satellite";
import { SpaceBackground, type SpaceBackgroundProps } from "./space-background";
import { BaseStation, type BaseStationProps } from "./base-station";
import { latLngToVector3 } from "@/lib/geo";

export {
  Satellite,
  type SatelliteProps,
  SpaceBackground,
  type SpaceBackgroundProps,
  BaseStation,
  type BaseStationProps,
};

export type GlobeMarker = {
  lat: number;
  lng: number;
  src: string;
  label: string;
};

export type GlobeConfig = {
  globeColor?: string;
  atmosphereColor?: string;
  atmosphereIntensity?: number;
  bumpScale?: number;
  autoRotateSpeed?: number;
  showAtmosphere?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  minDistance?: number;
  maxDistance?: number;
  ambientIntensity?: number;
  pointLightIntensity?: number;
  backgroundColor?: string | null;
};

export type Globe3DProps = {
  markers: GlobeMarker[];
  className?: string;
  config?: GlobeConfig;
  satellite?: SatelliteProps | boolean;
  spaceBackground?: SpaceBackgroundProps | boolean;
  onMarkerClick?: (marker: GlobeMarker) => void;
  onMarkerHover?: (marker: GlobeMarker | null) => void;
};

const defaultConfig: Required<GlobeConfig> = {
  globeColor: "#030712",
  atmosphereColor: "#38bdf8",
  atmosphereIntensity: 20,
  bumpScale: 5,
  autoRotateSpeed: 0.25,
  showAtmosphere: true,
  enableZoom: true,
  enablePan: false,
  minDistance: 2.5,
  maxDistance: 5,
  ambientIntensity: 1.2,
  pointLightIntensity: 1.5,
  backgroundColor: null,
};

// ==========================================
// GROUND STATION ANTENNA
// ==========================================

export function GroundStationAntenna() {
  return (
    <group>
      {/* Antenna dish */}
      <mesh
        position={[0, 0.075, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <sphereGeometry
          args={[0.075, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.85}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Antenna receiver */}
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.09, 8]} />
        <meshStandardMaterial color="#22d3ee" />
      </mesh>

      {/* Support mast */}
      <mesh position={[0, -0.045, 0]}>
        <cylinderGeometry args={[0.009, 0.012, 0.09, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      {/* Base */}
      <mesh position={[0, -0.09, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.018, 16]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
    </group>
  );
}

// ==========================================
// COMMUNICATION SIGNAL
// ==========================================

export function CommunicationSignal({
  color,
  radius = 1.02,
}: {
  color: string;
  radius?: number;
}) {
  const signalRef = useRef<THREE.Mesh>(null);
  void radius;

  useFrame(({ clock }) => {
    if (signalRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.25;

      signalRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <mesh ref={signalRef} scale={1}>
      <sphereGeometry args={[0.025, 16, 16]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

function GlobeSurface({
  config,
  markers,
  onMarkerClick,
  onMarkerHover,
}: Required<Pick<Globe3DProps, "markers">> & {
  config: Required<GlobeConfig>;
  onMarkerClick?: Globe3DProps["onMarkerClick"];
  onMarkerHover?: Globe3DProps["onMarkerHover"];
}) {
  const globeRef = useRef<THREE.Group>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const earthTexture = useTexture("/earth-texture.jpg");

  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * config.autoRotateSpeed * 0.12;
    }
  });

  const setMarkerHover = (marker: GlobeMarker | null) => {
    setHoveredMarker(marker?.label ?? null);
    onMarkerHover?.(marker);
  };

  return (
    <>
      <group ref={globeRef}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            color="#ffffff"
            map={earthTexture}
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>

        <mesh scale={1.006}>
          <sphereGeometry args={[1, 32, 20]} />
          <meshBasicMaterial
            color="#7dd3fc"
            transparent
            opacity={0.12}
            wireframe
          />
        </mesh>

        {config.showAtmosphere && (
          <mesh scale={1.08}>
            <sphereGeometry args={[1, 48, 48]} />
            <meshBasicMaterial
              color={config.atmosphereColor}
              transparent
              opacity={Math.min(config.atmosphereIntensity / 100, 0.32)}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}

        {markers.map((marker) => {
          const isHovered = hoveredMarker === marker.label;

          return (
            <group key={marker.label}>
              <BaseStation
                lat={marker.lat}
                lng={marker.lng}
                globeRadius={1.006}
                color={isHovered ? "#38bdf8" : "#22d3ee"}
                scale={isHovered ? 0.013 : 0.01}
                onClick={(event: ThreeEvent<MouseEvent>) => {
                  event.stopPropagation();
                  onMarkerClick?.(marker);
                }}
                onPointerOver={(event: ThreeEvent<PointerEvent>) => {
                  event.stopPropagation();
                  setMarkerHover(marker);
                }}
                onPointerOut={() => setMarkerHover(null)}
              />

              <Html
                center
                distanceFactor={6}
                position={latLngToVector3(marker.lat, marker.lng, 1.14)}
                style={{ pointerEvents: "none" }}
              >
                <div className="flex flex-col items-center whitespace-nowrap">
                  <img
                    src={marker.src}
                    alt=""
                    className={`h-7 w-7 transition-transform ${isHovered ? "scale-125" : ""}`}
                  />
                  {isHovered && (
                    <span className="mt-1 rounded border border-cyan-400/30 bg-slate-950/90 px-2 py-1 text-[10px] font-medium text-cyan-200">
                      {marker.label}
                    </span>
                  )}
                </div>
              </Html>
            </group>
          );
        })}
      </group>
    </>
  );
}

export function Globe3D({
  markers,
  className,
  config: configOverrides,
  satellite,
  spaceBackground = true,
  onMarkerClick,
  onMarkerHover,
}: Globe3DProps) {
  const config = { ...defaultConfig, ...configOverrides };

  const satelliteConfig: SatelliteProps | null =
    satellite === false
      ? null
      : typeof satellite === "object"
      ? satellite
      : { orbitRadius: 1.48, speed: 0.35, inclination: 0.5 };

  const spaceBgConfig: SpaceBackgroundProps | null =
    spaceBackground === false
      ? null
      : typeof spaceBackground === "object"
      ? spaceBackground
      : {};

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 42, near: 0.1, far: 2500 }}
        dpr={[1, 1.5]}
        onCreated={({ scene }) => {
          if (!spaceBgConfig && config.backgroundColor) {
            scene.background = new THREE.Color(config.backgroundColor);
          }
        }}
      >
        {spaceBgConfig && <SpaceBackground {...spaceBgConfig} />}
        <ambientLight intensity={config.ambientIntensity} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} />
        <pointLight
          position={[4, 3, 5]}
          intensity={config.pointLightIntensity}
          color="#dbeafe"
        />
        <pointLight position={[-4, -2, -3]} intensity={0.8} color="#0ea5e9" />
        <GlobeSurface
          config={config}
          markers={markers}
          onMarkerClick={onMarkerClick}
          onMarkerHover={onMarkerHover}
        />
        {satelliteConfig && (
          <Suspense fallback={null}>
            <Satellite {...satelliteConfig} />
          </Suspense>
        )}
        <OrbitControls
          enableZoom={config.enableZoom}
          enablePan={config.enablePan}
          minDistance={config.minDistance}
          maxDistance={config.maxDistance}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI - 0.25}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
}
