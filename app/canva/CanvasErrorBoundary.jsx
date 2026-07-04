"use client";

import React from "react";

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof Event !== "undefined" && error instanceof Event) {
    return "3D asset failed to load.";
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return "Unexpected 3D runtime error.";
}

export default class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    // Keep the original object in logs to preserve debugging detail.
    console.error("[canva] Canvas render failed", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          style={{
            background: "#060a1a",
            border: "1px solid rgba(248, 113, 113, 0.35)",
            borderRadius: "8px",
            color: "#fecaca",
            display: "grid",
            fontSize: "14px",
            height: "100%",
            placeItems: "center",
            width: "100%",
            padding: "12px",
            textAlign: "center",
          }}
        >
          {getErrorMessage(this.state.error)}
        </div>
      );
    }

    return this.props.children;
  }
}
