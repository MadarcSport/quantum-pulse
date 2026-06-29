export function createCopperMaterial(baseMaterial) {
  const material = baseMaterial.clone();

  material.color.set("#7b4818");
  material.metalness = 0.96;
  material.roughness = 0.15;

  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>

      float copperHash(vec2 p) {
        return fract(sin(dot(p, vec2(91.7, 441.2))) * 43758.5453123);
      }

      float copperNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(
          mix(copperHash(i + vec2(0.0, 0.0)), copperHash(i + vec2(1.0, 0.0)), u.x),
          mix(copperHash(i + vec2(0.0, 1.0)), copperHash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>

      vec2 copperUv = vViewPosition.xy * 16.0;
      float warmGrain = copperNoise(copperUv);
      float fineGrain = copperNoise(copperUv * 6.5);
      float oxidationHint = smoothstep(0.72, 1.0, copperNoise(copperUv * 0.6));
      float brushedLines = pow(abs(sin((vViewPosition.x + vViewPosition.y * 0.18) * 82.0)), 20.0);

      diffuseColor.rgb *= vec3(0.95, 0.42, 0.18);
      diffuseColor.rgb += warmGrain * vec3(0.09, 0.04, 0.018);
      diffuseColor.rgb += fineGrain * vec3(0.04, 0.02, 0.01);
      diffuseColor.rgb += brushedLines * vec3(0.06, 0.03, 0.012);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.12, 0.42, 0.34), oxidationHint * 0.12);`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>

      roughnessFactor = clamp(roughnessFactor + copperNoise(vViewPosition.xy * 55.0) * 0.13, 0.24, 0.62);`,
    );
  };

  material.customProgramCacheKey = () => "procedural-copper-material";

  return material;
}
