"use client";

import React, { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene2 from "./Scene2";
import * as THREE from "three";
import { useRouter, useSearchParams } from "next/navigation";

const MENU_ROTATIONS = {
  home: 0,
  stocks: -Math.PI / 2,
  news: Math.PI,
  ebook: Math.PI / 2,
};

export default function CanvaApp2({ style, canvasStyle }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [topGroupOpen, setTopGroupOpen] = useState(false);
  const [topGroupRotation, setTopGroupRotation] = useState(0);
  const [isMobile, setIsMobile] = useState(null);

  React.useEffect(() => {
    const menu = searchParams.get("menu");
    if (!menu || !(menu in MENU_ROTATIONS)) return;

    setTopGroupOpen(true);
    setTopGroupRotation(MENU_ROTATIONS[menu]);
  }, [searchParams]);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => setIsMobile(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  const goToMenuRoute = (path, menu) => {
    router.push(`${path}?menu=${menu}`);
  };

  const rotateTopGroup = (direction) => {
    if (!topGroupOpen) return;

    setTopGroupRotation((current) => current + direction * (Math.PI / 2));
  };

  const navButtonSize = isMobile ? 44 : 52;
  const navButtonFontSize = isMobile ? 22 : 28;
  const navButtonSideOffset = isMobile ? 12 : 24;
  const navButtonGlow = isMobile
    ? "0 0 12px rgba(0, 130, 252, 0.65)"
    : "0 0 18px rgba(0, 130, 252, 0.65)";
  const toggleButtonInset = isMobile ? 12 : 24;
  const toggleButtonFontSize = isMobile ? 12 : 14;
  const toggleButtonPadding = isMobile ? "8px 16px" : "10px 22px";

  const isViewportReady = isMobile !== null;

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
        style={{
          position: "relative",

          width: "80vw",
          height: "70vh",

          ...canvasStyle,
        }}
      >
        {isViewportReady ? (
          <Canvas
            shadows
            // resize={{ scroll: true, debounce: { scroll: 50, resize: 0 } }}
            camera={{
              position: isMobile ? [-1.5, 12, 25] : [-1.5, 10.5, 22],
              fov: 18,
            }}
            gl={{
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 0.48,
            }}
            style={{
              background: "#060a1a",
              borderRadius: "8px",
              display: "block",
              height: "100%",
              width: "100%",
            }}
          >
            <Suspense fallback={null}>
              <Scene2
                topGroupOpen={topGroupOpen}
                topGroupRotation={topGroupRotation}
                onHomeClick={() => goToMenuRoute("/", "home")}
                onStocksClick={() => goToMenuRoute("/stocks", "stocks")}
                onNewsClick={() => goToMenuRoute("/news", "news")}
                onEbookClick={() => goToMenuRoute("/ebook", "ebook")}
              />
            </Suspense>
          </Canvas>
        ) : (
          <div
            style={{
              background: "#060a1a",
              borderRadius: "8px",
              height: "100%",
              width: "100%",
            }}
          />
        )}

        <button
          type="button"
          onClick={() => setTopGroupOpen((current) => !current)}
          style={{
            position: "absolute",
            top: `${toggleButtonInset}px`,
            right: `${toggleButtonInset}px`,
            zIndex: 10,
            background: topGroupOpen ? "#111827" : "#0082fc",
            border: "1px solid rgba(255, 255, 255, 0.45)",
            borderRadius: "999px",
            boxShadow: topGroupOpen
              ? "0 0 18px rgba(17, 24, 39, 0.65)"
              : "0 0 18px rgba(0, 130, 252, 0.65)",
            color: "white",
            cursor: "pointer",
            fontSize: `${toggleButtonFontSize}px`,
            fontWeight: 700,
            letterSpacing: "0.08em",
            margin: "5px",
            padding: toggleButtonPadding,
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
            left: `${navButtonSideOffset}px`,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            alignItems: "center",
            background: topGroupOpen ? "#0082fc" : "rgba(17, 24, 39, 0.55)",
            border: "1px solid rgba(255, 255, 255, 0.45)",
            borderRadius: "999px",
            boxShadow: topGroupOpen ? navButtonGlow : "none",
            color: "white",
            cursor: topGroupOpen ? "pointer" : "not-allowed",
            display: "flex",
            fontSize: `${navButtonFontSize}px`,
            fontWeight: 800,
            height: `${navButtonSize}px`,
            justifyContent: "center",
            margin: "5px",
            opacity: topGroupOpen ? 1 : 0.42,
            width: `${navButtonSize}px`,
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
            right: `${navButtonSideOffset}px`,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            alignItems: "center",
            background: topGroupOpen ? "#0082fc" : "rgba(17, 24, 39, 0.55)",
            border: "1px solid rgba(255, 255, 255, 0.45)",
            borderRadius: "999px",
            boxShadow: topGroupOpen ? navButtonGlow : "none",
            color: "white",
            cursor: topGroupOpen ? "pointer" : "not-allowed",
            display: "flex",
            fontSize: `${navButtonFontSize}px`,
            fontWeight: 800,
            height: `${navButtonSize}px`,
            justifyContent: "center",
            margin: "5px",
            opacity: topGroupOpen ? 1 : 0.42,
            width: `${navButtonSize}px`,
          }}
          aria-label="Rotate top assembly right"
        >
          ›
        </button>
      </div>
    </div>
  );
}
