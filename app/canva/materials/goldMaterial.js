export function createGoldMaterial(baseMaterial) {
  const material = baseMaterial.clone();

  material.color.set("#d4af37");
  material.metalness = 1;
  material.roughness = 0.28;

  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>

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

      diffuseColor.rgb *= vec3(1.0, 0.74, 0.22);
      diffuseColor.rgb += softGrain * vec3(0.1, 0.065, 0.015);
      diffuseColor.rgb += fineGrain * vec3(0.045, 0.03, 0.008);
      diffuseColor.rgb += polishedStreaks * vec3(0.12, 0.09, 0.025);`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>

      roughnessFactor = clamp(roughnessFactor + goldNoise(vViewPosition.xy * 45.0) * 0.09, 0.18, 0.48);`,
    );
  };

  material.customProgramCacheKey = () => "procedural-gold-material";

  return material;
}
