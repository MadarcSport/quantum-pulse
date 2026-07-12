import Image from "next/image";
import { EbookBookPreview2 } from "./ebook-book-preview-2";
import { HeroSection3 } from "../components/hero-section-3";
import styles from "./page.module.css";

export default function EbookPage() {
  return (
    <main
      style={{ padding: "32px 24px 48px", maxWidth: 1180, margin: "0 auto" }}
    >
      <HeroSection3
        title="Quantum Ebook"
        description="Explore the ebook preview and learning resources for quantum computing stocks."
      />

      <div className={styles.bannerWrap}>
        <Image
          src="https://res.cloudinary.com/db7i9febj/image/upload/v1783752419/2TRbookCoverMockUp_xceelm.png"
          alt="Quantum ebook preview banner"
          fill
          sizes="100vw"
          className={styles.bannerImage}
          unoptimized
        />
      </div>

      {/* <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 3rem)",
          lineHeight: 1.1,
          margin: 0,
        }}
      >
        Ebook & Ressources ...
      </h1> */}
      {/* <p
        style={{
          marginTop: 16,
          color: "#475569",
          fontSize: "1.05rem",
          lineHeight: 1.6,
        }}
      >
        Welcome to the Ebook page.
      </p> */}
      <EbookBookPreview2 />
    </main>
  );
}
