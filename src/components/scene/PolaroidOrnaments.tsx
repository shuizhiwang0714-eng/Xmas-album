import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { PolaroidItem } from '../../types';
import { renderPolaroidCanvas } from '../../utils/proceduralTextures';
import { getTreeRadiusAtFraction, TREE_BASE_Y, TREE_HEIGHT } from './ParticleTree';

interface PolaroidOrnamentsProps {
  items: PolaroidItem[];
  selectedId: string | null;
  grabbedId: string | null;
  grabOffsetRef: React.MutableRefObject<{ x: number; y: number }>;
  onSelect: (id: string | null) => void;
  morphProgressRef: React.MutableRefObject<number>;
  treeGroupRef: React.RefObject<THREE.Group | null>;
  frontmostIdRef: React.MutableRefObject<string | null>;
}

const _worldCamPos = new THREE.Vector3();
const _worldCamDir = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _camUp = new THREE.Vector3();
const _targetWorldPos = new THREE.Vector3();
const _targetLocalPos = new THREE.Vector3();
const _treeWorldQuat = new THREE.Quaternion();
const _targetLocalQuat = new THREE.Quaternion();
const _cardWorldPos = new THREE.Vector3();
const _toCam = new THREE.Vector3();
const _cardForward = new THREE.Vector3();

interface SinglePolaroidProps {
  item: PolaroidItem;
  index: number;
  isSelected: boolean;
  isGrabbed: boolean;
  grabOffsetRef: React.MutableRefObject<{ x: number; y: number }>;
  onSelect: (id: string | null) => void;
  morphProgressRef: React.MutableRefObject<number>;
  treeGroupRef: React.RefObject<THREE.Group | null>;
  scoreMapRef: React.MutableRefObject<Record<string, number>>;
}

function SinglePolaroid({
  item,
  index,
  isSelected,
  isGrabbed,
  grabOffsetRef,
  onSelect,
  morphProgressRef,
  treeGroupRef,
  scoreMapRef,
}: SinglePolaroidProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const { camera, gl } = useThree();

  // Load uploaded image if present
  useEffect(() => {
    if (!item.imageUrl) {
      setLoadedImg(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!cancelled) setLoadedImg(img);
    };
    img.onerror = () => {
      if (!cancelled) setLoadedImg(null);
    };
    img.src = item.imageUrl;
    return () => {
      cancelled = true;
    };
  }, [item.imageUrl]);

  // Compute physical 3D Polaroid dimensions preserving the original photo's aspect ratio
  const { cardW, cardH, texture } = useMemo(() => {
    const { canvas, totalWidth, totalHeight } = renderPolaroidCanvas(
      loadedImg,
      item.caption,
      item.aspectRatio
    );
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    tex.needsUpdate = true;

    const aspectTotal = totalWidth / totalHeight;
    const baseHeight = 0.5;
    const w = aspectTotal >= 1 ? baseHeight * Math.min(1.45, aspectTotal) : baseHeight * aspectTotal;
    const h = w / aspectTotal;
    return { cardW: w, cardH: h, texture: tex };
  }, [loadedImg, item.caption, item.aspectRatio, gl]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  // Base tree & scatter coordinates
  const { treePos, treeQuat, scatterPos } = useMemo(() => {
    const y = TREE_BASE_Y + item.heightFraction * TREE_HEIGHT;
    const r = getTreeRadiusAtFraction(item.heightFraction) + 0.19;
    const tx = Math.cos(item.angle) * r;
    const tz = Math.sin(item.angle) * r;
    const tPos = new THREE.Vector3(tx, y, tz);

    const dummy = new THREE.Object3D();
    dummy.position.copy(tPos);
    dummy.lookAt(tx * 2.2, y + 0.28, tz * 2.2);
    const tQuat = dummy.quaternion.clone();

    const sAngle = item.angle + 0.6;
    const sRad = 3.5 + (index % 3) * 0.75;
    const sPos = new THREE.Vector3(
      Math.cos(sAngle) * sRad,
      2.1 + item.heightFraction * 4.2,
      Math.sin(sAngle) * sRad
    );

    return { treePos: tPos, treeQuat: tQuat, scatterPos: sPos };
  }, [item.heightFraction, item.angle, index]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const morph = morphProgressRef.current;

    // Score how much this Polaroid faces the camera
    groupRef.current.getWorldPosition(_cardWorldPos);
    _toCam.copy(camera.position).sub(_cardWorldPos).normalize();
    _cardForward.set(0, 0, 1).applyQuaternion(groupRef.current.getWorldQuaternion(_treeWorldQuat));
    const facingDot = _cardForward.dot(_toCam);
    scoreMapRef.current[item.id] = facingDot - _cardWorldPos.distanceTo(camera.position) * 0.04;

    if (isGrabbed) {
      // Right-hand pinch: Grab photo and immediately zoom it clearly in front of the viewer
      camera.getWorldPosition(_worldCamPos);
      camera.getWorldDirection(_worldCamDir);
      _camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
      _camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);

      const offset = grabOffsetRef.current;
      _targetWorldPos
        .copy(_worldCamPos)
        .addScaledVector(_worldCamDir, 2.38)
        .addScaledVector(_camRight, offset.x * 0.45)
        .addScaledVector(_camUp, offset.y * 0.3);

      if (treeGroupRef.current) {
        treeGroupRef.current.worldToLocal(_targetLocalPos.copy(_targetWorldPos));
        treeGroupRef.current.getWorldQuaternion(_treeWorldQuat);
        _targetLocalQuat.copy(_treeWorldQuat).invert().multiply(camera.quaternion);
      } else {
        _targetLocalPos.copy(_targetWorldPos);
        _targetLocalQuat.copy(camera.quaternion);
      }

      const lambda = 9.0;
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, _targetLocalPos.x, lambda, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, _targetLocalPos.y, lambda, delta);
      groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, _targetLocalPos.z, lambda, delta);
      groupRef.current.quaternion.slerp(_targetLocalQuat, 1 - Math.exp(-lambda * delta));

      const nextScale = THREE.MathUtils.damp(groupRef.current.scale.x, 2.15, lambda, delta);
      groupRef.current.scale.setScalar(nextScale);
    } else if (isSelected) {
      // Gesture 3 / Click: Release hand -> Zoom photo squarely to full view
      camera.getWorldPosition(_worldCamPos);
      camera.getWorldDirection(_worldCamDir);
      _targetWorldPos.copy(_worldCamPos).addScaledVector(_worldCamDir, 2.35);

      if (treeGroupRef.current) {
        treeGroupRef.current.worldToLocal(_targetLocalPos.copy(_targetWorldPos));
        treeGroupRef.current.getWorldQuaternion(_treeWorldQuat);
        _targetLocalQuat.copy(_treeWorldQuat).invert().multiply(camera.quaternion);
      } else {
        _targetLocalPos.copy(_targetWorldPos);
        _targetLocalQuat.copy(camera.quaternion);
      }

      const lambda = 7.5;
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, _targetLocalPos.x, lambda, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, _targetLocalPos.y, lambda, delta);
      groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, _targetLocalPos.z, lambda, delta);
      groupRef.current.quaternion.slerp(_targetLocalQuat, 1 - Math.exp(-lambda * delta));

      const nextScale = THREE.MathUtils.damp(groupRef.current.scale.x, 2.15, lambda, delta);
      groupRef.current.scale.setScalar(nextScale);
    } else {
      // Return smoothly to tree / scatter anchor
      const swayZ = Math.sin(t * 1.45 + index * 1.1) * 0.035;
      const swayX = Math.cos(t * 1.1 + index * 0.8) * 0.025;

      const targetX = THREE.MathUtils.lerp(treePos.x, scatterPos.x, morph);
      const targetY =
        THREE.MathUtils.lerp(treePos.y, scatterPos.y, morph) + Math.sin(t * 1.2 + index) * (0.02 + morph * 0.14);
      const targetZ = THREE.MathUtils.lerp(treePos.z, scatterPos.z, morph);

      const lambda = 5.5;
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, lambda, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, lambda, delta);
      groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, lambda, delta);

      const swayQuat = _treeWorldQuat.setFromEuler(new THREE.Euler(swayX, 0, swayZ));
      const desiredQuat = _targetLocalQuat.copy(treeQuat).multiply(swayQuat);
      groupRef.current.quaternion.slerp(desiredQuat, 1 - Math.exp(-lambda * delta));

      const hoverScale = hovered ? 1.09 : 1.0;
      const nextScale = THREE.MathUtils.damp(groupRef.current.scale.x, hoverScale, 8, delta);
      groupRef.current.scale.setScalar(nextScale);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(isSelected ? null : item.id);
  };

  return (
    <group
      ref={groupRef}
      position={[treePos.x, treePos.y, treePos.z]}
      quaternion={treeQuat}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* 1. Cardstock Backing Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[cardW, cardH, 0.014]} />
        <meshStandardMaterial
          color="#dcd7cc"
          roughness={0.92}
          metalness={0.0}
          envMapIntensity={0.12}
          emissive={isGrabbed ? '#d4af37' : hovered && !isSelected ? '#d4af37' : '#000000'}
          emissiveIntensity={isGrabbed ? 0.08 : hovered && !isSelected ? 0.12 : 0}
        />
      </mesh>

      {/* 2. Front Polaroid Photo & Caption Face (glare-free, calibrated exposure when zoomed) */}
      <mesh position={[0, 0, 0.008]}>
        <planeGeometry args={[cardW * 0.985, cardH * 0.985]} />
        {isSelected || isGrabbed ? (
          <meshBasicMaterial map={texture} color="#b8b4ac" toneMapped />
        ) : (
          <meshStandardMaterial
            map={texture}
            color="#d8d4cc"
            roughness={0.94}
            metalness={0.0}
            envMapIntensity={0.08}
          />
        )}
      </mesh>

      {/* 3. Wooden Clothespin Clip Assembly */}
      <group position={[0, cardH / 2 + 0.032, 0.004]}>
        <mesh position={[0, 0.015, 0.015]} castShadow>
          <boxGeometry args={[0.056, 0.14, 0.02]} />
          <meshStandardMaterial color="#b88450" roughness={0.74} metalness={0.04} />
        </mesh>
        <mesh position={[0, 0.015, -0.015]} castShadow>
          <boxGeometry args={[0.056, 0.14, 0.02]} />
          <meshStandardMaterial color="#9c6a3b" roughness={0.78} metalness={0.04} />
        </mesh>
        <mesh position={[0, 0.025, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.014, 0.014, 0.062, 12]} />
          <meshStandardMaterial color="#e0be68" metalness={0.92} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.095, 0]}>
          <torusGeometry args={[0.022, 0.004, 8, 20]} />
          <meshStandardMaterial color="#e8cb7a" metalness={0.95} roughness={0.18} />
        </mesh>
      </group>
    </group>
  );
}

export function PolaroidOrnaments({
  items,
  selectedId,
  grabbedId,
  grabOffsetRef,
  onSelect,
  morphProgressRef,
  treeGroupRef,
  frontmostIdRef,
}: PolaroidOrnamentsProps) {
  const scoreMapRef = useRef<Record<string, number>>({});

  useFrame(() => {
    let bestId: string | null = null;
    let bestScore = -Infinity;
    for (const item of items) {
      const s = scoreMapRef.current[item.id] ?? -Infinity;
      if (s > bestScore) {
        bestScore = s;
        bestId = item.id;
      }
    }
    frontmostIdRef.current = bestId;
  });

  return (
    <group>
      {items.map((item, idx) => (
        <SinglePolaroid
          key={item.id}
          item={item}
          index={idx}
          isSelected={selectedId === item.id}
          isGrabbed={grabbedId === item.id}
          grabOffsetRef={grabOffsetRef}
          onSelect={onSelect}
          morphProgressRef={morphProgressRef}
          treeGroupRef={treeGroupRef}
          scoreMapRef={scoreMapRef}
        />
      ))}
    </group>
  );
}
