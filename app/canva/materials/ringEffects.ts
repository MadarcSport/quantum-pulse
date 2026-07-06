export type RingEffectId =
  | "materialOnly"
  | "iridescentOilFilm"
  | "dissolveRebuild"
  | "chromaticRefractionFake";

export const RING_EFFECT_OPTIONS: ReadonlyArray<{
  id: RingEffectId;
  label: string;
}> = [
  { id: "materialOnly", label: "Materials" },
  { id: "iridescentOilFilm", label: "Electric Arc" },
  { id: "dissolveRebuild", label: "Dissolve + Rebuild" },
  { id: "chromaticRefractionFake", label: "Radar Sweep" },
] as const;

type TimeUniform = { value: number };

export type RingShader = {
  uniforms: Record<string, TimeUniform>;
  fragmentShader: string;
};

export type RingShaderTimeRef = {
  uniforms: {
    uTime: TimeUniform;
  };
};

const SHARED_GLSL = `
uniform float uTime;

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}
`;

const EFFECT_GLSL: Record<RingEffectId, string> = {
  materialOnly: ``,
  iridescentOilFilm: `
  float arcDensity = 7.5;
  float arcSpeed = 1.25;
  float glowIntensity = 1.15;

  vec3 arcPos = vViewPosition * 3.2 + vec3(0.0, uTime * arcSpeed, 0.0);
  float n = noise3(arcPos) * 0.8 + noise3(arcPos * 1.9 + 4.7) * 0.35;
  float wave = sin((vViewPosition.x + vViewPosition.y) * arcDensity - uTime * arcSpeed * 7.0) * 0.5 + 0.5;
  float flicker = sin(uTime * 35.0 + n * 18.0) * 0.5 + 0.5;
  float arcMask = smoothstep(0.68, 0.92, n + wave * 0.35);

  vec3 arcColor = mix(vec3(0.94, 0.86, 0.51), vec3(0.55, 0.95, 1.0), wave);
  float arcEnergy = arcMask * (0.6 + flicker * 0.9) * glowIntensity;

  gl_FragColor.rgb += arcColor * arcEnergy;
  gl_FragColor.rgb += arcColor * pow(arcMask, 8.0) * 1.8;
`,
  dissolveRebuild: `
  float noiseField = noise3(vViewPosition * 6.0 + vec3(0.0, uTime * 0.9, 0.0));
  float cycle = sin(uTime * 1.2) * 0.5 + 0.5;
  float threshold = mix(0.25, 0.85, cycle);
  float bodyMask = smoothstep(threshold - 0.08, threshold + 0.03, noiseField);
  float edgeMask = smoothstep(threshold - 0.015, threshold + 0.015, noiseField) -
                   smoothstep(threshold + 0.015, threshold + 0.06, noiseField);

  gl_FragColor.rgb *= bodyMask;
  gl_FragColor.rgb += vec3(1.0, 0.45, 0.1) * edgeMask * 2.0;
  gl_FragColor.a *= clamp(bodyMask + edgeMask * 1.5, 0.0, 1.0);
`,
  chromaticRefractionFake: `
  vec2 p = normalize(vViewPosition.xz + vec2(0.0001));
  float angle = atan(p.y, p.x);
  float sweep = fract(uTime * 0.5) * 6.28318530718;
  float d = abs(mod(angle - sweep + 3.14159265359, 6.28318530718) - 3.14159265359);

  float beam = 1.0 - smoothstep(0.0, 0.32, d);
  float rings = sin(length(vViewPosition.xz) * 26.0 - uTime * 27.5) * 0.5 + 0.5;
  float pulse = 0.55 + 0.45 * sin(uTime * 50.0 + length(vViewPosition) * 5.0);

  vec3 radarColor = mix(vec3(0.02, 0.45, 0.2), vec3(0.12, 1.0, 0.55), rings);
  float energy = beam * (0.55 + pulse * 0.9);

  gl_FragColor.rgb += radarColor * energy;
  gl_FragColor.rgb += radarColor * beam * 0.45;
`,
};

export function applyRingEffect(
  shader: RingShader,
  effect: RingEffectId,
  shaderTimeRef: { current: RingShaderTimeRef | null },
): void {
  if (effect === "materialOnly") {
    shaderTimeRef.current = null;
    return;
  }

  shader.uniforms.uTime = { value: 0 };

  shaderTimeRef.current = {
    uniforms: {
      uTime: shader.uniforms.uTime,
    },
  };

  shader.fragmentShader = shader.fragmentShader.replace(
    "void main() {",
    `${SHARED_GLSL}\nvoid main() {`,
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <dithering_fragment>",
    `${EFFECT_GLSL[effect]}\n#include <dithering_fragment>`,
  );
}
