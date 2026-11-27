import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { GiftRecipient, HandGestureState, PolaroidItem, TreeMode } from '../../types';
import { createFloorGlowTexture } from '../../utils/proceduralTextures';
import { detectSoftwareGl } from '../../utils/webgl';
import { GiftBoxes } from './GiftBoxes';
import { MetallicOrnaments } from './MetallicOrnaments';
import { ParticleTree } from './ParticleTree';
import { PolaroidOrnaments } from './PolaroidOrnaments';
import { SantaSleigh } from './SantaSleigh';
import { Snowfall } from './Snowfall';
import { TopStar } from './TopStar';

interface ChristmasSceneProps {
  treeMode: TreeMode;
  polaroids: PolaroidItem[];
  selectedPolaroidId: string | null;
  grabbedPolaroidId: string | null;
  grabOffsetRef: React.MutableRefObject<{ x: number; y: number }>;
  onSelectPolaroid: (id: string | null) => void;
  onOpenGift: (recipient: GiftRecipient) => void;
  activeOpeningGift: GiftRecipient | null;
  gestureState: HandGestureState;
  frontmostPolaroidIdRef: React.MutableRefObject<string | null>;
  snowIntensity: number;
  snowSpeed: number;
  santaActive: boolean;
  resetViewTrigger: number;
}

const DEFAULT_CAM_POS = new THREE.Vector3(0, 3.6, 10.4);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 3.25, 0);

/** Sets up RoomEnvironment PMREM reflection map & tone mapping */
function StudioEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.08;

    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    return () => {
      scene.environment = null;
      envTex.dispose();
    };
  }, [gl, scene]);

  return null;
}

/** Ultra-deep midnight-blue gradient sky dome matching reference image + subtle starfield */
function NightSkyBackdrop() {
  const skyDomeArgs = useMemo(
    () => ({
      uniforms: {
        uColorAbyss: { value: new THREE.Color('#010308') },
        uColorDeepSpace: { value: new THREE.Color('#020712') },
        uColorHorizonBlue: { value: new THREE.Color('#040e20') },
        uColorSapphireGlow: { value: new THREE.Color('#071733') },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uColorAbyss;
        uniform vec3 uColorDeepSpace;
        uniform vec3 uColorHorizonBlue;
        uniform vec3 uColorSapphireGlow;
        varying vec3 vWorldPos;

        void main() {
          vec3 rayDir = normalize(vWorldPos - cameraPosition);
          vec3 toTree = normalize(vec3(0.0, 3.6, 0.0) - cameraPosition);

          // Ultra-deep midnight navy gradient: near-black abyss at top/bottom, dark blue around tree horizon
          float midBand = exp(-pow((rayDir.y - 0.04) * 2.4, 2.0));
          vec3 sky = mix(uColorAbyss, uColorDeepSpace, smoothstep(-0.55, 0.0, rayDir.y) * smoothstep(0.72, 0.0, rayDir.y));
          sky = mix(sky, uColorHorizonBlue, midBand * 0.65);

          // Restrained deep-blue radial glow behind the Christmas tree
          float centerAlign = max(0.0, dot(rayDir, toTree));
          float outerAura = pow(centerAlign, 4.8);
          sky = mix(sky, uColorSapphireGlow, outerAura * 0.72);

          // Deepen top & bottom perimeter into near-black midnight navy
          float edgeDarken = smoothstep(0.24, 0.78, abs(rayDir.y));
          sky = mix(sky, uColorAbyss, edgeDarken * 0.78);

          // Micro dither to eliminate 8-bit gradient banding
          float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
          gl_FragColor = vec4(sky + dither, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    }),
    []
  );

  const starGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 380;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 24 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(0.15 + Math.random() * 0.85);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.max(0.5, r * Math.cos(phi));
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  useEffect(() => {
    return () => starGeo.dispose();
  }, [starGeo]);

  return (
    <group>
      <mesh renderOrder={-10}>
        <sphereGeometry args={[58, 48, 32]} />
        <shaderMaterial args={[skyDomeArgs]} />
      </mesh>
      <points geometry={starGeo}>
        <pointsMaterial color="#c6dbff" size={0.1} transparent opacity={0.46} sizeAttenuation />
      </points>
    </group>
  );
}

interface SceneRigProps extends ChristmasSceneProps {
  isSoftwareGl: boolean;
}

function SceneRig({
  treeMode,
  polaroids,
  selectedPolaroidId,
  grabbedPolaroidId,
  grabOffsetRef,
  onSelectPolaroid,
  onOpenGift,
  activeOpeningGift,
  gestureState,
  frontmostPolaroidIdRef,
  snowIntensity,
  snowSpeed,
  santaActive,
  resetViewTrigger,
  isSoftwareGl,
}: SceneRigProps) {
  const treeGroupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const morphProgressRef = useRef(0);
  const handSpinRef = useRef(0);
  const isResettingCamRef = useRef(false);
  const lastResetTriggerRef = useRef(0);
  const { camera } = useThree();

  const floorGlowTex = useMemo(() => createFloorGlowTexture(1024), []);
  useEffect(() => {
    return () => floorGlowTex.dispose();
  }, [floorGlowTex]);

  useEffect(() => {
    if (resetViewTrigger > 0 && resetViewTrigger !== lastResetTriggerRef.current) {
      lastResetTriggerRef.current = resetViewTrigger;
      isResettingCamRef.current = true;
    }
  }, [resetViewTrigger]);

  useFrame((_, delta) => {
    const targetMorph = treeMode === 'scatter' ? 1 : 0;
    morphProgressRef.current = THREE.MathUtils.damp(morphProgressRef.current, targetMorph, 3.2, delta);

    // Smooth panoramic camera reset when closed-fist gesture triggers
    if (isResettingCamRef.current && controlsRef.current) {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, DEFAULT_CAM_POS.x, 4.5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, DEFAULT_CAM_POS.y, 4.5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, DEFAULT_CAM_POS.z, 4.5, delta);
      controlsRef.current.target.lerp(DEFAULT_CAM_TARGET, 1 - Math.exp(-4.5 * delta));
      controlsRef.current.update();

      if (camera.position.distanceTo(DEFAULT_CAM_POS) < 0.04) {
        isResettingCamRef.current = false;
      }
    }

    if (treeGroupRef.current) {
      treeGroupRef.current.rotation.x = THREE.MathUtils.damp(treeGroupRef.current.rotation.x, 0, 4.5, delta);
      treeGroupRef.current.rotation.z = THREE.MathUtils.damp(treeGroupRef.current.rotation.z, 0, 4.5, delta);

      // Gesture 1: Finger moving left/right slowly rotates the Christmas tree
      if (gestureState.isEnabled && gestureState.handDetected && !grabbedPolaroidId && !selectedPolaroidId) {
        const fingerVel = gestureState.horizontalMotion;
        const steadyOffsetSpin = Math.abs(gestureState.handOffset.x) > 0.24 ? gestureState.handOffset.x * 0.42 : 0;
        handSpinRef.current += (fingerVel * 0.45 + steadyOffsetSpin) * delta;
      } else if (!selectedPolaroidId && !grabbedPolaroidId && !activeOpeningGift) {
        // Gentle idle ambient rotation
        handSpinRef.current += delta * 0.09;
      }

      treeGroupRef.current.rotation.y = THREE.MathUtils.damp(
        treeGroupRef.current.rotation.y,
        handSpinRef.current,
        4.5,
        delta
      );
    }
  });

  return (
    <>
      <color attach="background" args={['#010308']} />
      <fogExp2 attach="fog" args={['#020814', 0.018]} />

      <StudioEnvironment />
      <NightSkyBackdrop />

      {/* Warm Key Light + Cool Night Sky Hemisphere Fill + Rim Backlight */}
      <hemisphereLight args={['#1a335e', '#050b16', 0.78]} />
      <directionalLight
        position={[5.5, 9.5, 6.5]}
        intensity={1.75}
        color="#ffe6bd"
        castShadow={!isSoftwareGl}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={8}
        shadow-camera-bottom={-2}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-6, 6, -5]} intensity={0.95} color="#4f75b8" />
      <pointLight position={[0, 1.4, 2.5]} intensity={1.1} color="#f5c97b" distance={7} decay={2} />

      {/* Transparent Shadow-Only Ground Receiver + Subtle Golden Tree Base Halo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <circleGeometry args={[9, 48]} />
        <shadowMaterial transparent opacity={0.48} color="#010308" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <planeGeometry args={[9.4, 9.4]} />
        <meshBasicMaterial map={floorGlowTex} transparent depthWrite={false} opacity={0.58} />
      </mesh>

      {/* Main Interactive Christmas Tree Group */}
      <group ref={treeGroupRef}>
        <ParticleTree morphProgressRef={morphProgressRef} />
        <TopStar morphProgressRef={morphProgressRef} />
        <MetallicOrnaments morphProgressRef={morphProgressRef} />
        <PolaroidOrnaments
          items={polaroids}
          selectedId={selectedPolaroidId}
          grabbedId={grabbedPolaroidId}
          grabOffsetRef={grabOffsetRef}
          onSelect={onSelectPolaroid}
          morphProgressRef={morphProgressRef}
          treeGroupRef={treeGroupRef}
          frontmostIdRef={frontmostPolaroidIdRef}
        />
      </group>

      {/* Tree Base Gifts */}
      <GiftBoxes
        onOpenGift={onOpenGift}
        activeOpeningGift={activeOpeningGift}
        morphProgressRef={morphProgressRef}
      />

      {/* Snowfall Effect (Right-hand palm-down flutter frequency drives speed) */}
      <Snowfall intensity={snowIntensity} speed={snowSpeed} />

      {/* Santa Claus & 4 Reindeer Sleigh Arc Flight (Continuous right-hand thumbs-up) */}
      <SantaSleigh active={santaActive} />

      {/* Camera OrbitControls */}
      <OrbitControls
        ref={controlsRef}
        target={[0, 3.25, 0]}
        enableDamping={!isSoftwareGl}
        dampingFactor={0.055}
        enablePan={false}
        minDistance={4.2}
        maxDistance={15.5}
        minPolarAngle={Math.PI * 0.14}
        maxPolarAngle={Math.PI * 0.49}
        onStart={() => {
          isResettingCamRef.current = false;
        }}
      />

      {/* Post-Processing Bloom */}
      {!isSoftwareGl && (
        <EffectComposer multisampling={0}>
          <Bloom
            mipmapBlur
            luminanceThreshold={0.96}
            luminanceSmoothing={0.22}
            intensity={1.15}
            radius={0.7}
          />
        </EffectComposer>
      )}
    </>
  );
}

export function ChristmasScene(props: ChristmasSceneProps) {
  const isSoftwareGl = useMemo(() => detectSoftwareGl(), []);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[radial-gradient(circle_at_50%_52%,#071733_0%,#020712_48%,#010308_100%)]">
      <Canvas
        shadows={!isSoftwareGl}
        dpr={isSoftwareGl ? 1 : [1, 2]}
        camera={{ position: [0, 3.6, 10.4], fov: 44, near: 0.1, far: 90 }}
        gl={{
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
        }}
        onPointerMissed={() => {
          if (props.selectedPolaroidId) {
            props.onSelectPolaroid(null);
          }
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
          });
        }}
      >
        <SceneRig {...props} isSoftwareGl={isSoftwareGl} />
      </Canvas>
    </div>
  );
}
