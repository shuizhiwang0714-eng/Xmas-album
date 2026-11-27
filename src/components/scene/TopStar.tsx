import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { createGlowSpriteTexture } from '../../utils/proceduralTextures';
import { TREE_BASE_Y, TREE_HEIGHT } from './ParticleTree';

interface TopStarProps {
  morphProgressRef: React.MutableRefObject<number>;
}

function createStarShape(outerR: number, innerR: number, points = 5): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points + Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export function TopStar({ morphProgressRef }: TopStarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const haloSpriteRef = useRef<THREE.Sprite>(null);

  const glowTexture = useMemo(() => createGlowSpriteTexture(256), []);

  const { starGeo, innerStarGeo, stemGeo } = useMemo(() => {
    const outerShape = createStarShape(0.24, 0.105, 5);
    const star = new THREE.ExtrudeGeometry(outerShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.024,
      bevelSize: 0.018,
      bevelSegments: 3,
    });
    star.center();

    const innerShape = createStarShape(0.14, 0.06, 5);
    const inner = new THREE.ExtrudeGeometry(innerShape, {
      depth: 0.075,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.012,
      bevelSegments: 2,
    });
    inner.center();

    const stem = new THREE.CylinderGeometry(0.014, 0.026, 0.16, 12);

    return { starGeo: star, innerStarGeo: inner, stemGeo: stem };
  }, []);

  useEffect(() => {
    return () => {
      glowTexture.dispose();
      starGeo.dispose();
      innerStarGeo.dispose();
      stemGeo.dispose();
    };
  }, [glowTexture, starGeo, innerStarGeo, stemGeo]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const morph = morphProgressRef.current;

    if (groupRef.current) {
      // Gently rise & spin faster when particles scatter
      const targetY = TREE_BASE_Y + TREE_HEIGHT + 0.18 + morph * 1.1;
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 4, delta);
      groupRef.current.rotation.y += delta * (0.4 + morph * 0.9);
      const bob = Math.sin(t * 2.1) * 0.025;
      groupRef.current.position.y += bob * delta * 6;
    }

    if (haloSpriteRef.current) {
      const pulse = 1.45 + Math.sin(t * 2.8) * 0.16;
      haloSpriteRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group ref={groupRef} position={[0, TREE_BASE_Y + TREE_HEIGHT + 0.18, 0]}>
      {/* 1. Compact Sculpted Beveled Gold 5-Point Star */}
      <mesh geometry={starGeo} castShadow>
        <meshStandardMaterial
          color="#fce5a2"
          emissive="#ffca5c"
          emissiveIntensity={1.85}
          metalness={0.88}
          roughness={0.14}
        />
      </mesh>

      {/* 2. Incandescent Inner Crystal Star Core */}
      <mesh geometry={innerStarGeo}>
        <meshStandardMaterial
          color="#fffdf2"
          emissive="#fff4c4"
          emissiveIntensity={2.8}
          metalness={0.25}
          roughness={0.08}
        />
      </mesh>

      {/* 3. Delicate Gold Finial Stem Anchoring Star to Tree Tip */}
      <mesh geometry={stemGeo} position={[0, -0.17, 0]}>
        <meshStandardMaterial
          color="#e5be62"
          emissive="#f4b942"
          emissiveIntensity={0.65}
          metalness={0.92}
          roughness={0.22}
        />
      </mesh>

      {/* 4. Soft Golden Bloom Halo Sprite */}
      <sprite ref={haloSpriteRef} scale={[1.45, 1.45, 1]}>
        <spriteMaterial
          map={glowTexture}
          color="#ffe6a6"
          transparent
          opacity={0.74}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* Warm Summit Point Light */}
      <pointLight color="#ffd885" intensity={2.4} distance={8} decay={2} />
    </group>
  );
}
