import { useMemo, useRef, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { latLngToVector3 } from "@/lib/geo";

/* ---- panel antenna texture: loads image, or draws a procedural one ---- */
function makeAntennaTexture(url?: string) {
  if (url) {
    const t = new THREE.TextureLoader().load(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  if (typeof document === "undefined") {
    return new THREE.Texture();
  }
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 512;
  const g = c.getContext("2d");
  if (!g) return new THREE.Texture();
  g.fillStyle = "#d9dde2"; // radome
  g.fillRect(0, 0, 128, 512);
  g.fillStyle = "#c4c9cf";
  g.fillRect(8, 8, 112, 496);
  // dipole element grid
  g.strokeStyle = "#7c838b";
  g.lineWidth = 3;
  for (let y = 30; y < 490; y += 40) {
    g.strokeRect(34, y, 60, 22);
    g.beginPath();
    g.moveTo(34, y + 11);
    g.lineTo(94, y + 11);
    g.stroke();
  }
  // feed line
  g.beginPath();
  g.moveTo(64, 10);
  g.lineTo(64, 502);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ---------------------------------- Tower --------------------------------- */
function Lattice({ height, baseW, topW }: { height: number; baseW: number; topW: number }) {
  const legs = useMemo(() => {
    const a = [0, 1, 2].map((i) => (i / 3) * Math.PI * 2 + Math.PI / 6);
    return a.map((ang) => ({
      b: new THREE.Vector3(Math.cos(ang) * baseW, 0, Math.sin(ang) * baseW),
      t: new THREE.Vector3(Math.cos(ang) * topW, height, Math.sin(ang) * topW),
    }));
  }, [height, baseW, topW]);

  const beam = (a: THREE.Vector3, b: THREE.Vector3, r: number, key: string) => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const len = a.distanceTo(b);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      b.clone().sub(a).normalize()
    );
    return (
      <mesh key={key} position={mid} quaternion={q}>
        <cylinderGeometry args={[r, r, len, 6]} />
        <meshStandardMaterial color="#c9ced4" metalness={0.7} roughness={0.35} />
      </mesh>
    );
  };

  const parts: ReactNode[] = [];
  legs.forEach((l, i) => parts.push(beam(l.b, l.t, 0.12, `leg${i}`)));

  // horizontal rings + diagonal braces between levels
  const levels = 6;
  for (let k = 0; k < levels; k++) {
    const t0 = k / levels;
    const t1 = (k + 1) / levels;
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3;
      const p = (t: number, idx: number) =>
        legs[idx].b.clone().lerp(legs[idx].t, t);
      parts.push(beam(p(t1, i), p(t1, j), 0.06, `h${k}-${i}`));
      parts.push(beam(p(t0, i), p(t1, j), 0.05, `d${k}-${i}`));
    }
  }
  return <>{parts}</>;
}

/* --------------------------------- Antenna -------------------------------- */
export interface BaseStationProps {
  lat: number;
  lng: number;
  globeRadius?: number; // 1.0 for unit globe, 100 for three-globe default
  height?: number;      // base model height (default ~7 on 100 globe, scales to globe)
  textureUrl?: string;  // e.g. "/textures/antenna-panel.jpg"
  pulse?: boolean;
  color?: string;       // signal ring / beacon accent
  scale?: number;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
}

export function BaseStation({
  lat,
  lng,
  globeRadius = 1.0,
  height = 7,
  textureUrl,
  pulse = true,
  color = "#4da6ff",
  scale: scaleOverride,
  onClick,
  onPointerOver,
  onPointerOut,
}: BaseStationProps) {
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const beacon = useRef<THREE.Mesh>(null!);

  const isUnitScale = globeRadius < 10;
  const effectiveRadius = isUnitScale ? globeRadius : globeRadius / 100;
  // Compute scale multiplier so tower models look properly proportioned on both 1.0-radius and 100-radius globes
  const effectiveScale =
    scaleOverride ?? (isUnitScale ? (height > 1 ? height / 700 : height / 7) : height / 7);

  const position = useMemo(
    () => latLngToVector3(lat, lng, effectiveRadius),
    [lat, lng, effectiveRadius]
  );
  const quaternion = useMemo(() => {
    const normal = position.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  }, [position]);

  const panelTex = useMemo(() => makeAntennaTexture(textureUrl), [textureUrl]);

  // BoxGeometry face order: +x, -x, +y, -y, +z, -z -> texture only on +z (front)
  const panelMats = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ color: "#aab0b7", metalness: 0.5, roughness: 0.5 });
    const front = new THREE.MeshStandardMaterial({
      map: panelTex,
      metalness: 0.3,
      roughness: 0.5,
    });
    return [side, side, side, side, front, side];
  }, [panelTex]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (beacon.current) {
      (beacon.current.material as THREE.MeshBasicMaterial).opacity =
        0.4 + 0.6 * (Math.sin(t * 4) > 0 ? 1 : 0.1);
    }
    rings.current.forEach((m, i) => {
      if (!m) return;
      const p = (t * 0.5 + i / 3) % 1;
      m.scale.setScalar(1 + p * 7 * 1.8);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.6;
    });
  });

  const topY = 7;

  return (
    <group
      position={position}
      quaternion={quaternion}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <group scale={effectiveScale}>
        {/* concrete pad */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[topY * 0.28, topY * 0.32, 0.2, 24]} />
          <meshStandardMaterial color="#5b6168" roughness={0.9} />
        </mesh>

        {/* equipment cabinet */}
        <mesh position={[topY * 0.22, 0.45, 0]}>
          <boxGeometry args={[0.8, 0.7, 0.6]} />
          <meshStandardMaterial color="#8d949c" metalness={0.4} roughness={0.6} />
        </mesh>

        {/* lattice mast */}
        <Lattice height={topY} baseW={topY * 0.12} topW={topY * 0.03} />

        {/* top platform */}
        <mesh position={[0, topY, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.1, 6]} />
          <meshStandardMaterial color="#777e86" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* 3 sector panels, 120 degrees apart, facing outward, slight downtilt */}
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, topY + 0.1, 0]} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
            <mesh
              position={[0, 0.7, 0.55]}
              rotation={[THREE.MathUtils.degToRad(-6), 0, 0]}
              material={panelMats}
            >
              <boxGeometry args={[0.45, 1.4, 0.12]} />
            </mesh>
          </group>
        ))}

        {/* microwave dish */}
        <group position={[0, topY - 1.4, 0]} rotation={[0, Math.PI / 5, 0]}>
          <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <sphereGeometry args={[0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
            <meshStandardMaterial color="#f1f3f5" metalness={0.5} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>

        {/* lightning rod + blinking beacon */}
        <mesh position={[0, topY + 1.9, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.6, 6]} />
          <meshStandardMaterial color="#999" metalness={0.8} />
        </mesh>
        <mesh ref={beacon} position={[0, topY + 2.75, 0]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshBasicMaterial color="#ff3b30" transparent />
        </mesh>
        <pointLight position={[0, topY + 2.75, 0]} color="#ff3b30" intensity={0.6} distance={6} />

        {/* expanding signal rings */}
        {pulse &&
          [0, 1, 2].map((i) => (
            <mesh
              key={i}
              ref={(el) => { rings.current[i] = el; }}
              position={[0, topY + 0.6, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.95, 1, 64]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
      </group>
    </group>
  );
}
