import Image from "next/image";
import Link from "next/link";
import styles from "./news-preview-section.module.css";

const EBOOK_BANNER_IMAGE_URL =
  "https://res.cloudinary.com/db7i9febj/image/upload/v1783752419/2TRbookCoverMockUp_xceelm.png";

export function EbookPreviewSection() {
  return (
    <section className={styles.section} aria-label="Ebook preview">
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.kicker}>Ebook Preview</p>
          <h2 className={styles.title}>Quantum Ebook</h2>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={`${styles.articlesGrid} ${styles.singleArticleGrid}`}>
          <Link href="/ebook" className={styles.articleLink}>
            <article
              className={`${styles.articleCard} ${styles.imageOnlyArticleCard}`}
            >
              <div className={styles.articleThumb}>
                <Image
                  src={EBOOK_BANNER_IMAGE_URL}
                  alt="Quantum ebook preview banner"
                  fill
                  sizes="(max-width: 700px) 90vw, (max-width: 980px) 100vw, 50vw"
                  style={{ objectFit: "contain" }}
                  unoptimized
                />
              </div>
            </article>
          </Link>
        </div>

        <Link href="/ebook" className={styles.newsLink}>
          <p className={styles.newsLinkKicker}>Visit Ebook</p>
          <p className={styles.newsLinkTitle}>Open the ebook page</p>
          <p className={styles.newsLinkText}>
            See the banner preview and interactive ebook resources.
          </p>
        </Link>
      </div>
    </section>
  );
}
