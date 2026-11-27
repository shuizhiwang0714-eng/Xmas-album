import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getTreeRadiusAtFraction, TREE_BASE_Y, TREE_HEIGHT } from './ParticleTree';

interface MetallicOrnamentsProps {
  morphProgressRef: React.MutableRefObject<number>;
}

const ORNAMENT_COUNT = 68;

const _mat4 = new THREE.Matrix4();
const _capMat4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _capPos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _capScale = new THREE.Vector3();
const _euler = new THREE.Euler();

interface OrnamentDatum {
  treePos: THREE.Vector3;
  scatterPos: THREE.Vector3;
  radius: number;
  color: THREE.Color;
  phase: number;
}

export function MetallicOrnaments({ morphProgressRef }: MetallicOrnamentsProps) {
  const spheresRef = useRef<THREE.InstancedMesh>(null);
  const capsRef = useRef<THREE.InstancedMesh>(null);

  const ornaments = useMemo<OrnamentDatum[]>(() => {
    const palette = [
      new THREE.Color('#f0c869'), // Champagne Gold
      new THREE.Color('#b91c1c'), // Ruby Crimson
      new THREE.Color('#047857'), // Deep Emerald
      new THREE.Color('#e2b857'), // Antique Brass
      new THREE.Color('#991b1b'), // Velvet Burgundy
    ];

    const list: OrnamentDatum[] = [];
    let seed = 8831;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < ORNAMENT_COUNT; i++) {
      const t = 0.08 + (i / ORNAMENT_COUNT) * 0.82;
      const y = TREE_BASE_Y + t * TREE_HEIGHT;
      const theta = i * 2.39996 + rand() * 0.35; // Golden angle spiral
      const r = getTreeRadiusAtFraction(t) * (0.86 + rand() * 0.16);

      const treePos = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);

      const sTheta = theta + (rand() - 0.5) * 1.4;
      const sRad = 3.8 + rand() * 4.5;
      const scatterPos = new THREE.Vector3(
        Math.cos(sTheta) * sRad,
        1.2 + rand() * 6.5,
        Math.sin(sTheta) * sRad
      );

      const baseScale = 0.095 + (1 - t * 0.45) * 0.055;
      const radius = baseScale * (0.86 + rand() * 0.28);

      list.push({
        treePos,
        scatterPos,
        radius,
        color: palette[i % palette.length],
        phase: rand() * Math.PI * 2,
      });
    }
    return list;
  }, []);

  // Initialize instance colors once
  useEffect(() => {
    if (!spheresRef.current) return;
    ornaments.forEach((o, i) => {
      spheresRef.current!.setColorAt(i, o.color);
    });
    if (spheresRef.current.instanceColor) {
      spheresRef.current.instanceColor.needsUpdate = true;
    }
  }, [ornaments]);

  useFrame((state) => {
    if (!spheresRef.current || !capsRef.current) return;
    const t = state.clock.elapsedTime;
    const morph = morphProgressRef.current;

    for (let i = 0; i < ORNAMENT_COUNT; i++) {
      const o = ornaments[i];
      _pos.copy(o.treePos).lerp(o.scatterPos, morph);

      if (morph > 0.01) {
        _pos.y += Math.sin(t * 1.1 + o.phase) * 0.24 * morph;
        _pos.x += Math.cos(t * 0.8 + o.phase) * 0.12 * morph;
      }

      _euler.set(0, t * 0.35 + o.phase, Math.sin(t * 1.4 + o.phase) * 0.06);
      _quat.setFromEuler(_euler);
      _scale.setScalar(o.radius);
      _mat4.compose(_pos, _quat, _scale);
      spheresRef.current.setMatrixAt(i, _mat4);

      // Crown cap sits cleanly atop each bauble
      _capPos.copy(_pos);
      _capPos.y += o.radius * 0.96;
      _capScale.set(o.radius * 0.36, o.radius * 0.26, o.radius * 0.36);
      _capMat4.compose(_capPos, _quat, _capScale);
      capsRef.current.setMatrixAt(i, _capMat4);
    }

    spheresRef.current.instanceMatrix.needsUpdate = true;
    capsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Reflective Metallic Ornament Baubles */}
      <instancedMesh
        ref={spheresRef}
        args={[undefined, undefined, ORNAMENT_COUNT]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 24, 24]} />
        <meshPhysicalMaterial
          metalness={0.9}
          roughness={0.14}
          clearcoat={0.85}
          clearcoatRoughness={0.1}
          envMapIntensity={1.45}
        />
      </instancedMesh>

      {/* Gold Crown Caps on every Ornament */}
      <instancedMesh
        ref={capsRef}
        args={[undefined, undefined, ORNAMENT_COUNT]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.8, 1.0, 1.0, 12]} />
        <meshStandardMaterial color="#f5d57a" metalness={0.95} roughness={0.18} />
      </instancedMesh>
    </group>
  );
}
