import { EbookBookPreview } from "./ebook-book-preview";

export default function EbookPage() {
  return (
    <main style={{ padding: "48px 24px", maxWidth: 1180, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 3rem)",
          lineHeight: 1.1,
          margin: 0,
        }}
      >
        Ebook and ressources.
      </h1>
      <p
        style={{
          marginTop: 16,
          color: "#475569",
          fontSize: "1.05rem",
          lineHeight: 1.6,
        }}
      >
        Welcome to the Ebook page.
      </p>
      <EbookBookPreview />
    </main>
  );
}
