import { notFound } from "next/navigation";
import { getAllArticleSlugs, getArticleBySlug } from "@/app/lib/news";
import { ArticleReader } from "./article-reader";

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

  return <ArticleReader article={article} />;
}
