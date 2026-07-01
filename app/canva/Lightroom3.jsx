import React from "react";
import { Environment } from "@react-three/drei";

export const HDR_INTENSITY = 0.2;
const ROSENDAL_HDR_URL = new URL("./assets/moonrise.hdr", import.meta.url).href;

export default function Lightroom3() {
  return (
    <>
      <Environment
        files={ROSENDAL_HDR_URL}
        background={false}
        environmentIntensity={HDR_INTENSITY}
        backgroundIntensity={0}
      />

      <hemisphereLight
        skyColor="#e7e7e7"
        groundColor="#11224e"
        intensity={8.8}
      />
      <ambientLight intensity={3.1} />

      <spotLight
        position={[6, 14, -38]}
        // angle={Math.PI / 2}
        angle={40}
        penumbra={0.2}
        intensity={560}
        distance={260}
        decay={2}
      />

      <spotLight
        position={[-22, -11, 38]}
        angle={1.2}
        penumbra={0.2}
        intensity={1360}
        distance={260}
        decay={2}
      />

      <directionalLight position={[0, 20, 14]} intensity={0.65} />
    </>
  );
}
