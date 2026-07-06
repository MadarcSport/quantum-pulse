import { applyRingEffect } from "./ringEffects";

export function createRingEffectMaterial(baseMaterial, shaderRef, effect) {
  const material = baseMaterial.clone();

  material.name = `RingEffectMaterial-${effect}`;

  material.onBeforeCompile = (shader) => {
    applyRingEffect(shader, effect, shaderRef);
  };

  material.customProgramCacheKey = () => `ring-effect-${effect}`;

  return material;
}
