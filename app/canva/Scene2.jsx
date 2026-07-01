import React, { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Lightroom3, { HDR_INTENSITY } from "./Lightroom3";
import { BoardC7Menu } from "./BoardC7Menu";

export default function Scene2({
  topGroupOpen,
  topGroupRotation,
  onHomeClick,
  onStocksClick,
  onNewsClick,
  onEbookClick,
}) {
  const group = useRef();
  const modelRef = useRef();
  const centeredRef = useRef(false);
  const dragState = useRef({ isDragging: false, pointerId: null, lastX: 0 });
  const { gl } = useThree();

  useEffect(() => {
    if (modelRef.current && !centeredRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const center = box.getCenter(new THREE.Vector3());
      modelRef.current.position.x -= center.x;
      modelRef.current.position.y -= center.y;
      modelRef.current.position.z -= center.z;
      centeredRef.current = true;
    }
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    const previousTouchAction = canvas.style.touchAction;
    canvas.style.touchAction = "none";

    const handlePointerDown = (event) => {
      if (!topGroupOpen) return;
      if (event.button !== 0) return;

      dragState.current.isDragging = true;
      dragState.current.pointerId = event.pointerId;
      dragState.current.lastX = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event) => {
      if (!dragState.current.isDragging) return;
      if (dragState.current.pointerId !== event.pointerId) return;
      if (!modelRef.current) return;

      const deltaX = event.clientX - dragState.current.lastX;
      modelRef.current.rotation.y += deltaX * 0.01;
      dragState.current.lastX = event.clientX;
    };

    const stopDragging = (event) => {
      if (dragState.current.pointerId !== event.pointerId) return;

      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      dragState.current.isDragging = false;
      dragState.current.pointerId = null;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", stopDragging);
    canvas.addEventListener("pointercancel", stopDragging);
    canvas.addEventListener("pointerleave", stopDragging);

    return () => {
      canvas.style.touchAction = previousTouchAction;
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", stopDragging);
      canvas.removeEventListener("pointercancel", stopDragging);
      canvas.removeEventListener("pointerleave", stopDragging);
    };
  }, [gl, topGroupOpen]);

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          try {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];

            materials.forEach((mat) => {
              if (!mat) return;

              if (mat.map) {
                // ensure color textures are interpreted correctly
                mat.map.colorSpace = THREE.SRGBColorSpace;
                mat.map.needsUpdate = true;
              }

              if ("envMapIntensity" in mat) {
                mat.envMapIntensity = HDR_INTENSITY;
              }

              mat.needsUpdate = true;
            });
            child.castShadow = true;
            child.receiveShadow = true;
          } catch {
            // Keep rendering stable if one material cannot be refreshed.
          }
        }
      });
    }
  }, []);

  return (
    <>
      <Lightroom3 />

      <group ref={group} position={[0, 0, 0]} scale={[1, 1, 1]}>
        <BoardC7Menu
          ref={modelRef}
          topGroupOpen={topGroupOpen}
          topGroupRotation={topGroupRotation}
          onHomeClick={onHomeClick}
          onStocksClick={onStocksClick}
          onNewsClick={onNewsClick}
          onEbookClick={onEbookClick}
        />
      </group>

      {/* Keep camera locked; model rotation is handled by pointer dragging. */}
      <OrbitControls
        makeDefault
        target={[0, 4, 0]}
        enableZoom={false}
        enableRotate={false}
        enablePan={false}
        enableKeys={false}
      />

      {/* ground plane removed per user request */}
    </>
  );
}
