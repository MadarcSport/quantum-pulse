import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllArticleSlugs, getArticleBySlug } from "@/app/lib/news";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

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
          display: "grid",
          gap: 24,
          border: "1px solid rgba(148, 163, 184, 0.18)",
          borderRadius: 28,
          background:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.96))",
          boxShadow: "0 28px 80px rgba(2, 6, 23, 0.38)",
          padding: "clamp(20px, 4vw, 40px)",
        }}
      >
        <header style={{ display: "grid", gap: 12 }}>
          <p
            style={{
              margin: 0,
              color: "#38bdf8",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Quantum Industry News
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              lineHeight: 1.05,
              color: "#f8fafc",
            }}
          >
            {article.title}
          </h1>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
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
                border: "1px solid rgba(148, 163, 184, 0.18)",
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
            <p style={{ margin: 0, color: "#dbeafe" }}>{article.intro}</p>
          ) : null}

          {article.sections.map((section, index) => (
            <section key={section.heading} style={{ display: "grid", gap: 12 }}>
              <h2 style={{ margin: 0, color: "#f8fafc", fontSize: "1.45rem" }}>
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} style={{ margin: 0, color: "#cbd5e1" }}>
                  {paragraph}
                </p>
              ))}
              {section.bullets?.length ? (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 20,
                    color: "#cbd5e1",
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
                      border: "1px solid rgba(148, 163, 184, 0.18)",
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
                borderTop: "1px solid rgba(148, 163, 184, 0.14)",
              }}
            >
              <h2 style={{ margin: 0, color: "#f8fafc", fontSize: "1.45rem" }}>
                The Bottom Line
              </h2>
              <p style={{ margin: 0, color: "#cbd5e1" }}>
                {article.conclusion}
              </p>
            </section>
          ) : null}
        </div>

        <p
          style={{
            margin: 0,
            color: "#94a3b8",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          For informational purposes only.
        </p>
      </article>
    </main>
  );
}
