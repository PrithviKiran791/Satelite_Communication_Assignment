import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Stars,
  Html,
  Line,
} from "@react-three/drei";
import * as THREE from "three";

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[1.35, 64, 64]} />
        <meshStandardMaterial
          color="#155eaa"
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      {/* Earth atmosphere */}
      <mesh>
        <sphereGeometry args={[1.4, 64, 64]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Earth grid */}
      <mesh>
        <sphereGeometry args={[1.36, 24, 16]} />
        <meshBasicMaterial
          color="#7dd3fc"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>
    </group>
  );
}

function Satellite() {
  const satelliteRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!satelliteRef.current) return;

    const time = state.clock.elapsedTime;

    satelliteRef.current.position.x = Math.cos(time * 0.25) * 2.3;
    satelliteRef.current.position.z = Math.sin(time * 0.25) * 2.3;
    satelliteRef.current.position.y = 0.55 + Math.sin(time * 0.25) * 0.35;
  });

  return (
    <group ref={satelliteRef} position={[2.3, 0.55, 0]}>

      {/* Satellite body */}
      <mesh>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial
          color="#d4dce8"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Solar panel - Left */}
      <mesh position={[-0.65, 0, 0]}>
        <boxGeometry args={[0.85, 0.08, 0.38]} />
        <meshStandardMaterial
          color="#2563eb"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Solar panel - Right */}
      <mesh position={[0.65, 0, 0]}>
        <boxGeometry args={[0.85, 0.08, 0.38]} />
        <meshStandardMaterial
          color="#2563eb"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.25, 12]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      <Html distanceFactor={8} position={[0, 0.6, 0]} center>
        <div className="whitespace-nowrap rounded-md border border-cyan-400/30 bg-slate-950/90 px-2 py-1 text-[10px] font-medium text-cyan-300">
          COMMUNICATION SATELLITE
        </div>
      </Html>

    </group>
  );
}

function GroundStation() {
  return (
    <group position={[0.35, -1.05, 0.85]}>

      {/* Station base */}
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.12, 24]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* Dish antenna */}
      <mesh rotation={[0.3, 0, -0.35]}>
        <sphereGeometry
          args={[0.3, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.48]}
        />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.75}
          roughness={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Antenna mast */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      <Html position={[0, 0.45, 0]} distanceFactor={8} center>
        <div className="whitespace-nowrap rounded-md border border-emerald-400/30 bg-slate-950/90 px-2 py-1 text-[10px] font-medium text-emerald-300">
          GROUND STATION
        </div>
      </Html>

    </group>
  );
}

function SignalPulse({
  start,
  end,
  color,
  duration,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  duration: number;
}) {
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!pulseRef.current) return;

    const progress =
      (state.clock.elapsedTime % duration) / duration;

    pulseRef.current.position.lerpVectors(start, end, progress);
  });

  return (
    <mesh ref={pulseRef}>
      <sphereGeometry args={[0.055, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function CommunicationSignals() {
  const ground = new THREE.Vector3(0.35, -1.05, 0.85);
  const satellite = new THREE.Vector3(2.3, 0.55, 0);

  return (
    <group>
      {/* Uplink path */}
      <Line
        points={[ground, satellite]}
        color="#22d3ee"
        transparent
        opacity={0.65}
        lineWidth={1.5}
      />

      {/* Downlink path */}
      <Line
        points={[satellite, ground]}
        color="#4ade80"
        transparent
        opacity={0.45}
        lineWidth={1.5}
        dashed
        dashSize={0.12}
        gapSize={0.08}
      />

      <SignalPulse
        start={ground}
        end={satellite}
        color="#22d3ee"
        duration={2.5}
      />

      <SignalPulse
        start={satellite}
        end={ground}
        color="#4ade80"
        duration={3}
      />
    </group>
  );
}

function OrbitPath() {
  const points = Array.from({ length: 101 }, (_, index) => {
    const angle = (index / 100) * Math.PI * 2;

    return new THREE.Vector3(
      Math.cos(angle) * 2.3,
      0.55 + Math.sin(angle) * 0.35,
      Math.sin(angle) * 2.3
    );
  });

  return (
    <Line
      points={points}
      color="#64748b"
      transparent
      opacity={0.4}
      lineWidth={1}
    />
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={1.2} />

      <directionalLight
        position={[5, 5, 5]}
        intensity={2.5}
      />

      <pointLight
        position={[-4, -2, -3]}
        intensity={1}
        color="#38bdf8"
      />

      <Stars
        radius={80}
        depth={40}
        count={1800}
        factor={3}
        saturation={0}
        fade
      />

      <Earth />
      <OrbitPath />
      <Satellite />
      <GroundStation />
      <CommunicationSignals />

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI - 0.3}
      />
    </>
  );
}

export default function SatelliteScene() {
  return (
    <div className="h-[420px] w-full overflow-hidden rounded-xl">
      <Canvas
        camera={{
          position: [5, 3, 6],
          fov: 45,
        }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#0b1424"]} />
        <Scene />
      </Canvas>
    </div>
  );
}