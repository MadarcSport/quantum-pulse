"use client";

import React, { useState, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import Scene2 from "./Scene2";
import * as THREE from "three";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CanvasErrorBoundary from "./CanvasErrorBoundary";
import styles from "./CanvaApp2.module.css";

const MENU_ROTATIONS = {
  home: 0,
  stocks: -Math.PI / 2,
  news: Math.PI,
  ebook: Math.PI / 2,
};

function CanvasLoopController({ isActive }) {
  const setFrameloop = useThree((state) => state.setFrameloop);
  const invalidate = useThree((state) => state.invalidate);

  React.useEffect(() => {
    setFrameloop(isActive ? "always" : "demand");

    if (isActive) {
      invalidate();
    }
  }, [invalidate, isActive, setFrameloop]);

  return null;
}

export default function CanvaApp2({ style, canvasStyle }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canvasHostRef = React.useRef(null);
  const [topGroupOpen, setTopGroupOpen] = useState(false);
  const [topGroupRotation, setTopGroupRotation] = useState(0);
  const [isMobile, setIsMobile] = useState(null);
  const [isCanvasVisible, setIsCanvasVisible] = useState(true);

  React.useEffect(() => {
    const menu = searchParams.get("menu");
    if (!menu || !(menu in MENU_ROTATIONS)) {
      setTopGroupOpen(false);
      setTopGroupRotation(0);
      return;
    }

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

  React.useEffect(() => {
    const target = canvasHostRef.current;

    if (!target || !("IntersectionObserver" in window)) {
      setIsCanvasVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCanvasVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "120px 0px",
        threshold: 0,
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
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
  const toggleButtonInset = isMobile ? 12 : 25;
  const toggleButtonFontSize = isMobile ? 11 : 16;
  const toggleButtonPadding = isMobile ? "6px 10px" : "10px 16px";

  const isViewportReady = isMobile !== null;
  // const cameraPosition = [-1.5, 10.5, 22];
  const cameraPosition = isMobile ? [-1.5, 11.5, 23.7] : [-1.5, 10.5, 22];
  // const cameraTarget = [0, 4, 0];
  const cameraTarget = isMobile ? [0, 4.2, 0] : [0, 4, 0];
  const cameraResetToken = `${pathname}?${searchParams.toString()}`;

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
        ref={canvasHostRef}
        style={{
          position: "relative",

          width: "80vw",
          height: "70vh",

          ...canvasStyle,
        }}
      >
        {isViewportReady ? (
          <CanvasErrorBoundary>
            <Canvas
              key={`hero-canvas-${pathname}`}
              frameloop={isCanvasVisible ? "always" : "demand"}
              shadows
              // resize={{ scroll: true, debounce: { scroll: 50, resize: 0 } }}
              camera={{
                position: cameraPosition,
                fov: 18,
              }}
              gl={{
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 0.55,
                // antialias: true,
                // physicallyCorrectLights: true,

                // toneMapping: THREE.AgXToneMapping,
                // toneMappingExposure: 0.32,
              }}
              style={{
                background: "#060a1a",
                borderRadius: "8px",
                display: "block",
                height: "100%",
                width: "100%",
              }}
            >
              <CanvasLoopController isActive={isCanvasVisible} />
              <Suspense fallback={null}>
                <Scene2
                  isActive={isCanvasVisible}
                  topGroupOpen={topGroupOpen}
                  topGroupRotation={topGroupRotation}
                  cameraPosition={cameraPosition}
                  cameraTarget={cameraTarget}
                  cameraResetToken={cameraResetToken}
                  onHomeClick={() => goToMenuRoute("/", "home")}
                  onStocksClick={() => goToMenuRoute("/stocks", "stocks")}
                  onNewsClick={() => goToMenuRoute("/news", "news")}
                  onEbookClick={() => goToMenuRoute("/ebook", "ebook")}
                />
              </Suspense>
            </Canvas>
          </CanvasErrorBoundary>
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
          className={`${styles.hudToggleButton} ${topGroupOpen ? styles.hudToggleButtonOpen : ""}`}
          style={{
            "--hud-font-size": `${toggleButtonFontSize}px`,
            "--hud-inset": `${toggleButtonInset}px`,
            "--hud-padding": toggleButtonPadding,
          }}
          aria-pressed={topGroupOpen}
        >
          <span className={styles.hudStatusDot} aria-hidden="true" />
          <span className={styles.hudTextStack}>
            <span className={styles.hudLabel}>
              {topGroupOpen ? "Close" : "Open"}
            </span>
          </span>
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
