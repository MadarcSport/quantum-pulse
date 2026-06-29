export function createIronBlackMaterial(baseMaterial) {
  const material = baseMaterial.clone();

  material.color.set("#525252");
  material.metalness = 1;
  material.roughness = 0.2;

  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>

      float ironHash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float ironNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(
          mix(ironHash(i + vec2(0.0, 0.0)), ironHash(i + vec2(1.0, 0.0)), u.x),
          mix(ironHash(i + vec2(0.0, 1.0)), ironHash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>

      vec2 ironUv = vViewPosition.xy * 18.0;
      float broadGrain = ironNoise(ironUv);
      float fineGrain = ironNoise(ironUv * 7.0);
      float scratchLines = pow(abs(sin((vViewPosition.x + vViewPosition.y * 0.25) * 95.0)), 18.0);

      diffuseColor.rgb *= vec3(0.72, 0.70, 0.66);
      diffuseColor.rgb += broadGrain * 0.01;
      diffuseColor.rgb += fineGrain * 0.04;
      diffuseColor.rgb += scratchLines * 0.06;`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>

      roughnessFactor = clamp(roughnessFactor + ironNoise(vViewPosition.xy * 65.0) * 0.18, 0.32, 0.78);`,
    );
  };

  material.customProgramCacheKey = () => "procedural-iron-material";

  return material;
}
