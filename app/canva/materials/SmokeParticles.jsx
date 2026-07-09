import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 701;

const smokeParticleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uRiseHeight;
  uniform float uBaseSize;

  attribute float aSpeed;
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpin;

  varying float vLife;
  varying float vAlpha;
  varying float vNoise;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void main() {
    float life = fract(uTime * aSpeed + aPhase);
    float riseEase = smoothstep(0.0, 1.0, life);
    vec3 animatedPosition = position;

    float swirl = sin(uTime * aSpin + aPhase * 6.28318 + life * 5.0);
    float drift = cos(uTime * (aSpin * 0.7) + aPhase * 9.0 + life * 4.0);
    float spread = life * life * 24.0;

    animatedPosition.x += swirl * spread + sin(life * 6.28318 + aPhase) * 5.0;
    animatedPosition.z += drift * spread + cos(life * 6.28318 + aPhase) * 5.0;
    animatedPosition.y += riseEase * uRiseHeight;

    vec4 mvPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    vLife = life;
    vAlpha = smoothstep(0.0, 0.18, life) * (1.0 - smoothstep(0.62, 1.0, life));
    vNoise = random(position.xz + vec2(aPhase, life));
    gl_PointSize = uBaseSize * aSize * mix(0.55, 1.9, life) * (280.0 / -mvPosition.z);
  }
`;

const smokeParticleFragmentShader = /* glsl */ `
  varying float vLife;
  varying float vAlpha;
  varying float vNoise;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float circle = 1.0 - smoothstep(0.18, 0.5, length(uv));
    float softCore = 1.0 - smoothstep(0.0, 0.35, length(uv));
    float brokenEdge = smoothstep(0.18, 0.9, vNoise + circle * 0.45);
    float alpha = circle * brokenEdge * vAlpha * 0.34;

    vec3 baseBlue = vec3(0.0, 0.1, 0.42);
    vec3 cyanGlow = vec3(0.0, 0.7, 1.25);
    vec3 color = mix(cyanGlow, baseBlue, vLife * 0.85);
    color += vec3(0.05, 0.16, 0.34) * softCore * (1.0 - vLife);

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function SmokeParticles({
  position = [0, -95, 0],
  riseHeight = 115,
  baseSize = 1.9,
  mobileBaseSize = 1.9,
  isActive = true,
  ...props
}) {
  const materialRef = useRef();
  const { size } = useThree();
  const isMobileCanvas = size.width < 768;
  const renderedBaseSize = isMobileCanvas ? mobileBaseSize : baseSize;

  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    const spins = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = Math.sqrt(Math.random()) * 62;
      const angle = Math.random() * Math.PI * 2;
      const i3 = i * 3;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.random() * 3;
      positions[i3 + 2] = Math.sin(angle) * radius;

      speeds[i] = THREE.MathUtils.lerp(0.045, 0.11, Math.random());
      sizes[i] = THREE.MathUtils.lerp(0.35, 0.08, Math.random());
      phases[i] = Math.random();
      spins[i] = THREE.MathUtils.lerp(0.6, 1.8, Math.random());
    }

    const smokeGeometry = new THREE.BufferGeometry();
    smokeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    smokeGeometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    smokeGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    smokeGeometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    smokeGeometry.setAttribute("aSpin", new THREE.BufferAttribute(spins, 1));
    smokeGeometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, riseHeight * 0.5, 0),
      180,
    );

    return smokeGeometry;
  }, [riseHeight]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRiseHeight: { value: riseHeight },
      uBaseSize: { value: renderedBaseSize }, //maximum size of the particles
    }),
    [riseHeight, renderedBaseSize],
  );

  useEffect(() => {
    if (!materialRef.current) return;

    materialRef.current.uniforms.uRiseHeight.value = riseHeight;
    materialRef.current.uniforms.uBaseSize.value = renderedBaseSize;
  }, [riseHeight, renderedBaseSize]);

  useFrame(({ clock }) => {
    if (!isActive) return;

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points geometry={geometry} position={position} renderOrder={1} {...props}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={smokeParticleVertexShader}
        fragmentShader={smokeParticleFragmentShader}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        precision="highp"
        toneMapped={false}
      />
    </points>
  );
}
