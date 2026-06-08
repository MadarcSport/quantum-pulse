"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Lottie from "lottie-react";

const animationPath = "/c2bb4348-1181-11ee-bc75-b3970afe57bc.json";

export function MoreStocksButton() {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAnimation() {
      try {
        const response = await fetch(animationPath);
        if (!response.ok) {
          return;
        }

        const json = (await response.json()) as object;
        if (!cancelled) {
          setAnimationData(json);
        }
      } catch {
        // Keep text-only button if animation fails to load.
      }
    }

    void loadAnimation();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href="/stocks"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "10px 18px",
        borderRadius: 999,
        border: "2px solid rgba(14, 165, 233, 0.6)",
        color: "#e0f2fe",
        textDecoration: "none",
        fontWeight: 700,
        background: "rgba(14, 165, 233, 0.2)",
      }}
    >
      <span>More Stocks</span>
      <span
        aria-hidden="true"
        style={{
          width: 22,
          height: 22,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "visible",
        }}
      >
        {animationData ? (
          <Lottie
            animationData={animationData}
            loop
            autoplay
            style={{
              width: 22,
              height: 22,
              transform: "scale(1.8)", // visually bigger, layout size unchanged
              transformOrigin: "center",
            }}
          />
        ) : (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "rgba(224, 242, 254, 0.75)",
            }}
          />
        )}
      </span>
    </Link>
  );
}
