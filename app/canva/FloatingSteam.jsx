import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Custom shader material for soft, wispy procedural smoke
const ProceduralSmokeMaterial = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv; // <-- This link was missing!
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    float noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
    }

    void main() {
      float dist = length(vUv - vec2(0.5));
      // Extremely soft smoothstep values to completely erase any sharp circle edges
      float circleMask = smoothstep(0.5, 0.1, dist);
      
      if (circleMask <= 0.0) discard;

      // Create a shifting, evolving noise pattern
      vec2 noiseUV = vUv * 2.0 + vec2(uTime * 0.15, -uTime * 0.3);
      float n = noise(noiseUV) * 0.6 + noise(noiseUV * 2.5) * 0.4;
      
      float smokePattern = circleMask * n;
      
      // Soft, semi-transparent white steam color
      vec3 steamColor = vec3(0.9, 0.93, 0.96);
      
      gl_FragColor = vec4(steamColor, smokePattern * 0.08);
    }
  `,
};

export function FloatingSteam({
  count = 40,
  spawnArea = [12, 2, 12],
  position = [0, 0, 0],
}) {
  const meshRef = useRef();
  const materialRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Set up particle data
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * spawnArea[0],
        y: Math.random() * spawnArea[1], // Start scattered upward
        z: (Math.random() - 0.5) * spawnArea[2],
        speedY: 0.8 + Math.random() * 1.2, // Upward velocity
        speedX: (Math.random() - 0.5) * 0.4, // Sway speed
        swayOffset: Math.random() * 100,
        maxScale: 6 + Math.random() * 6, // Make particles much LARGER to look like fog banks
        life: Math.random(),
        rate: 0.12 + Math.random() * 0.15,
      });
    }
    return arr;
  }, [count, spawnArea]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Keep the procedural noise inside the shader moving
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }

    particles.forEach((p, i) => {
      p.life += p.rate * delta;

      if (p.life > 1) {
        p.life = 0;
        p.x = (Math.random() - 0.5) * spawnArea[0];
        p.y = 0; // Reset to surface level
        p.z = (Math.random() - 0.5) * spawnArea[2];
      }

      // Physics: Float up, sway left and right like true gas
      p.y += p.speedY * delta * 3.0;
      p.x +=
        Math.sin(state.clock.getElapsedTime() * 1.5 + p.swayOffset) *
        p.speedX *
        delta;

      // Behavior: Fade in smoothly from spawn, expand wide, fade out completely at the top
      // This eliminates the popping look!
      const sizeProgress = Math.sin(p.life * Math.PI);
      const currentScale = p.maxScale * (0.4 + sizeProgress * 0.6);

      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(currentScale);
      dummy.quaternion.copy(state.camera.quaternion); // Billboarding

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} position={position}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={ProceduralSmokeMaterial.vertexShader}
        fragmentShader={ProceduralSmokeMaterial.fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}
