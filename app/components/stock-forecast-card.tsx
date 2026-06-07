"use client";

import { useEffect, useState } from "react";
import { calculateStockWeather } from "../lib/stock-forecast";
import styles from "./stock-forecast-card.module.css";

type StockForecastCardProps = {
  volumeSurgePct: number | null;
  cmfSpread: number | null;
  mfVelocity: number | null;
};

export function StockForecastCard({
  volumeSurgePct,
  cmfSpread,
  mfVelocity,
}: StockForecastCardProps) {
  const [isVelocityHelpOpen, setIsVelocityHelpOpen] = useState(false);

  useEffect(() => {
    if (!isVelocityHelpOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsVelocityHelpOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVelocityHelpOpen]);

  if (volumeSurgePct === null || cmfSpread === null || mfVelocity === null) {
    return (
      <section className={styles.card} aria-label="Stock weather forecast">
        <div className={styles.header}>
          <span className={`${styles.iconWrap} ${styles.cloudy}`}>
            <CloudyIcon className={styles.icon} />
          </span>
          <div className={styles.titleBlock}>
            <p className={styles.title}>Cloudy: Insufficient Signal</p>
            <div className={styles.metaRow}>
              <p className={styles.tag}>Stock Weather Forecast</p>
              <span className={styles.velocityBadge}>MF Velocity N/A</span>
            </div>
          </div>
        </div>

        <p className={styles.disclaimer}>
          Experimental synthesis of volume and money-flow data for education
          only. Not live forecasting or trade advice.
        </p>
      </section>
    );
  }

  const forecast = calculateStockWeather(volumeSurgePct, cmfSpread, mfVelocity);

  return (
    <section className={styles.card} aria-label="Stock weather forecast">
      <div className={styles.header}>
        <span className={`${styles.iconWrap} ${styles[forecast.weather]}`}>
          {forecast.weather === "sunny" ? (
            <SunnyIcon className={styles.icon} />
          ) : forecast.weather === "rainy" ? (
            <RainyIcon className={styles.icon} />
          ) : (
            <CloudyIcon className={styles.icon} />
          )}
        </span>
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <p className={styles.title}>{forecast.headline}</p>
            <div className={styles.velocityWrap}>
              <span className={styles.velocityBadge}>
                MF Velocity {toSigned(mfVelocity, 1)}%
              </span>
              <button
                type="button"
                className={styles.helpIconButton}
                onClick={() => setIsVelocityHelpOpen(true)}
                aria-label="Explain MF Velocity"
              >
                ?
              </button>
            </div>
          </div>
          <p className={styles.tag}>Stock Weather Forecast</p>
        </div>
      </div>
      <p className={styles.disclaimer}>{forecast.disclaimer}</p>

      {isVelocityHelpOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="MF Velocity explanation"
          className={styles.helpOverlay}
          onClick={() => setIsVelocityHelpOpen(false)}
        >
          <div
            className={styles.helpDialog}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.helpHeader}>
              <h3 className={styles.helpTitle}>MF Velocity</h3>
              <button
                type="button"
                className={styles.helpCloseButton}
                onClick={() => setIsVelocityHelpOpen(false)}
              >
                Close
              </button>
            </div>

            <p className={styles.helpText}>
              MF Velocity shows how fast short-term money flow is changing vs
              its 90-day baseline.
            </p>
            <p className={styles.helpText}>
              Positive means stronger buying pressure. Negative means weaker
              than normal.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function toSigned(value: number, decimals: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}`;
}

type IconProps = {
  className?: string;
};

function SunnyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="4.5" fill="currentColor" opacity="0.9" />
      <path
        d="M12 2.5v2.7M12 18.8v2.7M2.5 12h2.7M18.8 12h2.7M5.3 5.3l1.9 1.9M16.8 16.8l1.9 1.9M16.8 7.2l1.9-1.9M5.3 18.7l1.9-1.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloudyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7.6 18.5h8.8c2.6 0 4.6-1.8 4.6-4.2 0-2.2-1.8-4.1-4.2-4.2-.7-2.3-2.8-3.8-5.4-3.8-3.1 0-5.6 2.3-5.8 5.2-2 0-3.6 1.6-3.6 3.5s1.6 3.5 3.6 3.5h2z"
        fill="currentColor"
        opacity="0.92"
      />
    </svg>
  );
}

function RainyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7.6 14.6h8.8c2.6 0 4.6-1.8 4.6-4.2 0-2.2-1.8-4.1-4.2-4.2-.7-2.3-2.8-3.8-5.4-3.8-3.1 0-5.6 2.3-5.8 5.2-2 0-3.6 1.6-3.6 3.5s1.6 3.5 3.6 3.5h2z"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M8.2 17.6l-1.3 3M12.2 17.6l-1.3 3M16.2 17.6l-1.3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
