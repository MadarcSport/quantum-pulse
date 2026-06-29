export function createBlackPlasticMaterial(baseMaterial) {
  const material = baseMaterial.clone();

  // Base PBR properties for a standard molded black plastic
  material.color.set("#3b3b3b"); // Deep charcoal/black, pure #000000 looks unnatural
  material.metalness = 0.94; // Plastic is strictly non-metallic
  material.roughness = 0.28; // Medium matte finish by default

  material.onBeforeCompile = (shader) => {
    // 1. Inject common noise functions
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>

      float plasticHash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float plasticNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(
          mix(plasticHash(i + vec2(0.0, 0.0)), plasticHash(i + vec2(1.0, 0.0)), u.x),
          mix(plasticHash(i + vec2(0.0, 1.0)), plasticHash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }`,
    );

    // 2. Inject subtle color variation (dust/scuffs)
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>

      // Use screen space or view position for procedural noise mapping
      vec2 plasticUv = vViewPosition.xy * 8.0;
      float microGrain = plasticNoise(plasticUv * 4.0);
      float scuffNoise = plasticNoise(plasticUv * 0.5);

      // Lighten slightly in micrograin areas to simulate molded plastic texture reflection
      diffuseColor.rgb += vec3(microGrain * 0.015);
      
      // Add extremely subtle lighter scuffs/variations
      diffuseColor.rgb += vec3(pow(scuffNoise, 4.0) * 0.02);`,
    );

    // 3. Inject roughness variation (crucial for realistic plastic)
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>

      // Micro-texture variation to break up smooth specular highlights
      float textureRoughness = plasticNoise(vViewPosition.xy * 80.0) * 0.12;
      
      // Smudge/fingerprint simulation (broader variation)
      float smudgeRoughness = plasticNoise(vViewPosition.xy * 3.0) * 0.08;

      roughnessFactor = clamp(roughnessFactor + textureRoughness + smudgeRoughness, 0.15, 0.65);`,
    );
  };

  material.customProgramCacheKey = () => "procedural-black-plastic-material";

  return material;
}
