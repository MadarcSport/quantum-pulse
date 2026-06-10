import Link from "next/link";

export function SiteFooter() {
  return (
    <footer
      style={{
        marginTop: 28,
        borderTop: "1px solid rgba(148, 163, 184, 0.16)",
        background: "rgba(2, 6, 23, 0.78)",
      }}
    >
      <div
        style={{
          width: "min(1120px, calc(100% - 32px))",
          margin: "0 auto",
          minHeight: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Link
          href="/privacy"
          style={{
            color: "#cbd5e1",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
