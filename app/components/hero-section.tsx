import { ThreeCubeScene } from "./three-cube-scene";

export function HeroSection() {
  return (
    <>
      <div
        style={{
          overflow: "hidden",
          borderRadius: 24,
          border: "1px solid rgba(148, 163, 184, 0.2)",
          boxShadow: "0 24px 80px rgba(2, 6, 23, 0.45)",
          background: "rgba(15, 23, 42, 0.78)",
        }}
      >
        <ThreeCubeScene />
      </div>

      <div style={{ maxWidth: 720 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#38bdf8",
          }}
        >
          React Three Fiber • drei • Draco-ready
        </p>
        <h1
          style={{
            margin: "14px 0 12px",
            fontSize: "clamp(2rem, 5vw, 4rem)",
            lineHeight: 1,
            color: "#38bdf8",
          }}
        >
          Quantum Computing
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: 620,
            fontSize: "1.05rem",
            lineHeight: 1.7,
            color: "#cbd5e1",
          }}
        >
          Selection of Stocks involved in Quantum Computing research,
          development, or applications.
        </p>
      </div>
    </>
  );
}
