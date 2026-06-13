"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { NewsArticle } from "@/app/lib/news";

type ArticleReaderProps = {
  article: NewsArticle;
};

const CLEAR_MODE_STORAGE_KEY = "news-article-clear-mode";
const ARTICLE_BACKGROUND_FADE_MS = 2550; // Duration for the background fade transition when toggling clear mode

export function ArticleReader({ article }: ArticleReaderProps) {
  const [isClearMode, setIsClearMode] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(CLEAR_MODE_STORAGE_KEY);
    setIsClearMode(storedValue === "on");
  }, []);

  function toggleClearMode() {
    setIsClearMode((previous) => {
      const next = !previous;
      window.localStorage.setItem(CLEAR_MODE_STORAGE_KEY, next ? "on" : "off");
      return next;
    });
  }

  const cardBorder = isClearMode
    ? "1px solid rgba(15, 23, 42, 0.12)"
    : "1px solid rgba(148, 163, 184, 0.18)";
  const cardShadow = isClearMode
    ? "0 18px 48px rgba(15, 23, 42, 0.12)"
    : "0 28px 80px rgba(2, 6, 23, 0.38)";
  const headingColor = isClearMode ? "#020617" : "#f8fafc";
  const introColor = isClearMode ? "#1e293b" : "#dbeafe";
  const bodyColor = isClearMode ? "#334155" : "#cbd5e1";
  const subtleTextColor = isClearMode ? "#475569" : "#94a3b8";
  const toggleTrackBackground = isClearMode
    ? "linear-gradient(180deg, #dbeafe, #bfdbfe)"
    : "linear-gradient(180deg, #0f172a, #1e293b)";
  const toggleTrackBorder = isClearMode
    ? "1px solid rgba(15, 23, 42, 0.2)"
    : "1px solid rgba(148, 163, 184, 0.35)";
  const toggleThumbTransform = isClearMode
    ? "translateX(78px)"
    : "translateX(0px)";

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #020617 0%, #081223 48%, #020617 100%)",
        color: "#e2e8f0",
        padding: "40px 20px 64px",
      }}
    >
      <article
        style={{
          width: "min(880px, 100%)",
          margin: "0 auto",
          border: cardBorder,
          borderRadius: 28,
          background: "rgba(15, 23, 42, 0.96)",
          boxShadow: cardShadow,
          padding: "clamp(20px, 4vw, 40px)",
          position: "relative",
          overflow: "hidden",
          transition:
            "border-color 600ms ease, box-shadow 600ms ease, color 600ms ease",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 28,
            background:
              "linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.96))",
            opacity: isClearMode ? 0 : 1,
            transition: `opacity ${ARTICLE_BACKGROUND_FADE_MS}ms ease`,
            pointerEvents: "none",
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 28,
            background:
              "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98))",
            opacity: isClearMode ? 1 : 0,
            transition: `opacity ${ARTICLE_BACKGROUND_FADE_MS}ms ease`,
            pointerEvents: "none",
          }}
        />

        <div
          style={{ position: "relative", zIndex: 1, display: "grid", gap: 24 }}
        >
          <header style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: isClearMode ? "#0c4a6e" : "#38bdf8",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                Quantum Industry News
              </p>

              <button
                type="button"
                onClick={toggleClearMode}
                aria-pressed={isClearMode}
                aria-label={
                  isClearMode ? "Switch to dark mode" : "Switch to clear mode"
                }
                style={{
                  position: "relative",
                  width: 150,
                  height: 38,
                  borderRadius: 999,
                  border: toggleTrackBorder,
                  background: toggleTrackBackground,
                  padding: 0,
                  cursor: "pointer",
                  overflow: "hidden",
                  boxShadow: isClearMode
                    ? "0 10px 22px rgba(59, 130, 246, 0.2)"
                    : "0 10px 22px rgba(2, 6, 23, 0.35)",
                  transition:
                    "background 500ms ease, border-color 500ms ease, box-shadow 500ms ease",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    color: isClearMode ? "rgba(30, 41, 59, 0.65)" : "#f8fafc",
                    fontSize: 11,
                    fontWeight: 700,
                    transition: "color 500ms ease, opacity 500ms ease",
                    opacity: isClearMode ? 0.7 : 1,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 14.2A9 9 0 1 1 9.8 3a7 7 0 0 0 11.2 11.2Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Dark</span>
                </span>

                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    color: isClearMode
                      ? "#0f172a"
                      : "rgba(226, 232, 240, 0.75)",
                    fontSize: 11,
                    fontWeight: 700,
                    transition: "color 500ms ease, opacity 500ms ease",
                    opacity: isClearMode ? 1 : 0.75,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Clear</span>
                </span>

                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 3,
                    left: 3,
                    width: 66,
                    height: 30,
                    borderRadius: 999,
                    background: isClearMode
                      ? "linear-gradient(180deg, #ffffff, #f8fafc)"
                      : "linear-gradient(180deg, #334155, #1e293b)",
                    border: isClearMode
                      ? "1px solid rgba(148, 163, 184, 0.55)"
                      : "1px solid rgba(148, 163, 184, 0.2)",
                    boxShadow: isClearMode
                      ? "0 6px 16px rgba(15, 23, 42, 0.18)"
                      : "0 6px 14px rgba(2, 6, 23, 0.35)",
                    transform: toggleThumbTransform,
                    transition:
                      "transform 1650ms cubic-bezier(0.22, 0.9, 0.3, 1), background 1500ms ease, border-color 1500ms ease",
                    // toggle thumb movement is intentionally given a longer duration with a custom easing for a more satisfying feel
                  }}
                />
              </button>
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                lineHeight: 1.05,
                color: headingColor,
              }}
            >
              {article.title}
            </h1>
            <p style={{ margin: 0, color: subtleTextColor, fontSize: 14 }}>
              {article.date}
            </p>
          </header>

          {article.heroImageUrl ? (
            <figure style={{ margin: 0, display: "grid", gap: 10 }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16 / 9",
                  overflow: "hidden",
                  borderRadius: 22,
                  border: cardBorder,
                }}
              >
                <Image
                  src={article.heroImageUrl}
                  alt={article.heroImageAlt ?? article.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 880px"
                  style={{ objectFit: "cover" }}
                  priority
                  unoptimized
                />
              </div>
            </figure>
          ) : null}

          <div
            style={{ display: "grid", gap: 18, fontSize: 18, lineHeight: 1.8 }}
          >
            {article.intro ? (
              <p style={{ margin: 0, color: introColor }}>{article.intro}</p>
            ) : null}

            {article.sections.map((section, index) => (
              <section
                key={section.heading}
                style={{ display: "grid", gap: 12 }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: headingColor,
                    fontSize: "1.45rem",
                  }}
                >
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} style={{ margin: 0, color: bodyColor }}>
                    {paragraph}
                  </p>
                ))}
                {section.bullets?.length ? (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 20,
                      color: bodyColor,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}

                {index === 1 && article.inlineImageUrl ? (
                  <figure
                    style={{ margin: "10px 0 0", display: "grid", gap: 10 }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "16 / 9",
                        overflow: "hidden",
                        borderRadius: 22,
                        border: cardBorder,
                      }}
                    >
                      <Image
                        src={article.inlineImageUrl}
                        alt={article.inlineImageAlt ?? article.title}
                        fill
                        sizes="(max-width: 900px) 100vw, 880px"
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
                    </div>
                  </figure>
                ) : null}
              </section>
            ))}

            {article.conclusion ? (
              <section
                style={{
                  display: "grid",
                  gap: 12,
                  paddingTop: 12,
                  borderTop: isClearMode
                    ? "1px solid rgba(15, 23, 42, 0.12)"
                    : "1px solid rgba(148, 163, 184, 0.14)",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: headingColor,
                    fontSize: "1.45rem",
                  }}
                >
                  The Bottom Line
                </h2>
                <p style={{ margin: 0, color: bodyColor }}>
                  {article.conclusion}
                </p>
              </section>
            ) : null}
          </div>

          <p
            style={{
              margin: 0,
              color: subtleTextColor,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            For informational purposes only.
          </p>
        </div>
      </article>
    </main>
  );
}
