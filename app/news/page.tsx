import Image from "next/image";
import Link from "next/link";
import { getAllArticles } from "@/app/lib/news";
import styles from "./page.module.css";

export default async function NewsPage() {
  const articles = await getAllArticles();

  return (
    <main className={styles.pageRoot}>
      <section className={styles.pageShell}>
        <header className={styles.pageHeader}>
          <p className={styles.kicker}>Quantum Industry News</p>
          <h1 className={styles.heading}>Latest News In Quantum Computing</h1>
          <p className={styles.description}>
            Browse article pages generated from markdown files. Add a new
            article in this folder and the index can pick it up without turning
            the page into a one-off layout again.
          </p>
        </header>

        <div className={styles.newsGrid}>
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/news/${article.slug}`}
              className={styles.cardLink}
            >
              <article className={styles.card}>
                <div className={styles.thumbnailWrap}>
                  {article.thumbnailImageUrl || article.heroImageUrl ? (
                    <Image
                      src={
                        article.thumbnailImageUrl ?? article.heroImageUrl ?? ""
                      }
                      alt={
                        article.thumbnailImageAlt ??
                        article.heroImageAlt ??
                        `${article.title} thumbnail`
                      }
                      fill
                      sizes="(max-width: 800px) 100vw, 50vw"
                      className={styles.thumbnailImage}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.thumbnailFallback}>
                      {article.title}
                    </div>
                  )}
                </div>

                <div className={styles.cardHeader}>
                  <p className={styles.cardDate}>{article.date || "Undated"}</p>
                  <h2 className={styles.cardTitle}>{article.title}</h2>
                </div>

                <p className={styles.cardIntro}>{article.summary}</p>

                <p className={styles.cardCta}>Read article</p>
              </article>
            </Link>
          ))}
        </div>

        <section className={styles.infoBox}>
          <h2 className={styles.infoTitle}>Adding More Articles</h2>
          <p className={styles.infoText}>
            Add another markdown file in the news folder, such as
            <span className={styles.inlineCode}> article02.md</span>. You can
            optionally add image metadata in a frontmatter block:
            <span className={styles.inlineCode}>
              {" "}
              thumbnailImageUrl, thumbnailImageAlt, heroImageUrl, heroImageAlt,
              inlineImageUrl, inlineImageAlt
            </span>
            .
          </p>
        </section>

        <p className={styles.disclaimer}>For informational purposes only.</p>
      </section>
    </main>
  );
}
