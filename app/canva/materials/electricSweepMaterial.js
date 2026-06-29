import * as THREE from "three";

export function createElectricSweepMaterial(baseMaterial, shaderRef) {
  const material = baseMaterial.clone();

  material.name = "ElectricSweepMaterial";
  material.color.set("#493912");
  material.emissive = new THREE.Color("#001a33");
  material.emissiveIntensity = 0.35;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSweepTime = { value: 0 };

    if (shaderRef) {
      shaderRef.current = shader;
    }

    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>

      varying vec3 vSweepWorldPosition;`,
    );

    shader.vertexShader = shader.vertexShader.replace(
      "#include <worldpos_vertex>",
      `#include <worldpos_vertex>

      vSweepWorldPosition = worldPosition.xyz;`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>

      uniform float uSweepTime;
      varying vec3 vSweepWorldPosition;

      float electricHash(vec2 point) {
        return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453123);
      }`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>

      float sweepCycle = fract(uSweepTime / 3.0);
      float sweepAxis = vSweepWorldPosition.x * 0.055 + vSweepWorldPosition.z * 0.018;
      float sweepPosition = fract(sweepAxis - sweepCycle);
      float sweepCore = smoothstep(0.0, 0.035, sweepPosition) * (1.0 - smoothstep(0.035, 0.14, sweepPosition));
      float sweepTrail = smoothstep(0.0, 0.24, sweepPosition) * (1.0 - smoothstep(0.24, 0.48, sweepPosition));
      float circuitSparkle = electricHash(floor(vSweepWorldPosition.xz * 8.0 + uSweepTime * 7.0));
      float electricLight = sweepCore * 1.55 + sweepTrail * 0.38 + sweepCore * circuitSparkle * 0.55;
      vec3 electricBlue = vec3(0.0, 0.55, 1.0);

      diffuseColor.rgb += electricBlue * electricLight * 0.55;
      totalEmissiveRadiance += electricBlue * electricLight * 2.2;`,
    );
  };

  material.customProgramCacheKey = () => "electric-blue-sweep-material";

  return material;
}
