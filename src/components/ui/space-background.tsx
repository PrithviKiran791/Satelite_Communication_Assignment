import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/* ---------------------------- Nebula (shader) ---------------------------- */

const nebulaVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragment = /* glsl */ `
  varying vec3 vDir;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 p = vDir * 2.2 + vec3(uTime * 0.01, 0.0, uTime * 0.006);
    float clouds = smoothstep(0.42, 0.85, fbm(p));
    float tint = fbm(p * 1.6 + 10.0);
    vec3 col = mix(uColorA, uColorB, tint) * clouds * 0.55;
    vec3 base = vec3(0.001, 0.001, 0.002);
    gl_FragColor = vec4(base + col, 1.0);
  }
`;

export function Nebula({
  radius = 900,
  colorA = "#4c1d95",
  colorB = "#0369a1",
}: {
  radius?: number;
  colorA?: string;
  colorB?: string;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
    }),
    [colorA, colorB]
  );

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh renderOrder={-10}>
      <sphereGeometry args={[radius, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={nebulaVertex}
        fragmentShader={nebulaFragment}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ----------------------------- Twinkling stars ---------------------------- */

const starVertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vTwinkle = 0.55 + 0.45 * sin(uTime * 1.6 + aPhase);
    vColor = aColor;
    gl_PointSize = aSize * vTwinkle * (500.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const starFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.0, d) * vTwinkle;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

const STAR_COLORS = ["#ffffff", "#cfe3ff", "#ffe9c4", "#ffd2d2", "#bcd0ff"].map(
  (c) => new THREE.Color(c)
);

export function Stars({
  count = 2500,
  radius = 600,
  size = 3,
  parallax = 0.05,
  drift = 0.002,
}: {
  count?: number;
  radius?: number;
  size?: number;
  parallax?: number;
  drift?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes, phases, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const u = pseudoRandom(i * 7 + 1);
      const theta = pseudoRandom(i * 7 + 2) * Math.PI * 2;
      const z = 2 * u - 1;
      const r = Math.sqrt(Math.max(0, 1 - z * z));
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const radDist = radius * (0.85 + pseudoRandom(i * 7 + 3) * 0.15);

      positions.set([x * radDist, y * radDist, z * radDist], i * 3);
      sizes[i] = size * (0.4 + pseudoRandom(i * 7 + 4) * 1.6);
      phases[i] = pseudoRandom(i * 7 + 5) * Math.PI * 2;
      const c = STAR_COLORS[Math.floor(pseudoRandom(i * 7 + 6) * STAR_COLORS.length)];
      colors.set([c.r, c.g, c.b], i * 3);
    }
    return { positions, sizes, phases, colors };
  }, [count, radius, size]);

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock, pointer }, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
    const g = group.current;
    if (!g) return;
    g.rotation.y += delta * drift;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -pointer.y * parallax, 0.04);
    g.position.x = THREE.MathUtils.lerp(g.position.x, pointer.x * parallax * 60, 0.04);
    g.position.y = THREE.MathUtils.lerp(g.position.y, pointer.y * parallax * 60, 0.04);
  });

  return (
    <group ref={group}>
      <points frustumCulled={false} renderOrder={-5}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
          <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={starVertex}
          fragmentShader={starFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/* ----------------------------- Shooting stars ----------------------------- */

type Streak = {
  t: number;
  dur: number;
  pos: THREE.Vector3;
  dir: THREE.Vector3;
};

const UP = new THREE.Vector3(0, 1, 0);

export function ShootingStars({
  count = 3,
  radius = 450,
  speed = 260,
}: {
  count?: number;
  radius?: number;
  speed?: number;
}) {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  const streaksRef = useRef<Streak[] | null>(null);
  if (streaksRef.current == null) {
    streaksRef.current = Array.from({ length: count }, (_, i) => {
      const u = pseudoRandom(i * 8 + 1);
      const theta = pseudoRandom(i * 8 + 2) * Math.PI * 2;
      const z = 2 * u - 1;
      const r = Math.sqrt(Math.max(0, 1 - z * z));
      const pos = new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), z).multiplyScalar(radius);
      const dirU = pseudoRandom(i * 8 + 3);
      const dirTheta = pseudoRandom(i * 8 + 4) * Math.PI * 2;
      const dirZ = 2 * dirU - 1;
      const dirR = Math.sqrt(Math.max(0, 1 - dirZ * dirZ));
      const randVec = new THREE.Vector3(dirR * Math.cos(dirTheta), dirR * Math.sin(dirTheta), dirZ);
      const dir = randVec.cross(pos).normalize();

      return {
        t: -(2 + pseudoRandom(i * 8 + 5) * 7),
        dur: 0.9 + pseudoRandom(i * 8 + 6) * 0.6,
        pos,
        dir,
      };
    });
  }

  useFrame((_, delta) => {
    const streaks = streaksRef.current;
    if (!streaks) return;

    streaks.forEach((s, i) => {
      const m = meshes.current[i];
      if (!m) return;
      s.t += delta;

      if (s.t < 0) {
        m.visible = false;
        return;
      }
      if (s.t > s.dur) {
        const seed = performance.now() + i * 100;
        const u = pseudoRandom(seed);
        const theta = pseudoRandom(seed + 1) * Math.PI * 2;
        const z = 2 * u - 1;
        const r = Math.sqrt(Math.max(0, 1 - z * z));
        s.pos.set(r * Math.cos(theta), r * Math.sin(theta), z).multiplyScalar(radius);
        const randVec = new THREE.Vector3(
          pseudoRandom(seed + 2) * 2 - 1,
          pseudoRandom(seed + 3) * 2 - 1,
          pseudoRandom(seed + 4) * 2 - 1
        );
        s.dir.copy(randVec.cross(s.pos).normalize());
        s.t = -(2 + pseudoRandom(seed + 5) * 7);
        s.dur = 0.9 + pseudoRandom(seed + 6) * 0.6;
        m.visible = false;
        return;
      }

      m.visible = true;
      m.position.copy(s.pos).addScaledVector(s.dir, s.t * speed);
      m.quaternion.setFromUnitVectors(UP, s.dir.clone().negate());
      (m.material as THREE.MeshBasicMaterial).opacity = Math.sin((s.t / s.dur) * Math.PI);
    });
  });

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} ref={(el) => { meshes.current[i] = el; }} visible={false}>
          <coneGeometry args={[0.5, 45, 6]} />
          <meshBasicMaterial
            color="#cfe8ff"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </>
  );
}

/* --------------------------------- Export --------------------------------- */

export interface SpaceBackgroundProps {
  nebula?: boolean;
  shootingStars?: boolean;
  nebulaColorA?: string;
  nebulaColorB?: string;
}

export function SpaceBackground({
  nebula = true,
  shootingStars = true,
  nebulaColorA,
  nebulaColorB,
}: SpaceBackgroundProps) {
  return (
    <>
      {nebula && <Nebula colorA={nebulaColorA} colorB={nebulaColorB} />}
      <Stars count={3000} radius={800} size={2.2} parallax={0.02} drift={0.001} />
      <Stars count={1200} radius={600} size={3.2} parallax={0.05} drift={0.002} />
      <Stars count={300} radius={450} size={5} parallax={0.1} drift={0.004} />
      {shootingStars && <ShootingStars />}
    </>
  );
}
