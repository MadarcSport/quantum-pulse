import Image from "next/image";
import Link from "next/link";
import { getAllArticles } from "../lib/news";
import styles from "./news-preview-section.module.css";

export async function NewsPreviewSection() {
  const articles = await getAllArticles();
  const previewArticles = articles.slice(0, 2);

  return (
    <section className={styles.section} aria-label="News preview">
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.kicker}>News Preview</p>
          <h2 className={styles.title}>Latest Quantum Articles</h2>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.articlesGrid}>
          {previewArticles.length > 0 ? (
            previewArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/news/${article.slug}`}
                className={styles.articleLink}
              >
                <article className={styles.articleCard}>
                  <div className={styles.articleThumb}>
                    {article.thumbnailImageUrl || article.heroImageUrl ? (
                      <Image
                        src={
                          article.thumbnailImageUrl ??
                          article.heroImageUrl ??
                          ""
                        }
                        alt={
                          article.thumbnailImageAlt ??
                          article.heroImageAlt ??
                          `${article.title} thumbnail`
                        }
                        fill
                        sizes="(max-width: 700px) 120px, (max-width: 980px) 100vw, 33vw"
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
                    ) : null}
                  </div>

                  <h3 className={styles.articleTitle}>{article.title}</h3>
                </article>
              </Link>
            ))
          ) : (
            <p className={styles.empty}>No news articles available yet.</p>
          )}
        </div>

        <Link href="/news" className={styles.newsLink}>
          <p className={styles.newsLinkKicker}>Visit News</p>
          <p className={styles.newsLinkTitle}>See all articles</p>
          <p className={styles.newsLinkText}>
            Open the full news page for every story.
          </p>
        </Link>
      </div>
    </section>
  );
}
