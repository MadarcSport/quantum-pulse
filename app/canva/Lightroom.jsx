import React from "react";
import { Environment } from "@react-three/drei";

export const HDR_INTENSITY = 0.9;
const ROSENDAL_HDR_URL = new URL("./assets/rosendal.hdr", import.meta.url).href;

export default function Lightroom() {
  return (
    <>
      <Environment files={ROSENDAL_HDR_URL} background={false} />
      {/* Temporarily replace your file with a preset to test */}
      {/* <Environment preset="warehouse" background={false} /> */}

      <hemisphereLight
        skyColor="#e7e7e7"
        groundColor="#11224e"
        intensity={0.8}
      />
      <ambientLight intensity={0.1} />

      <spotLight
        // position={[30, 20, 60]}
        position={[28, 18, 40]}
        angle={60}
        penumbra={0.2}
        intensity={57}
        distance={150}
        castShadow
      />
      <spotLight
        position={[-30, 20, -60]}
        angle={4}
        penumbra={0.5}
        intensity={6}
        distance={150}
        castShadow
      />
    </>
  );
}
