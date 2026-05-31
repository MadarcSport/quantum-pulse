"use client";

import { Center } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

export function ThreeCubeScene() {
  return (
    <div
      style={{
        height: "100%",
        minHeight: 320,
        width: "100%",
        background:
          "radial-gradient(circle at top, rgba(56, 189, 248, 0.18), rgba(2, 6, 23, 0.98) 70%)",
      }}
    >
      <Canvas
        camera={{ position: [2.4, 2.4, 2.4], fov: 45 }}
        style={{ height: "100%", width: "100%" }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 5, 3]} intensity={2.2} />
        <Center>
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color="#38bdf8"
              roughness={0.35}
              metalness={0.15}
            />
          </mesh>
        </Center>
      </Canvas>
    </div>
  );
}
