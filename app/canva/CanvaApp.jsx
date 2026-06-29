"use client";

import React, { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";
import * as THREE from "three";
import { Center, Bounds } from "@react-three/drei";

export default function CanvaApp({ style, canvasStyle }) {
  const [topGroupOpen, setTopGroupOpen] = useState(false);
  const [topGroupRotation, setTopGroupRotation] = useState(0);
  const [showTextPopup, setShowTextPopup] = useState(false);

  const rotateTopGroup = (direction) => {
    if (!topGroupOpen) return;

    setTopGroupRotation((current) => current + direction * (Math.PI / 2));
  };
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      <div
        onPointerDownCapture={(event) => {
          if (event.target.tagName === "CANVAS") {
            setShowTextPopup(false);
          }
        }}
        style={{
          position: "relative",
          width: "80vw",
          // Fix: Make it a compact 240px landscape bar on mobile, and 70vh on desktop
          height: isMobile ? "190px" : "70vh",
          ...canvasStyle,
        }}
      >
        <Canvas
          shadows
          camera={{
            position: isMobile ? [0, 15, 30] : [-1.5, 12, 25],
            fov: isMobile ? 18 : 18,
          }}
          gl={{
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.48,
          }}
          style={{
            background: "#060a1a",
            borderRadius: "8px",
            display: "block",
            height: "100%", // Now correctly fills the container div above
            width: "100%",
          }}
        >
          <Suspense fallback={null}>
            <Scene
              topGroupOpen={topGroupOpen}
              topGroupRotation={topGroupRotation}
              onNewsTextClick={() => setShowTextPopup(true)}
            />
          </Suspense>
        </Canvas>

        <button
          type="button"
          onClick={() => setTopGroupOpen((current) => !current)}
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            zIndex: 10,
            background: topGroupOpen ? "#111827" : "#0082fc",
            border: "1px solid rgba(255, 255, 255, 0.45)",
            borderRadius: "999px",
            boxShadow: topGroupOpen
              ? "0 0 18px rgba(17, 24, 39, 0.65)"
              : "0 0 18px rgba(0, 130, 252, 0.65)",
            color: "white",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            margin: "5px",
            padding: "10px 22px",
            textTransform: "uppercase",
          }}
        >
          {topGroupOpen ? "close" : "open"}
        </button>

        <button
          type="button"
          disabled={!topGroupOpen}
          onClick={() => rotateTopGroup(-1)}
          style={{
            position: "absolute",
            left: "24px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            alignItems: "center",
            background: topGroupOpen ? "#0082fc" : "rgba(17, 24, 39, 0.55)",
            border: "1px solid rgba(255, 255, 255, 0.45)",
            borderRadius: "999px",
            boxShadow: topGroupOpen
              ? "0 0 18px rgba(0, 130, 252, 0.65)"
              : "none",
            color: "white",
            cursor: topGroupOpen ? "pointer" : "not-allowed",
            display: "flex",
            fontSize: "28px",
            fontWeight: 800,
            height: "52px",
            justifyContent: "center",
            margin: "5px",
            opacity: topGroupOpen ? 1 : 0.42,
            width: "52px",
          }}
          aria-label="Rotate top assembly left"
        >
          ‹
        </button>

        <button
          type="button"
          disabled={!topGroupOpen}
          onClick={() => rotateTopGroup(1)}
          style={{
            position: "absolute",
            right: "24px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            alignItems: "center",
            background: topGroupOpen ? "#0082fc" : "rgba(17, 24, 39, 0.55)",
            border: "1px solid rgba(255, 255, 255, 0.45)",
            borderRadius: "999px",
            boxShadow: topGroupOpen
              ? "0 0 18px rgba(0, 130, 252, 0.65)"
              : "none",
            color: "white",
            cursor: topGroupOpen ? "pointer" : "not-allowed",
            display: "flex",
            fontSize: "28px",
            fontWeight: 800,
            height: "52px",
            justifyContent: "center",
            margin: "5px",
            opacity: topGroupOpen ? 1 : 0.42,
            width: "52px",
          }}
          aria-label="Rotate top assembly right"
        >
          ›
        </button>

        {showTextPopup && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "24px",
              transform: "translateY(-50%)",
              zIndex: 10,
              background: "#111827",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "14px",
              boxShadow: "0 14px 34px rgba(0, 0, 0, 0.28)",
              color: "white",
              fontSize: "15px",
              fontWeight: 600,
              padding: "16px 18px",
              width: "170px",
            }}
          >
            you clicked text
          </div>
        )}
      </div>
    </div>
  );
}
