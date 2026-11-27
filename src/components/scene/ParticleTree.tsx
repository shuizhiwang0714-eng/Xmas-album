import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { createGlowSpriteTexture } from '../../utils/proceduralTextures';

interface ParticleTreeProps {
  morphProgressRef: React.MutableRefObject<number>;
}

const PARTICLE_COUNT = 7800;
const STARDUST_COUNT = 650;
const BULB_COUNT = 136;

// Tree geometry constants shared with ornaments & polaroids
export const TREE_BASE_Y = 0.55;
export const TREE_HEIGHT = 6.9;
export const TREE_BASE_RADIUS = 2.65;

export function getTreeRadiusAtFraction(t: number): number {
  // t in [0, 1] from bottom to top; 7 subtle tiered boughs
  const baseCone = TREE_BASE_RADIUS * Math.pow(1 - t, 0.88);
  const tierMod = 1 + 0.12 * Math.sin(t * Math.PI * 7.0);
  return Math.max(0.08, baseCone * tierMod);
}

const _dummy = new THREE.Object3D();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export function ParticleTree({ morphProgressRef }: ParticleTreeProps) {
  const treeMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const stardustMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const spiralTubeRef = useRef<THREE.Mesh>(null);
  const spiralTubeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const bulbsRef = useRef<THREE.InstancedMesh>(null);

  const glowTexture = useMemo(() => createGlowSpriteTexture(128), []);

  // Build main particle tree buffer geometry (emerald foliage tiers + champagne/warm gold spirals + bokeh)
  const treeGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const treePositions = new Float32Array(PARTICLE_COUNT * 3);
    const scatterPositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    const layers = new Float32Array(PARTICLE_COUNT); // 0 = foliage, 1 = gold spiral, 2 = fairy bokeh

    const cEmeraldDeep = new THREE.Color('#064e3b');
    const cEmeraldMid = new THREE.Color('#0b7a57');
    const cEmeraldBright = new THREE.Color('#19b882');
    const cChampagne = new THREE.Color('#fce8b2');
    const cWarmGold = new THREE.Color('#f4b942');
    const cAmber = new THREE.Color('#e68a2e');
    const tmpColor = new THREE.Color();

    // Deterministic pseudo-random helper for repeatable luxury arrangement
    let seed = 4219;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const role = i / PARTICLE_COUNT;

      let tx = 0;
      let ty = 0;
      let tz = 0;

      if (role < 0.62) {
        // Tiered Emerald / Jade Foliage
        const tierIndex = Math.floor(rand() * 7);
        const tierStart = tierIndex / 7;
        const tierLocal = Math.pow(rand(), 0.72);
        const t = Math.min(0.995, tierStart * 0.92 + tierLocal * 0.16);
        const y = TREE_BASE_Y + t * TREE_HEIGHT;

        const maxR = TREE_BASE_RADIUS * (1 - t * 0.94) * (0.78 + 0.36 * (1 - tierLocal));
        const angle = rand() * Math.PI * 2;
        // Branch bough scalloping
        const branchLobe = 0.86 + 0.16 * Math.cos(angle * (7 - Math.floor(t * 3)) + tierIndex * 1.1);
        const radialFill = Math.pow(rand(), 0.45);
        const r = maxR * branchLobe * radialFill;

        tx = Math.cos(angle) * r;
        ty = y + (rand() - 0.5) * 0.12;
        tz = Math.sin(angle) * r;

        // Emerald & jade gradient with occasional gold-tipped pine needles
        if (radialFill > 0.92 && rand() > 0.6) {
          tmpColor.copy(cChampagne).lerp(cWarmGold, rand());
          sizes[i] = 10 + rand() * 8;
        } else {
          tmpColor.copy(cEmeraldDeep).lerp(cEmeraldMid, radialFill * 0.75 + rand() * 0.25);
          if (radialFill > 0.78) {
            tmpColor.lerp(cEmeraldBright, (radialFill - 0.78) * 2.5);
          }
          sizes[i] = 9 + rand() * 10;
        }
        layers[i] = 0.0;
      } else if (role < 0.89) {
        // Flowing Golden Spiral Ribbons (2 intertwined ascending helices)
        const helixId = i % 2;
        const t = Math.pow(rand(), 0.85);
        const y = TREE_BASE_Y + t * TREE_HEIGHT;
        const turns = 6.2;
        const baseTheta = t * Math.PI * 2 * turns + helixId * Math.PI;
        const spread = (rand() - 0.5) * 0.28;
        const r = getTreeRadiusAtFraction(t) * (1.01 + (rand() - 0.5) * 0.09);

        tx = Math.cos(baseTheta + spread) * r;
        ty = y + (rand() - 0.5) * 0.11;
        tz = Math.sin(baseTheta + spread) * r;

        const goldMix = rand();
        tmpColor.copy(cWarmGold).lerp(cChampagne, goldMix * 0.75);
        if (rand() > 0.75) tmpColor.lerp(cAmber, 0.35);

        sizes[i] = 11 + rand() * 14;
        layers[i] = 1.0 + t; // Encode height along spiral for upward flow shader
      } else {
        // Larger Warm Golden Bokeh / Fairy Dust Aura around silhouette
        const t = rand();
        const y = TREE_BASE_Y + t * (TREE_HEIGHT + 0.35);
        const angle = rand() * Math.PI * 2;
        const r = getTreeRadiusAtFraction(Math.min(1, t)) * (0.95 + rand() * 0.42);

        tx = Math.cos(angle) * r;
        ty = y;
        tz = Math.sin(angle) * r;

        tmpColor.copy(cChampagne).lerp(cWarmGold, rand());
        sizes[i] = 18 + rand() * 24;
        layers[i] = 3.0;
      }

      positions[i3] = tx;
      positions[i3 + 1] = ty;
      positions[i3 + 2] = tz;

      treePositions[i3] = tx;
      treePositions[i3 + 1] = ty;
      treePositions[i3 + 2] = tz;

      // Scattered galaxy cloud positions (spherical vortex around center)
      const sTheta = rand() * Math.PI * 2;
      const sPhi = Math.acos(2 * rand() - 1);
      const sRad = 3.4 + Math.pow(rand(), 0.65) * 6.4;
      scatterPositions[i3] = Math.sin(sPhi) * Math.cos(sTheta) * sRad;
      scatterPositions[i3 + 1] = 3.8 + Math.cos(sPhi) * sRad * 0.72;
      scatterPositions[i3 + 2] = Math.sin(sPhi) * Math.sin(sTheta) * sRad;

      colors[i3] = tmpColor.r;
      colors[i3 + 1] = tmpColor.g;
      colors[i3 + 2] = tmpColor.b;
      phases[i] = rand() * Math.PI * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aTreePos', new THREE.BufferAttribute(treePositions, 3));
    geo.setAttribute('aScatterPos', new THREE.BufferAttribute(scatterPositions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));

    return geo;
  }, []);

  // Build ambient stardust particles in the night sky
  const stardustGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(STARDUST_COUNT * 3);
    const sizes = new Float32Array(STARDUST_COUNT);
    const phases = new Float32Array(STARDUST_COUNT);

    for (let i = 0; i < STARDUST_COUNT; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.5 + Math.random() * 14;
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = 0.2 + Math.random() * 11.5;
      positions[i3 + 2] = Math.sin(angle) * radius;
      sizes[i] = 8 + Math.random() * 18;
      phases[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    return geo;
  }, []);

  // Build continuous Golden Spiral Light Strip curve + bulb points
  const { spiralTubeGeo, bulbCurvePoints } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const totalSamples = 220;
    const turns = 6.2;

    for (let i = 0; i <= totalSamples; i++) {
      const t = i / totalSamples;
      const y = TREE_BASE_Y + 0.1 + t * (TREE_HEIGHT - 0.15);
      const r = getTreeRadiusAtFraction(t) * 1.03;
      const theta = t * Math.PI * 2 * turns;
      pts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
    }

    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 260, 0.022, 8, false);

    const bulbData: Array<{ treePos: THREE.Vector3; scatterPos: THREE.Vector3; phase: number }> = [];
    for (let i = 0; i < BULB_COUNT; i++) {
      const t = i / (BULB_COUNT - 1);
      const p = curve.getPointAt(t);
      const sAngle = t * 19.0 + i * 0.7;
      const sRad = 3.8 + (i % 5) * 0.9;
      bulbData.push({
        treePos: p.clone(),
        scatterPos: new THREE.Vector3(
          Math.cos(sAngle) * sRad,
          1.4 + t * 5.6 + Math.sin(i) * 0.7,
          Math.sin(sAngle) * sRad
        ),
        phase: i * 0.45,
      });
    }

    return { spiralTubeGeo: tubeGeo, bulbCurvePoints: bulbData };
  }, []);

  // Cleanup GPU resources
  useEffect(() => {
    return () => {
      glowTexture.dispose();
      treeGeometry.dispose();
      stardustGeometry.dispose();
      spiralTubeGeo.dispose();
    };
  }, [glowTexture, treeGeometry, stardustGeometry, spiralTubeGeo]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const morph = morphProgressRef.current;

    if (treeMaterialRef.current) {
      treeMaterialRef.current.uniforms.uTime.value = t;
      treeMaterialRef.current.uniforms.uMorph.value = morph;
    }

    if (stardustMaterialRef.current) {
      stardustMaterialRef.current.uniforms.uTime.value = t;
    }

    // Smoothly fade and expand spiral ribbon when scattering
    if (spiralTubeRef.current && spiralTubeMatRef.current) {
      const s = 1 + morph * 1.15;
      spiralTubeRef.current.scale.set(s, 1 + morph * 0.25, s);
      spiralTubeRef.current.rotation.y += delta * (0.04 + morph * 0.25);
      spiralTubeMatRef.current.opacity = Math.max(0, 0.82 * (1 - morph * 1.15));
      spiralTubeMatRef.current.emissiveIntensity = 1.85 + Math.sin(t * 2.2) * 0.25;
      spiralTubeRef.current.visible = morph < 0.88;
    }

    // Update spiral LED light bulbs along morph
    if (bulbsRef.current) {
      for (let i = 0; i < BULB_COUNT; i++) {
        const b = bulbCurvePoints[i];
        _v1.copy(b.treePos);
        _v2.copy(b.scatterPos);
        _v1.lerp(_v2, morph);

        // Slight floating drift in scatter mode
        if (morph > 0.01) {
          _v1.y += Math.sin(t * 1.3 + b.phase) * 0.14 * morph;
        }

        const pulse = 0.82 + 0.26 * Math.sin(t * 3.1 + b.phase);
        const scale = 0.042 * pulse;
        _dummy.position.copy(_v1);
        _dummy.scale.setScalar(scale);
        _dummy.updateMatrix();
        bulbsRef.current.setMatrixAt(i, _dummy.matrix);
      }
      bulbsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const treeShaderArgs = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 0 },
        uSprite: { value: glowTexture },
      },
      vertexShader: `
        attribute vec3 aTreePos;
        attribute vec3 aScatterPos;
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;
        attribute float aLayer;

        uniform float uTime;
        uniform float uMorph;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Swirl offset during morph transition
          float swirl = sin(uMorph * 3.14159) * 1.45;
          vec3 pos = mix(aTreePos, aScatterPos, uMorph);

          float angle = swirl * (0.6 + aLayer * 0.2);
          float s = sin(angle);
          float c = cos(angle);
          pos.xz = mat2(c, -s, s, c) * pos.xz;

          // Subtle breathing & floating drift
          float floatAmp = mix(0.025, 0.22, uMorph);
          pos.y += sin(uTime * 1.4 + aPhase) * floatAmp;
          pos.x += cos(uTime * 0.9 + aPhase * 1.3) * floatAmp * 0.5;

          // Spiral upward flowing energy pulse
          float pulse = 1.0;
          if (aLayer >= 1.0 && aLayer < 2.5) {
            float h = aLayer - 1.0;
            float wave = sin(h * 18.0 - uTime * 3.4);
            pulse = 1.0 + 0.45 * smoothstep(0.2, 1.0, wave);
          } else {
            pulse = 0.85 + 0.3 * sin(uTime * 2.2 + aPhase);
          }

          vColor = aColor * (1.05 + 0.35 * (pulse - 1.0));
          vAlpha = aLayer >= 2.5 ? (0.48 + 0.32 * sin(uTime * 1.9 + aPhase)) : (0.85 + 0.15 * sin(uTime * 2.5 + aPhase));

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = clamp((aSize * pulse) * (12.0 / max(1.0, -mvPosition.z)), 1.5, 44.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uSprite;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec4 tex = texture2D(uSprite, gl_PointCoord);
          float alpha = tex.a * vAlpha;
          if (alpha < 0.02) discard;
          gl_FragColor = vec4(vColor * tex.rgb * 1.35, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    [glowTexture]
  );

  const stardustShaderArgs = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uSprite: { value: glowTexture },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          pos.y = mod(pos.y + uTime * 0.14 + aPhase, 11.5);
          float driftAngle = uTime * 0.05 + aPhase;
          pos.x += sin(driftAngle) * 0.25;
          pos.z += cos(driftAngle) * 0.25;

          vAlpha = 0.3 + 0.45 * sin(uTime * 1.6 + aPhase * 2.0);
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = clamp(aSize * (10.0 / max(1.0, -mvPosition.z)), 1.0, 26.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uSprite;
        varying float vAlpha;

        void main() {
          vec4 tex = texture2D(uSprite, gl_PointCoord);
          float alpha = tex.a * max(0.0, vAlpha);
          if (alpha < 0.02) discard;
          gl_FragColor = vec4(vec3(1.0, 0.88, 0.56) * tex.rgb, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    [glowTexture]
  );

  return (
    <group>
      {/* Main Emerald + Champagne Gold Particle Tree */}
      <points geometry={treeGeometry} frustumCulled={false}>
        <shaderMaterial ref={treeMaterialRef} args={[treeShaderArgs]} />
      </points>

      {/* Ambient Floating Gold Stardust */}
      <points geometry={stardustGeometry} frustumCulled={false}>
        <shaderMaterial ref={stardustMaterialRef} args={[stardustShaderArgs]} />
      </points>

      {/* Continuous Glowing Spiral Light Ribbon */}
      <mesh ref={spiralTubeRef} geometry={spiralTubeGeo}>
        <meshStandardMaterial
          ref={spiralTubeMatRef}
          color="#f7d682"
          emissive="#f6be4e"
          emissiveIntensity={1.9}
          roughness={0.22}
          metalness={0.85}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* Instanced Warm Fairy Bulbs along Spiral */}
      <instancedMesh ref={bulbsRef} args={[undefined, undefined, BULB_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial
          color="#fff4cf"
          emissive="#ffd678"
          emissiveIntensity={2.6}
          roughness={0.15}
          metalness={0.2}
        />
      </instancedMesh>
    </group>
  );
}
