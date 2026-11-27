import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { createGlowSpriteTexture } from '../../utils/proceduralTextures';

interface SantaSleighProps {
  active: boolean;
}

const FLIGHT_DURATION = 11.5; // Slow graceful arc from left to right
const TRAIL_COUNT = 180;

const _pos = new THREE.Vector3();
const _nextPos = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _dummy = new THREE.Object3D();

/**
 * Composite procedural Reindeer model (body, neck, head, snout, antlers, 4 leaping legs, tail)
 * Facing +X direction to match left-to-right arc flight.
 */
function Reindeer({ index }: { index: number }) {
  const frontLeftRef = useRef<THREE.Group>(null);
  const frontRightRef = useRef<THREE.Group>(null);
  const backLeftRef = useRef<THREE.Group>(null);
  const backRightRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 7.2 + index * 0.75;
    const gallop = Math.sin(t);
    const gallopOpp = Math.sin(t + 0.55);

    if (frontLeftRef.current) frontLeftRef.current.rotation.z = 0.62 + gallop * 0.42;
    if (frontRightRef.current) frontRightRef.current.rotation.z = 0.48 + gallopOpp * 0.42;
    if (backLeftRef.current) backLeftRef.current.rotation.z = -0.68 - gallop * 0.38;
    if (backRightRef.current) backRightRef.current.rotation.z = -0.52 - gallopOpp * 0.38;
    if (bodyRef.current) bodyRef.current.position.y = Math.sin(t) * 0.045;
  });

  const coatColor = '#8c5327';
  const bellyColor = '#b97b42';

  return (
    <group ref={bodyRef} scale={0.78}>
      {/* Torso */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.14, 0.38, 8, 12]} />
        <meshStandardMaterial color={coatColor} roughness={0.62} metalness={0.08} emissive="#4d2608" emissiveIntensity={0.28} />
      </mesh>
      {/* Warm golden-lit chest highlight */}
      <mesh position={[0.12, -0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.11, 0.2, 6, 10]} />
        <meshStandardMaterial color={bellyColor} roughness={0.58} emissive="#7a4212" emissiveIntensity={0.25} />
      </mesh>

      {/* Neck angled forward */}
      <mesh position={[0.27, 0.16, 0]} rotation={[0, 0, -0.52]}>
        <capsuleGeometry args={[0.075, 0.24, 6, 10]} />
        <meshStandardMaterial color={coatColor} roughness={0.62} emissive="#4d2608" emissiveIntensity={0.25} />
      </mesh>

      {/* Head & Snout */}
      <group position={[0.39, 0.32, 0]}>
        <mesh rotation={[0, 0, -0.22]}>
          <sphereGeometry args={[0.095, 12, 12]} />
          <meshStandardMaterial color={coatColor} roughness={0.58} emissive="#4d2608" emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[0.1, -0.02, 0]} rotation={[0, 0, Math.PI / 2 - 0.15]}>
          <capsuleGeometry args={[0.045, 0.09, 6, 8]} />
          <meshStandardMaterial color={bellyColor} roughness={0.55} />
        </mesh>
        {/* Rudolph-like subtle warm nose on lead reindeer */}
        {index === 0 && (
          <mesh position={[0.16, -0.02, 0]}>
            <sphereGeometry args={[0.026, 8, 8]} />
            <meshStandardMaterial color="#ff4747" emissive="#ff2a2a" emissiveIntensity={2.1} />
          </mesh>
        )}

        {/* Branching Golden-Lit Antlers (Left & Right) */}
        {[-1, 1].map((side) => (
          <group key={side} position={[-0.01, 0.08, side * 0.045]} rotation={[side * 0.22, 0, -0.15]}>
            <mesh position={[0, 0.14, 0]} rotation={[0, 0, 0.2]}>
              <cylinderGeometry args={[0.011, 0.015, 0.3, 6]} />
              <meshStandardMaterial color="#e6c88a" emissive="#d4af37" emissiveIntensity={0.45} roughness={0.4} metalness={0.35} />
            </mesh>
            <mesh position={[0.06, 0.19, 0]} rotation={[0, 0, -0.65]}>
              <cylinderGeometry args={[0.008, 0.01, 0.14, 6]} />
              <meshStandardMaterial color="#e6c88a" emissive="#d4af37" emissiveIntensity={0.45} roughness={0.4} />
            </mesh>
            <mesh position={[-0.04, 0.24, 0]} rotation={[0, 0, 0.6]}>
              <cylinderGeometry args={[0.007, 0.009, 0.12, 6]} />
              <meshStandardMaterial color="#e6c88a" emissive="#d4af37" emissiveIntensity={0.45} roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Gold Harness Collar */}
      <mesh position={[0.2, 0.06, 0]} rotation={[0, 0, -0.45]}>
        <torusGeometry args={[0.11, 0.014, 8, 16]} />
        <meshStandardMaterial color="#f5d57a" metalness={0.9} roughness={0.2} emissive="#f4b942" emissiveIntensity={0.7} />
      </mesh>

      {/* 4 Animated Leaping Legs */}
      <group ref={frontLeftRef} position={[0.18, -0.06, 0.08]}>
        <mesh position={[0, -0.17, 0]}>
          <capsuleGeometry args={[0.024, 0.28, 4, 8]} />
          <meshStandardMaterial color={coatColor} roughness={0.65} />
        </mesh>
      </group>
      <group ref={frontRightRef} position={[0.18, -0.06, -0.08]}>
        <mesh position={[0, -0.17, 0]}>
          <capsuleGeometry args={[0.024, 0.28, 4, 8]} />
          <meshStandardMaterial color={coatColor} roughness={0.65} />
        </mesh>
      </group>
      <group ref={backLeftRef} position={[-0.2, -0.05, 0.08]}>
        <mesh position={[0, -0.18, 0]}>
          <capsuleGeometry args={[0.025, 0.3, 4, 8]} />
          <meshStandardMaterial color={coatColor} roughness={0.65} />
        </mesh>
      </group>
      <group ref={backRightRef} position={[-0.2, -0.05, -0.08]}>
        <mesh position={[0, -0.18, 0]}>
          <capsuleGeometry args={[0.025, 0.3, 4, 8]} />
          <meshStandardMaterial color={coatColor} roughness={0.65} />
        </mesh>
      </group>

      {/* Tail */}
      <mesh position={[-0.29, 0.06, 0]} rotation={[0, 0, 0.7]}>
        <coneGeometry args={[0.035, 0.1, 6]} />
        <meshStandardMaterial color={bellyColor} roughness={0.7} />
      </mesh>
    </group>
  );
}

/**
 * Composite Crimson & Gold Ornate Sleigh + Santa + Gift Sack + Reins
 */
function OrnateSleighAndSanta() {
  const { runnerGeo, sidePanelGeo, reinsGeo } = useMemo(() => {
    // Sweeping golden runner curve
    const runnerPts = [
      new THREE.Vector3(-0.72, -0.32, 0),
      new THREE.Vector3(-0.3, -0.34, 0),
      new THREE.Vector3(0.35, -0.34, 0),
      new THREE.Vector3(0.75, -0.22, 0),
      new THREE.Vector3(0.92, -0.02, 0),
      new THREE.Vector3(0.84, 0.1, 0),
    ];
    const runnerCurve = new THREE.CatmullRomCurve3(runnerPts);
    const runner = new THREE.TubeGeometry(runnerCurve, 32, 0.022, 8, false);

    // Ornate curved crimson sleigh side silhouette
    const sleighShape = new THREE.Shape();
    sleighShape.moveTo(-0.66, -0.14);
    sleighShape.quadraticCurveTo(-0.78, 0.25, -0.58, 0.42);
    sleighShape.quadraticCurveTo(-0.34, 0.24, -0.05, 0.12);
    sleighShape.quadraticCurveTo(0.32, 0.08, 0.62, 0.24);
    sleighShape.quadraticCurveTo(0.74, -0.04, 0.55, -0.16);
    sleighShape.closePath();

    const sidePanel = new THREE.ExtrudeGeometry(sleighShape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.012,
      bevelSegments: 2,
    });

    // Reins stretching forward to the 4 reindeer
    const reinCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.22, 0.34, 0),
      new THREE.Vector3(1.15, 0.16, 0),
      new THREE.Vector3(2.4, 0.18, 0),
      new THREE.Vector3(3.65, 0.22, 0),
    ]);
    const reins = new THREE.TubeGeometry(reinCurve, 32, 0.008, 6, false);

    return { runnerGeo: runner, sidePanelGeo: sidePanel, reinsGeo: reins };
  }, []);

  useEffect(() => {
    return () => {
      runnerGeo.dispose();
      sidePanelGeo.dispose();
      reinsGeo.dispose();
    };
  }, [runnerGeo, sidePanelGeo, reinsGeo]);

  return (
    <group>
      {/* Left & Right Golden Sleigh Runners */}
      {[-0.24, 0.24].map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          <mesh geometry={runnerGeo}>
            <meshStandardMaterial color="#f5d57a" metalness={0.94} roughness={0.16} emissive="#f4b942" emissiveIntensity={0.65} />
          </mesh>
          {/* Struts connecting runner to sleigh */}
          <mesh position={[-0.35, -0.23, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.22, 6]} />
            <meshStandardMaterial color="#f5d57a" metalness={0.92} roughness={0.2} />
          </mesh>
          <mesh position={[0.35, -0.23, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.22, 6]} />
            <meshStandardMaterial color="#f5d57a" metalness={0.92} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Sleigh Floor & Backrest */}
      <mesh position={[-0.02, -0.11, 0]}>
        <boxGeometry args={[1.18, 0.07, 0.52]} />
        <meshStandardMaterial color="#8f1717" roughness={0.45} metalness={0.18} emissive="#3d0505" emissiveIntensity={0.35} />
      </mesh>

      {/* Ornate Crimson Sleigh Side Panels */}
      <mesh geometry={sidePanelGeo} position={[0, 0, 0.24]}>
        <meshStandardMaterial color="#a61c1c" roughness={0.38} metalness={0.22} emissive="#4d0808" emissiveIntensity={0.35} />
      </mesh>
      <mesh geometry={sidePanelGeo} position={[0, 0, -0.275]}>
        <meshStandardMaterial color="#a61c1c" roughness={0.38} metalness={0.22} emissive="#4d0808" emissiveIntensity={0.35} />
      </mesh>

      {/* Santa Claus Figure */}
      <group position={[0.04, 0.14, 0]}>
        {/* Red Coat Torso */}
        <mesh position={[0, 0.14, 0]}>
          <capsuleGeometry args={[0.16, 0.22, 8, 12]} />
          <meshStandardMaterial color="#c41e1e" roughness={0.62} emissive="#4a0808" emissiveIntensity={0.3} />
        </mesh>
        {/* White Fur Trim Collar */}
        <mesh position={[0.02, 0.29, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.13, 0.04, 8, 16]} />
          <meshStandardMaterial color="#f8f6f0" roughness={0.85} emissive="#fff7e8" emissiveIntensity={0.25} />
        </mesh>
        {/* Head + White Beard */}
        <mesh position={[0.02, 0.4, 0]}>
          <sphereGeometry args={[0.11, 12, 12]} />
          <meshStandardMaterial color="#f5cbb0" roughness={0.65} />
        </mesh>
        <mesh position={[0.09, 0.34, 0]}>
          <sphereGeometry args={[0.085, 10, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={0.85} emissive="#fff8ec" emissiveIntensity={0.2} />
        </mesh>
        {/* Santa Hat */}
        <mesh position={[-0.02, 0.52, 0]} rotation={[0, 0, 0.42]}>
          <coneGeometry args={[0.1, 0.24, 10]} />
          <meshStandardMaterial color="#c41e1e" roughness={0.6} emissive="#4a0808" emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[-0.08, 0.61, 0]}>
          <sphereGeometry args={[0.038, 8, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} emissive="#ffffff" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* Toy Sack & Gift Boxes piled in back of Sleigh */}
      <group position={[-0.36, 0.15, 0]}>
        <mesh>
          <sphereGeometry args={[0.21, 12, 12]} />
          <meshStandardMaterial color="#7a4c28" roughness={0.8} />
        </mesh>
        <mesh position={[0.05, 0.14, 0.06]} rotation={[0.2, 0.4, 0.1]}>
          <boxGeometry args={[0.16, 0.14, 0.16]} />
          <meshStandardMaterial color="#f0c869" metalness={0.65} roughness={0.3} />
        </mesh>
        <mesh position={[-0.05, 0.15, -0.07]} rotation={[-0.1, -0.3, 0.2]}>
          <boxGeometry args={[0.14, 0.13, 0.14]} />
          <meshStandardMaterial color="#185c45" roughness={0.55} />
        </mesh>
      </group>

      {/* Golden Reins connecting to Reindeer */}
      <mesh geometry={reinsGeo} position={[0, 0, 0.1]}>
        <meshStandardMaterial color="#f7d67e" metalness={0.85} roughness={0.25} emissive="#f4b942" emissiveIntensity={0.6} />
      </mesh>
      <mesh geometry={reinsGeo} position={[0, 0, -0.1]}>
        <meshStandardMaterial color="#f7d67e" metalness={0.85} roughness={0.25} emissive="#f4b942" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

export function SantaSleigh({ active }: SantaSleighProps) {
  const sleighGroupRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Points>(null);
  const elapsedRef = useRef(0);
  const wasActiveRef = useRef(false);

  const glowTex = useMemo(() => createGlowSpriteTexture(64), []);

  // Parabolic arc across upper night sky from Left (-X) to Right (+X)
  const flightCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-15.5, 5.1, -4.6),
      new THREE.Vector3(-6.5, 7.1, -3.5),
      new THREE.Vector3(0.0, 8.2, -3.0),
      new THREE.Vector3(6.8, 7.2, -3.4),
      new THREE.Vector3(15.5, 5.0, -4.4),
    ]);
  }, []);

  // Magic stardust wake trail particles
  const { trailGeo, trailOffsets } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(TRAIL_COUNT * 3);
    const offsets: Array<{ dx: number; dy: number; dz: number; lag: number }> = [];

    for (let i = 0; i < TRAIL_COUNT; i++) {
      offsets.push({
        dx: (Math.random() - 0.5) * 0.65,
        dy: (Math.random() - 0.5) * 0.55 - 0.15,
        dz: (Math.random() - 0.5) * 0.55,
        lag: (i / TRAIL_COUNT) * 0.11,
      });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { trailGeo: geo, trailOffsets: offsets };
  }, []);

  useEffect(() => {
    return () => {
      glowTex.dispose();
      trailGeo.dispose();
    };
  }, [glowTex, trailGeo]);

  useFrame((_, delta) => {
    if (!sleighGroupRef.current || !trailRef.current) return;

    if (!active) {
      wasActiveRef.current = false;
      elapsedRef.current = 0;
      sleighGroupRef.current.visible = false;
      trailRef.current.visible = false;
      return;
    }

    if (!wasActiveRef.current) {
      wasActiveRef.current = true;
      elapsedRef.current = 0;
    }

    elapsedRef.current += delta;
    // Loop smoothly across sky if thumbs-up remains held past one full arc
    const progress = (elapsedRef.current % FLIGHT_DURATION) / FLIGHT_DURATION;

    sleighGroupRef.current.visible = true;
    trailRef.current.visible = true;

    flightCurve.getPointAt(progress, _pos);
    const nextT = Math.min(1, progress + 0.01);
    flightCurve.getPointAt(nextT, _nextPos);

    sleighGroupRef.current.position.copy(_pos);

    // Orient sleigh smoothly along arc tangent (+X forward)
    _dir.copy(_nextPos).sub(_pos).normalize();
    _dummy.position.set(0, 0, 0);
    const yaw = Math.atan2(-_dir.z, _dir.x);
    const pitch = Math.asin(THREE.MathUtils.clamp(_dir.y, -0.9, 0.9));
    sleighGroupRef.current.rotation.set(0, yaw, pitch);

    // Update trailing golden magic dust behind sleigh
    const posAttr = trailGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const o = trailOffsets[i];
      const tp = Math.max(0, progress - o.lag);
      flightCurve.getPointAt(tp, _nextPos);
      posAttr.setXYZ(
        i,
        _nextPos.x + o.dx - 0.55,
        _nextPos.y + o.dy + Math.sin(elapsedRef.current * 4 + i) * 0.08,
        _nextPos.z + o.dz
      );
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group>
      <group ref={sleighGroupRef} visible={false} scale={0.78}>
        <OrnateSleighAndSanta />
        {/* 4 Leaping Reindeer Team in front of sleigh (+X) */}
        {[0, 1, 2, 3].map((idx) => (
          <group key={idx} position={[3.5 - idx * 0.72, 0.14 + (3 - idx) * 0.04, 0]}>
            <Reindeer index={idx} />
          </group>
        ))}
        {/* Warm golden lantern glow under sleigh */}
        <pointLight color="#ffd678" intensity={4.5} distance={7} decay={2} position={[0.4, -0.2, 0.5]} />
      </group>

      {/* Golden Stardust Wake Trail */}
      <points ref={trailRef} geometry={trailGeo} visible={false} frustumCulled={false}>
        <pointsMaterial
          map={glowTex}
          color="#ffe39a"
          size={0.34}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
