import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export interface SatelliteProps {
  orbitRadius?: number;   // globe radius + altitude (three-globe default radius is 100, unit globe is ~1.48)
  speed?: number;         // radians per second
  inclination?: number;   // orbit tilt in radians
  scale?: number;
  bodyTexture?: string;   // metallic / foil texture
  panelTexture?: string;  // solar panel texture
  showOrbitLine?: boolean;
}

export function Satellite({
  orbitRadius = 1.48,
  speed = 0.35,
  inclination = Math.PI / 6,
  scale = 1,
  bodyTexture = "/textures/satellite-body.jpg",
  panelTexture = "/textures/solar-panel.jpg",
  showOrbitLine = true,
}: SatelliteProps) {
  const pivot = useRef<THREE.Group>(null!);
  const sat = useRef<THREE.Group>(null!);

  // Adapt seamlessly whether caller uses three-globe radius 100 (orbitRadius = 140) or unit radius 1.0 (orbitRadius = 1.48)
  const isLargeGlobe = orbitRadius > 10;
  const effectiveRadius = isLargeGlobe ? orbitRadius / 100 : orbitRadius;
  const effectiveScale = (isLargeGlobe ? scale / 100 : scale) * 0.022;
  const ringWidth = isLargeGlobe ? 0.15 : 0.004;

  const [body, panel] = useTexture([bodyTexture, panelTexture]);
  [body, panel].forEach((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  });

  useFrame((_, delta) => {
    if (pivot.current) {
      pivot.current.rotation.y += speed * delta;   // travel along orbit
    }
    if (sat.current) {
      sat.current.rotation.y += 0.2 * delta;       // slow self-spin on axis
    }
  });

  return (
    // tilt the whole orbital plane
    <group rotation={[inclination, 0, 0]}>
      {showOrbitLine && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[effectiveRadius - ringWidth, effectiveRadius + ringWidth, 128]} />
          <meshBasicMaterial
            color="#4da6ff"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      <group ref={pivot}>
        <group ref={sat} position={[effectiveRadius, 0, 0]} scale={effectiveScale}>
          {/* main body */}
          <mesh>
            <boxGeometry args={[3, 3, 4]} />
            <meshStandardMaterial map={body} metalness={0.8} roughness={0.3} />
          </mesh>

          {/* solar panels */}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 6.5, 0, 0]}>
              <boxGeometry args={[8, 0.15, 3.5]} />
              <meshStandardMaterial
                map={panel}
                metalness={0.6}
                roughness={0.4}
                emissive="#112244"
                emissiveIntensity={0.4}
              />
            </mesh>
          ))}

          {/* antenna dish */}
          <mesh position={[0, 2.2, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[1.2, 0.8, 24, 1, true]} />
            <meshStandardMaterial
              color="#dddddd"
              metalness={0.9}
              roughness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 1.7, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 1, 8]} />
            <meshStandardMaterial color="#999" />
          </mesh>

          {/* indicator light */}
          <pointLight color="#22d3ee" intensity={1.5} distance={15} />
        </group>
      </group>
    </group>
  );
}
