import React from "react";
import { Environment } from "@react-three/drei";
import { DEFAULT_HDR_PROFILE_ID, getHdrProfile } from "./hdrProfiles";

const HDR_URLS = {
  moonrise: new URL("./assets/moonrise.hdr", import.meta.url).href,
  rosendal: new URL("./assets/rosendal.hdr", import.meta.url).href,
  studio2: new URL("./assets/studio2.hdr", import.meta.url).href,
  ferndale: new URL("./assets/ferndale.hdr", import.meta.url).href,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getAdaptiveLighting(profile) {
  const analysis = profile.analysis ?? {};
  const averageLuminance = analysis.averageLuminance ?? 0.85;
  const dynamicRange = analysis.dynamicRange ?? 1.6;

  // Normalize around observed profile values to keep adaptation subtle.
  const luminanceComp = clamp(
    0.85 / Math.max(averageLuminance, 0.05),
    0.75,
    1.25,
  );
  const contrastComp = clamp(1.6 / Math.max(dynamicRange, 0.2), 0.85, 1.15);

  const environmentIntensity =
    profile.lighting.environmentIntensity * clamp(luminanceComp, 0.7, 1.3);
  const hemisphereIntensity =
    profile.lighting.hemisphereIntensity *
    clamp(luminanceComp * contrastComp, 0.75, 1.25);
  const ambientIntensity =
    profile.lighting.ambientIntensity *
    clamp(luminanceComp * contrastComp, 0.7, 1.2);
  const keySpotIntensity =
    profile.lighting.keySpot.intensity * clamp(luminanceComp, 0.8, 1.25);
  const fillSpotIntensity =
    profile.lighting.fillSpot.intensity *
    clamp(luminanceComp * contrastComp, 0.75, 1.3);
  const directionalIntensity =
    profile.lighting.directionalIntensity * clamp(luminanceComp, 0.8, 1.25);

  return {
    environmentIntensity,
    hemisphereIntensity,
    ambientIntensity,
    keySpotIntensity,
    fillSpotIntensity,
    directionalIntensity,
  };
}

export function getHdrMaterialIntensity(profileId = DEFAULT_HDR_PROFILE_ID) {
  const profile = getHdrProfile(profileId);
  return getAdaptiveLighting(profile).environmentIntensity;
}

export const HDR_INTENSITY = getHdrMaterialIntensity();

export default function Lightroom3({ profileId = DEFAULT_HDR_PROFILE_ID }) {
  const profile = getHdrProfile(profileId);
  const hdrUrl = HDR_URLS[profile.id] ?? HDR_URLS[DEFAULT_HDR_PROFILE_ID];
  const adaptive = getAdaptiveLighting(profile);

  return (
    <>
      <Environment
        files={hdrUrl}
        background={false}
        environmentIntensity={adaptive.environmentIntensity}
        backgroundIntensity={0}
      />

      <hemisphereLight
        skyColor={profile.lighting.hemisphereSkyColor}
        groundColor={profile.lighting.hemisphereGroundColor}
        intensity={adaptive.hemisphereIntensity}
      />
      <ambientLight intensity={adaptive.ambientIntensity} />

      <spotLight
        position={profile.lighting.keySpot.position}
        angle={profile.lighting.keySpot.angle}
        penumbra={profile.lighting.keySpot.penumbra}
        intensity={adaptive.keySpotIntensity}
        distance={profile.lighting.keySpot.distance}
        decay={profile.lighting.keySpot.decay}
      />

      <spotLight
        position={profile.lighting.fillSpot.position}
        angle={profile.lighting.fillSpot.angle}
        penumbra={profile.lighting.fillSpot.penumbra}
        intensity={adaptive.fillSpotIntensity}
        distance={profile.lighting.fillSpot.distance}
        decay={profile.lighting.fillSpot.decay}
      />

      <directionalLight
        position={[0, 20, 14]}
        intensity={adaptive.directionalIntensity}
      />
    </>
  );
}
