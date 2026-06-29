import * as THREE from "three";

export function createHologramMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#c0c0c0") },
      uOpacity: { value: 0.25 },
      uScanlineDensity: { value: 60.0 },
      uVariationStrength: { value: 0.1 },
      uHover: { value: 0 },
      uGlitchStrength: { value: -0.6 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uHover;
      uniform float uGlitchStrength;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      float random(vec2 point) {
        return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);

        vec3 transformedPosition = position;
        float band = floor((uv.y + uTime * 0.55) * 18.0);
        float bandNoise = random(vec2(band, floor(uTime * 12.0)));
        float activeBand = step(0.72, bandNoise);
        float direction = random(vec2(band, 4.2)) * 2.0 - 1.0;
        float microWave = sin(uv.y * 95.0 + uTime * 18.0) * 0.012;

        transformedPosition.y +=
          (direction * activeBand * uGlitchStrength + microWave) * uHover;

        vec4 worldPosition = modelMatrix * vec4(transformedPosition, 1.0);
        vWorldPosition = worldPosition.xyz;

        vec4 mvPosition = modelViewMatrix * vec4(transformedPosition, 1.0);
        vViewPosition = -mvPosition.xyz;

        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uScanlineDensity;
      uniform float uVariationStrength;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      float random(vec2 point) {
        return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main() {
        vec3 viewDirection = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(dot(vNormal, viewDirection), 0.0), 2.0);

        float scanline = sin((vWorldPosition.y + uTime * 0.45) * uScanlineDensity) * 0.5 + 0.5;
        scanline = smoothstep(0.58, 1.0, scanline);

        float wave = sin((vUv.x * 18.0) + (uTime * 2.4)) * 0.5 + 0.5;
        float pulse = sin(uTime * 2.8) * 0.5 + 0.5;
        float noise = random(floor((vUv + uTime * 0.015) * vec2(26.0, 10.0)));

        float variation = mix(wave, noise, 0.28) * uVariationStrength;
        float alpha = uOpacity + fresnel * 0.34 + scanline * 0.16 + variation;
        alpha *= mix(0.60, 1.12, pulse);
        alpha = clamp(alpha, 0.0, 0.88);

        vec3 color = uColor;
        color += fresnel * vec3(0.890, 0.657, 0.0178);
        color += scanline * vec3(0.00560, 0.375, 0.560); 
        color += variation * vec3(0.890, 0.657, 0.0178);

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}
