import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { createGlowSpriteTexture } from '../../utils/proceduralTextures';

interface SnowfallProps {
  /** Continuous density in [0, 1]. 0 = no snow, 0.2 = sparse, 1.0 = dense snowfall */
  intensity: number;
  /** Continuous falling speed multiplier driven by finger flutter frequency */
  speed?: number;
}

const SNOW_COUNT = 2400;

export function Snowfall({ intensity, speed = 1 }: SnowfallProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const intensityRef = useRef(0);
  const speedRef = useRef(1);
  const fallTimeRef = useRef(0);

  const snowTexture = useMemo(() => createGlowSpriteTexture(64), []);

  const snowGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(SNOW_COUNT * 3);
    const sizes = new Float32Array(SNOW_COUNT);
    const speeds = new Float32Array(SNOW_COUNT);
    const phases = new Float32Array(SNOW_COUNT);
    const ranks = new Float32Array(SNOW_COUNT);

    for (let i = 0; i < SNOW_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 24;
      positions[i3 + 1] = Math.random() * 13.5;
      positions[i3 + 2] = (Math.random() - 0.5) * 19;
      sizes[i] = 6 + Math.random() * 15;
      speeds[i] = 0.75 + Math.random() * 1.25;
      phases[i] = Math.random() * Math.PI * 2;
      ranks[i] = (i + Math.random() * 0.5) / SNOW_COUNT;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aRank', new THREE.BufferAttribute(ranks, 1));
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      snowTexture.dispose();
      snowGeo.dispose();
    };
  }, [snowTexture, snowGeo]);

  useFrame((state, delta) => {
    const targetIntensity = THREE.MathUtils.clamp(intensity, 0, 1);
    const dampSpeed = targetIntensity > intensityRef.current ? 4.5 : 2.6;
    intensityRef.current = THREE.MathUtils.damp(intensityRef.current, targetIntensity, dampSpeed, delta);

    const targetSpeed = THREE.MathUtils.clamp(speed, 0.35, 3.6);
    speedRef.current = THREE.MathUtils.damp(speedRef.current, targetSpeed, 5.0, delta);
    fallTimeRef.current += delta * speedRef.current;

    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uFallTime.value = fallTimeRef.current;
      matRef.current.uniforms.uIntensity.value = intensityRef.current;
    }
  });

  const shaderArgs = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uFallTime: { value: 0 },
        uIntensity: { value: 0 },
        uSprite: { value: snowTexture },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aSpeed;
        attribute float aPhase;
        attribute float aRank;

        uniform float uTime;
        uniform float uFallTime;
        uniform float uIntensity;
        varying float vAlpha;

        void main() {
          float activeMask = smoothstep(aRank, aRank + 0.08, uIntensity);

          vec3 pos = position;
          pos.y = mod(pos.y - uFallTime * aSpeed, 13.5);
          pos.x += sin(uTime * 0.9 + aPhase) * (0.4 + uIntensity * 0.35);
          pos.z += cos(uTime * 0.7 + aPhase * 1.3) * 0.35;

          float heightFade = smoothstep(0.0, 1.2, pos.y) * smoothstep(13.5, 11.0, pos.y);
          vAlpha = activeMask * heightFade * (0.52 + 0.42 * sin(uTime * 1.6 + aPhase));

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = clamp(aSize * (10.0 / max(1.0, -mvPosition.z)) * step(0.005, activeMask), 0.0, 26.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uSprite;
        uniform float uIntensity;
        varying float vAlpha;

        void main() {
          if (uIntensity < 0.01 || vAlpha < 0.01) discard;
          vec4 tex = texture2D(uSprite, gl_PointCoord);
          float alpha = tex.a * vAlpha * min(1.0, uIntensity * 2.2);
          if (alpha < 0.015) discard;
          gl_FragColor = vec4(vec3(0.93, 0.97, 1.0) * tex.rgb, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    [snowTexture]
  );

  return (
    <points geometry={snowGeo} frustumCulled={false}>
      <shaderMaterial ref={matRef} args={[shaderArgs]} />
    </points>
  );
}
