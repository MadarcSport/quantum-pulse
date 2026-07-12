import * as THREE from "three";
import { DEFAULT_HDR_PROFILE_ID, getHdrProfile } from "../hdrProfiles";

const DEFAULT_GOLD_HDR_ANALYSIS = {
  averageLuminance: 0.85,
  dominantColor: [1, 0.96, 0.9],
  dynamicRange: 1.6,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resolveHdrAnalysis(hdrProfileOrAnalysis = DEFAULT_HDR_PROFILE_ID) {
  if (typeof hdrProfileOrAnalysis === "string") {
    return (
      getHdrProfile(hdrProfileOrAnalysis).analysis ?? DEFAULT_GOLD_HDR_ANALYSIS
    );
  }

  return (
    hdrProfileOrAnalysis?.analysis ??
    hdrProfileOrAnalysis ??
    DEFAULT_GOLD_HDR_ANALYSIS
  );
}

function getGoldHdrUniformValues(hdrProfileOrAnalysis) {
  const analysis = resolveHdrAnalysis(hdrProfileOrAnalysis);
  const dominantColor =
    analysis.dominantColor ?? DEFAULT_GOLD_HDR_ANALYSIS.dominantColor;

  return {
    averageLuminance: clamp(
      Number.isFinite(analysis.averageLuminance)
        ? analysis.averageLuminance
        : DEFAULT_GOLD_HDR_ANALYSIS.averageLuminance,
      0.05,
      4,
    ),
    dynamicRange: clamp(
      Number.isFinite(analysis.dynamicRange)
        ? analysis.dynamicRange
        : DEFAULT_GOLD_HDR_ANALYSIS.dynamicRange,
      0.2,
      12,
    ),
    dominantColor: new THREE.Vector3(
      dominantColor[0] ?? DEFAULT_GOLD_HDR_ANALYSIS.dominantColor[0],
      dominantColor[1] ?? DEFAULT_GOLD_HDR_ANALYSIS.dominantColor[1],
      dominantColor[2] ?? DEFAULT_GOLD_HDR_ANALYSIS.dominantColor[2],
    ),
  };
}

function applyGoldHdrUniformValues(material, hdrProfileOrAnalysis) {
  const values = getGoldHdrUniformValues(hdrProfileOrAnalysis);

  material.userData.goldHdrValues = values;

  if (material.userData.goldHdrUniforms) {
    material.userData.goldHdrUniforms.uHdrAverageLuminance.value =
      values.averageLuminance;
    material.userData.goldHdrUniforms.uHdrDynamicRange.value =
      values.dynamicRange;
    material.userData.goldHdrUniforms.uHdrDominantColor.value.copy(
      values.dominantColor,
    );
  }
}

export function updateGoldMaterial2Hdr(material, hdrProfileOrAnalysis) {
  if (!material) return;

  applyGoldHdrUniformValues(material, hdrProfileOrAnalysis);
}

export function createGoldMaterial2(
  baseMaterial,
  hdrProfileOrAnalysis = DEFAULT_HDR_PROFILE_ID,
) {
  const material = baseMaterial.clone();

  material.color.set("#d4af37");
  material.metalness = 1;
  material.roughness = 0.28;

  applyGoldHdrUniformValues(material, hdrProfileOrAnalysis);

  material.onBeforeCompile = (shader) => {
    const values = material.userData.goldHdrValues;

    shader.uniforms.uHdrAverageLuminance = {
      value: values.averageLuminance,
    };
    shader.uniforms.uHdrDynamicRange = {
      value: values.dynamicRange,
    };
    shader.uniforms.uHdrDominantColor = {
      value: values.dominantColor.clone(),
    };
    shader.uniforms.uHdrTintStrength = {
      value: 0.08,
    };
    shader.uniforms.uHdrGrainStrength = {
      value: 1.0,
    };

    material.userData.goldHdrUniforms = {
      uHdrAverageLuminance: shader.uniforms.uHdrAverageLuminance,
      uHdrDynamicRange: shader.uniforms.uHdrDynamicRange,
      uHdrDominantColor: shader.uniforms.uHdrDominantColor,
      uHdrTintStrength: shader.uniforms.uHdrTintStrength,
      uHdrGrainStrength: shader.uniforms.uHdrGrainStrength,
    };

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>

      uniform float uHdrAverageLuminance;
      uniform float uHdrDynamicRange;
      uniform vec3 uHdrDominantColor;
      uniform float uHdrTintStrength;
      uniform float uHdrGrainStrength;

      float goldHash(vec2 p) {
        return fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453123);
      }

      float goldNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(
          mix(goldHash(i + vec2(0.0, 0.0)), goldHash(i + vec2(1.0, 0.0)), u.x),
          mix(goldHash(i + vec2(0.0, 1.0)), goldHash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>

      vec2 goldUv = vViewPosition.xy * 14.0;
      float softGrain = goldNoise(goldUv);
      float fineGrain = goldNoise(goldUv * 5.5);
      float polishedStreaks = pow(abs(sin((vViewPosition.x * 1.2 + vViewPosition.y * 0.35) * 70.0)), 24.0);
      float hdrLuminanceComp = clamp(0.85 / max(uHdrAverageLuminance, 0.05), 0.75, 1.25);
      float hdrContrastComp = clamp(uHdrDynamicRange / 1.6, 0.75, 1.35);
      vec3 hdrTint = mix(vec3(1.0), uHdrDominantColor, uHdrTintStrength);
      float hdrGrainStrength = uHdrGrainStrength * hdrLuminanceComp;

      diffuseColor.rgb *= vec3(1.0, 0.74, 0.22) * hdrTint;
      diffuseColor.rgb += softGrain * vec3(0.1, 0.065, 0.015) * hdrGrainStrength;
      diffuseColor.rgb += fineGrain * vec3(0.045, 0.03, 0.008) * hdrGrainStrength;
      diffuseColor.rgb += polishedStreaks * vec3(0.12, 0.09, 0.025) * hdrContrastComp;`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>

      float hdrRoughnessContrastComp = clamp(uHdrDynamicRange / 1.6, 0.75, 1.35);
      roughnessFactor = clamp(
        roughnessFactor + goldNoise(vViewPosition.xy * 45.0) * 0.09 - (hdrRoughnessContrastComp - 1.0) * 0.035,
        0.18,
        0.48
      );`,
    );
  };

  material.customProgramCacheKey = () =>
    "procedural-gold-material-hdr-uniforms-v1";

  return material;
}
