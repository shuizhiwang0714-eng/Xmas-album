import { ThreeEvent, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GiftRecipient } from '../../types';
import {
  createContactShadowTexture,
  createGiftTagTexture,
  createGlowSpriteTexture,
  createPaperGrainTexture,
  createRibbonTexture,
} from '../../utils/proceduralTextures';

interface GiftBoxesProps {
  onOpenGift: (recipient: GiftRecipient) => void;
  activeOpeningGift: GiftRecipient | null;
  morphProgressRef: React.MutableRefObject<number>;
}

interface GiftSpec {
  id: string;
  position: [number, number, number];
  rotationY: number;
  size: [number, number, number]; // width, height, depth
  theme: 'red-gold' | 'green-red';
  recipient?: GiftRecipient;
  tagLabel?: string;
}

const GIFT_SPECS: GiftSpec[] = [
  // Interactive Hero Box 1: For Mom (Red box + Gold satin ribbon, front-left)
  {
    id: 'gift-mom',
    position: [-1.45, 0, 1.52],
    rotationY: 0.42,
    size: [0.92, 0.56, 0.74],
    theme: 'red-gold',
    recipient: 'mom',
    tagLabel: 'For Mom',
  },
  // Interactive Hero Box 2: For Dad (Dark green box + Red velvet ribbon, front-right)
  {
    id: 'gift-dad',
    position: [1.42, 0, 1.44],
    rotationY: -0.36,
    size: [1.02, 0.62, 0.8],
    theme: 'green-red',
    recipient: 'dad',
    tagLabel: 'For Dad',
  },
  // Decorative boxes stacked & scattered around base (non-clickable)
  {
    id: 'gift-dec-1',
    position: [-2.25, 0, 0.35],
    rotationY: 0.88,
    size: [0.78, 0.48, 0.68],
    theme: 'green-red',
  },
  {
    id: 'gift-dec-2',
    position: [-2.18, 0.48, 0.32],
    rotationY: 0.54,
    size: [0.54, 0.34, 0.5],
    theme: 'red-gold',
  },
  {
    id: 'gift-dec-3',
    position: [2.28, 0, 0.25],
    rotationY: -0.78,
    size: [0.88, 0.52, 0.74],
    theme: 'red-gold',
  },
  {
    id: 'gift-dec-4',
    position: [0.15, 0, -2.05],
    rotationY: 0.22,
    size: [1.05, 0.58, 0.78],
    theme: 'green-red',
  },
  {
    id: 'gift-dec-5',
    position: [-1.35, 0, -1.65],
    rotationY: -0.58,
    size: [0.82, 0.46, 0.66],
    theme: 'red-gold',
  },
  {
    id: 'gift-dec-6',
    position: [1.55, 0, -1.55],
    rotationY: 0.64,
    size: [0.76, 0.42, 0.64],
    theme: 'green-red',
  },
  {
    id: 'gift-dec-7',
    position: [0.12, 0, 2.05],
    rotationY: -0.15,
    size: [0.64, 0.36, 0.56],
    theme: 'red-gold',
  },
];

interface SingleGiftBoxProps {
  spec: GiftSpec;
  redPaperTex: THREE.CanvasTexture;
  greenPaperTex: THREE.CanvasTexture;
  goldRibbonTex: THREE.CanvasTexture;
  redRibbonTex: THREE.CanvasTexture;
  shadowTex: THREE.CanvasTexture;
  glowTex: THREE.CanvasTexture;
  isOpening: boolean;
  onOpenGift: (recipient: GiftRecipient) => void;
  morphProgressRef: React.MutableRefObject<number>;
}

function SingleGiftBox({
  spec,
  redPaperTex,
  greenPaperTex,
  goldRibbonTex,
  redRibbonTex,
  shadowTex,
  glowTex,
  isOpening,
  onOpenGift,
  morphProgressRef,
}: SingleGiftBoxProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const lidGroupRef = useRef<THREE.Group>(null);
  const burstSpriteRef = useRef<THREE.Sprite>(null);
  const burstLightRef = useRef<THREE.PointLight>(null);
  const openProgressRef = useRef(0);

  const isClickable = Boolean(spec.recipient);
  const [w, h, d] = spec.size;

  const isRed = spec.theme === 'red-gold';
  const paperTex = isRed ? redPaperTex : greenPaperTex;
  const ribbonTex = isRed ? goldRibbonTex : redRibbonTex;

  const tagTex = useMemo(() => {
    return spec.tagLabel ? createGiftTagTexture(spec.tagLabel) : null;
  }, [spec.tagLabel]);

  useEffect(() => {
    return () => {
      tagTex?.dispose();
    };
  }, [tagTex]);

  useEffect(() => {
    if (!isClickable) return;
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, isClickable]);

  useFrame((state, delta) => {
    const morph = morphProgressRef.current;

    if (groupRef.current) {
      // Slightly scale down or soften gifts when particles disperse
      const hoverLift = isClickable && hovered ? 0.045 : 0;
      const targetY = spec.position[1] + hoverLift;
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 8, delta);
      const scaleTarget = 1 - morph * 0.12;
      groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, scaleTarget, 6, delta));
    }

    // Opening burst animation when Mom/Dad gift is clicked
    const targetOpen = isOpening ? 1 : 0;
    openProgressRef.current = THREE.MathUtils.damp(openProgressRef.current, targetOpen, 4.2, delta);
    const p = openProgressRef.current;

    if (lidGroupRef.current) {
      lidGroupRef.current.position.y = h + p * 0.38;
      lidGroupRef.current.rotation.x = -p * 0.42;
    }

    if (burstSpriteRef.current && burstLightRef.current) {
      burstSpriteRef.current.visible = p > 0.01;
      const burstScale = 0.5 + p * 7.5;
      burstSpriteRef.current.scale.set(burstScale, burstScale, 1);
      (burstSpriteRef.current.material as THREE.SpriteMaterial).opacity = Math.min(1, p * 1.6);
      burstLightRef.current.intensity = p * 28;
    }

    // Gentle hover shimmer pulse on clickable gift tag
    if (isClickable && !isOpening) {
      const t = state.clock.elapsedTime;
      if (burstLightRef.current) {
        burstLightRef.current.intensity = hovered ? 1.8 + Math.sin(t * 4) * 0.4 : 0.45;
      }
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isClickable || !spec.recipient) return;
    e.stopPropagation();
    onOpenGift(spec.recipient);
  };

  const lidH = Math.min(0.11, h * 0.24);
  const ribbonW = Math.min(w, d) * 0.16;

  return (
    <group
      ref={groupRef}
      position={spec.position}
      rotation={[0, spec.rotationY, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        if (!isClickable) return;
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => {
        if (isClickable) setHovered(false);
      }}
    >
      {/* Radial Ground Contact Shadow */}
      {spec.position[1] === 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <planeGeometry args={[w * 1.65, d * 1.65]} />
          <meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={0.62} />
        </mesh>
      )}

      {/* 1. Gift Box Base Body (bottom-center pivoted at y = 0) */}
      <mesh position={[0, (h - lidH * 0.35) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h - lidH * 0.35, d]} />
        <meshStandardMaterial
          map={paperTex}
          roughness={0.72}
          metalness={0.05}
          emissive={isClickable && hovered ? '#d4af37' : '#000000'}
          emissiveIntensity={isClickable && hovered ? 0.14 : 0}
        />
      </mesh>

      {/* Vertical Cross-Ribbons on Base */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[ribbonW, h + 0.008, d + 0.014]} />
        <meshStandardMaterial
          map={ribbonTex}
          roughness={isRed ? 0.28 : 0.58}
          metalness={isRed ? 0.58 : 0.08}
        />
      </mesh>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w + 0.014, h + 0.008, ribbonW]} />
        <meshStandardMaterial
          map={ribbonTex}
          roughness={isRed ? 0.28 : 0.58}
          metalness={isRed ? 0.58 : 0.08}
        />
      </mesh>

      {/* 2. Separate Overhanging Lid + Cross Ribbon + Sculpted 3D Multi-Loop Bow */}
      <group ref={lidGroupRef} position={[0, h, 0]}>
        <mesh position={[0, -lidH * 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[w + 0.045, lidH, d + 0.045]} />
          <meshStandardMaterial map={paperTex} roughness={0.7} metalness={0.05} />
        </mesh>

        {/* Lid top cross ribbons */}
        <mesh position={[0, -lidH * 0.42 + 0.004, 0]}>
          <boxGeometry args={[ribbonW + 0.006, lidH + 0.01, d + 0.054]} />
          <meshStandardMaterial
            map={ribbonTex}
            roughness={isRed ? 0.26 : 0.55}
            metalness={isRed ? 0.62 : 0.08}
          />
        </mesh>
        <mesh position={[0, -lidH * 0.42 + 0.004, 0]}>
          <boxGeometry args={[w + 0.054, lidH + 0.01, ribbonW + 0.006]} />
          <meshStandardMaterial
            map={ribbonTex}
            roughness={isRed ? 0.26 : 0.55}
            metalness={isRed ? 0.62 : 0.08}
          />
        </mesh>

        {/* Sculpted Multi-Loop 3D Ribbon Bow */}
        <group position={[0, 0.02, 0]}>
          {/* Center knot */}
          <mesh position={[0, 0.03, 0]} castShadow>
            <sphereGeometry args={[ribbonW * 0.45, 14, 14]} />
            <meshStandardMaterial
              map={ribbonTex}
              roughness={isRed ? 0.24 : 0.52}
              metalness={isRed ? 0.65 : 0.1}
            />
          </mesh>
          {/* Four sculpted bow loops */}
          {[0.35, Math.PI - 0.35, Math.PI + 0.35, -0.35].map((ang, i) => (
            <group key={i} rotation={[0, ang, 0]}>
              <mesh position={[ribbonW * 0.72, 0.055, 0]} rotation={[0.25, 0, -0.35]} scale={[1.25, 0.72, 0.85]} castShadow>
                <torusGeometry args={[ribbonW * 0.58, ribbonW * 0.19, 10, 24]} />
                <meshStandardMaterial
                  map={ribbonTex}
                  roughness={isRed ? 0.25 : 0.54}
                  metalness={isRed ? 0.62 : 0.08}
                />
              </mesh>
            </group>
          ))}
          {/* Ribbon tails draped over lid */}
          <mesh position={[ribbonW * 0.7, 0.012, ribbonW * 0.55]} rotation={[0.08, 0.45, -0.08]}>
            <boxGeometry args={[ribbonW * 1.45, 0.01, ribbonW * 0.55]} />
            <meshStandardMaterial map={ribbonTex} roughness={isRed ? 0.26 : 0.55} metalness={isRed ? 0.6 : 0.08} />
          </mesh>
          <mesh position={[-ribbonW * 0.68, 0.012, ribbonW * 0.48]} rotation={[0.08, -0.5, 0.08]}>
            <boxGeometry args={[ribbonW * 1.35, 0.01, ribbonW * 0.55]} />
            <meshStandardMaterial map={ribbonTex} roughness={isRed ? 0.26 : 0.55} metalness={isRed ? 0.6 : 0.08} />
          </mesh>
        </group>

        {/* Interactive Gift Card Tag ("For Mom" / "For Dad") */}
        {tagTex && (
          <group position={[w * 0.2, 0.045, d * 0.28]} rotation={[-0.45, 0.22, -0.14]}>
            {/* Gold string */}
            <mesh position={[-0.14, 0.02, 0]} rotation={[0, 0, 0.4]}>
              <cylinderGeometry args={[0.004, 0.004, 0.16, 6]} />
              <meshStandardMaterial color="#f5d57a" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Cardstock tag */}
            <mesh castShadow>
              <boxGeometry args={[0.38, 0.21, 0.012]} />
              <meshStandardMaterial
                map={tagTex}
                roughness={0.5}
                metalness={0.08}
                emissive="#fff3d1"
                emissiveMap={tagTex}
                emissiveIntensity={hovered ? 0.42 : 0.15}
              />
            </mesh>
          </group>
        )}
      </group>

      {/* White Light Burst Core Inside Interactive Gifts */}
      {isClickable && (
        <>
          <sprite ref={burstSpriteRef} position={[0, h * 0.75, 0]} visible={false}>
            <spriteMaterial
              map={glowTex}
              color="#ffffff"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
          <pointLight
            ref={burstLightRef}
            position={[0, h + 0.25, 0.2]}
            color="#fff8e8"
            intensity={0.45}
            distance={6}
            decay={2}
          />
        </>
      )}
    </group>
  );
}

export function GiftBoxes({ onOpenGift, activeOpeningGift, morphProgressRef }: GiftBoxesProps) {
  const textures = useMemo(() => {
    const redPaperTex = createPaperGrainTexture('#a1201d');
    const greenPaperTex = createPaperGrainTexture('#173e33');
    const goldRibbonTex = createRibbonTexture('#d7af53', '#fae4a2');
    const redRibbonTex = createRibbonTexture('#8c151c', '#be242e');
    const shadowTex = createContactShadowTexture();
    const glowTex = createGlowSpriteTexture(256);
    return { redPaperTex, greenPaperTex, goldRibbonTex, redRibbonTex, shadowTex, glowTex };
  }, []);

  useEffect(() => {
    return () => {
      textures.redPaperTex.dispose();
      textures.greenPaperTex.dispose();
      textures.goldRibbonTex.dispose();
      textures.redRibbonTex.dispose();
      textures.shadowTex.dispose();
      textures.glowTex.dispose();
    };
  }, [textures]);

  return (
    <group>
      {GIFT_SPECS.map((spec) => (
        <SingleGiftBox
          key={spec.id}
          spec={spec}
          redPaperTex={textures.redPaperTex}
          greenPaperTex={textures.greenPaperTex}
          goldRibbonTex={textures.goldRibbonTex}
          redRibbonTex={textures.redRibbonTex}
          shadowTex={textures.shadowTex}
          glowTex={textures.glowTex}
          isOpening={activeOpeningGift !== null && activeOpeningGift === spec.recipient}
          onOpenGift={onOpenGift}
          morphProgressRef={morphProgressRef}
        />
      ))}
    </group>
  );
}
