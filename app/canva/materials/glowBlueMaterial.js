import * as THREE from "three";

export function createGlowBlueMaterial({
  color = "#00aaff",
  baseIntensity = 0.98,
  glowIntensity = 2.8,
  opacity = 1.0,
  rimPower = 1.45,
  pulseSpeed = 2.0,
} = {}) {
  const material = new THREE.ShaderMaterial({
    name: "GlowBlueMaterial",
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uBaseIntensity: { value: baseIntensity },
      uGlowIntensity: { value: glowIntensity },
      uOpacity: { value: opacity },
      uRimPower: { value: rimPower },
      uPulseSpeed: { value: pulseSpeed },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;

        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uBaseIntensity;
      uniform float uGlowIntensity;
      uniform float uOpacity;
      uniform float uRimPower;
      uniform float uPulseSpeed;
      uniform float uTime;

      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 viewDirection = normalize(vViewPosition);
        float rim = 1.0 - abs(dot(normalize(vNormal), viewDirection));
        float glow = pow(rim, uRimPower);
        float pulse = 1.0 + sin(uTime * uPulseSpeed) * 0.12;

        vec3 baseColor = uColor * uBaseIntensity;
        vec3 glowColor = uColor * glow * uGlowIntensity * pulse;
        vec3 color = baseColor + glowColor;
        float alpha = uOpacity;

        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  material.customProgramCacheKey = () => "procedural-glow-blue-material";

  return material;
}

export function createGlowBlueOuterMaterial({
  color = "#0082fc",
  glowIntensity = 5.8,
  opacity = 0.55,
  rimPower = 1.25,
  expansion = 0.045,
  pulseSpeed = 2.0,
} = {}) {
  const material = new THREE.ShaderMaterial({
    name: "GlowBlueOuterMaterial",
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uGlowIntensity: { value: glowIntensity },
      uOpacity: { value: opacity },
      uRimPower: { value: rimPower },
      uExpansion: { value: expansion },
      uPulseSpeed: { value: pulseSpeed },
      uTime: { value: 0 },
    },
    vertexShader: `
      uniform float uExpansion;

      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 expandedPosition = position + normal * uExpansion;
        vec4 mvPosition = modelViewMatrix * vec4(expandedPosition, 1.0);

        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;

        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uGlowIntensity;
      uniform float uOpacity;
      uniform float uRimPower;
      uniform float uPulseSpeed;
      uniform float uTime;

      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 viewDirection = normalize(vViewPosition);
        float rim = 1.0 - abs(dot(normalize(vNormal), viewDirection));
        float glow = pow(rim, uRimPower);
        float pulse = 1.0 + sin(uTime * uPulseSpeed) * 0.12;

        vec3 color = uColor * glow * uGlowIntensity * pulse;
        float alpha = glow * uOpacity;

        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  material.customProgramCacheKey = () => "procedural-glow-blue-outer-material";

  return material;
}
