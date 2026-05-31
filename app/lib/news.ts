import { promises as fs } from "node:fs";
import path from "node:path";

export type NewsSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type NewsArticle = {
  slug: string;
  title: string;
  date: string;
  intro: string;
  summary: string;
  sections: NewsSection[];
  conclusion: string;
  thumbnailImageUrl?: string;
  thumbnailImageAlt?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  inlineImageUrl?: string;
  inlineImageAlt?: string;
};

type NewsImageConfig = {
  thumbnailImageUrl?: string;
  thumbnailImageAlt?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  inlineImageUrl?: string;
  inlineImageAlt?: string;
};

const ARTICLE_IMAGE_CONFIG: Record<string, NewsImageConfig> = {
  article01: {
    thumbnailImageUrl:
      "https://gitlab.com/madarc-sport/quantum-pulse/-/raw/main/arti001.png?ref_type=heads",
    thumbnailImageAlt:
      "Photonic chip concept illustrating portable quantum computing",
    heroImageUrl:
      "https://gitlab.com/madarc-sport/quantum-pulse/-/raw/main/arti001.png?ref_type=heads",
    heroImageAlt:
      "Photonic chip concept illustrating portable quantum computing",
    inlineImageUrl:
      "https://gitlab.com/madarc-sport/quantum-pulse/-/raw/main/arti001bis.png",
    inlineImageAlt: "Quantum hardware miniaturization illustration",
  },
};

function getNewsDirectory() {
  return path.join(process.cwd(), "app", "news");
}

function parseFrontmatter(markdown: string) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  if (lines[0]?.trim() !== "---") {
    return {
      body: normalized.trim(),
      imageConfig: undefined,
    };
  }

  const endIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---",
  );

  if (endIndex === -1) {
    return {
      body: normalized.trim(),
      imageConfig: undefined,
    };
  }

  const imageConfig: NewsImageConfig = {};
  const frontmatterLines = lines.slice(1, endIndex);

  for (const rawLine of frontmatterLines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (!value) {
      continue;
    }

    if (
      key === "thumbnailImageUrl" ||
      key === "thumbnailImageAlt" ||
      key === "heroImageUrl" ||
      key === "heroImageAlt" ||
      key === "inlineImageUrl" ||
      key === "inlineImageAlt"
    ) {
      imageConfig[key] = value;
    }
  }

  return {
    body: lines
      .slice(endIndex + 1)
      .join("\n")
      .trim(),
    imageConfig: Object.keys(imageConfig).length ? imageConfig : undefined,
  };
}

function mergeImageConfig(slug: string, imageConfig?: NewsImageConfig) {
  return {
    ...ARTICLE_IMAGE_CONFIG[slug],
    ...imageConfig,
  };
}

function createSummary(text: string, maxLength = 260) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const chunk = normalized.slice(0, maxLength + 1);
  const sentenceEnd = Math.max(
    chunk.lastIndexOf(". "),
    chunk.lastIndexOf("! "),
    chunk.lastIndexOf("? "),
  );

  if (sentenceEnd > maxLength * 0.55) {
    return chunk.slice(0, sentenceEnd + 1).trim();
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function createFallbackArticle(
  slug: string,
  markdown: string,
  imageConfig?: NewsImageConfig,
): NewsArticle {
  const normalizedMarkdown = markdown.trim();

  return {
    slug,
    title: slug,
    date: "",
    intro: normalizedMarkdown,
    summary: createSummary(normalizedMarkdown),
    sections: [],
    conclusion: "",
    ...mergeImageConfig(slug, imageConfig),
  };
}

function parseArticle(slug: string, markdown: string): NewsArticle {
  const { body: parsedBody, imageConfig } = parseFrontmatter(markdown);
  const normalized = parsedBody.trim();
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return createFallbackArticle(slug, normalized, imageConfig);
  }

  const title = lines[0];
  const date = lines[1].replace(/\|$/, "").trim();
  const articleBody = lines.slice(2).join(" ");

  const headingMatches = [
    "The Long-Standing Limitation: Quantum Tech’s Bulk",
    "The Game-Changer: Card-Sized Photonic Chips",
    "What This Means for the Future",
    "The Second Quantum Revolution Is Underway",
    "The Bottom Line",
  ];

  const firstHeadingIndex = headingMatches.reduce((lowest, heading) => {
    const index = articleBody.indexOf(heading);
    if (index === -1) {
      return lowest;
    }

    return lowest === -1 ? index : Math.min(lowest, index);
  }, -1);

  if (firstHeadingIndex === -1) {
    return {
      slug,
      title,
      date,
      intro: articleBody,
      summary: createSummary(articleBody),
      sections: [],
      conclusion: "",
      ...mergeImageConfig(slug, imageConfig),
    };
  }

  const intro = articleBody.slice(0, firstHeadingIndex).trim();
  const sections: NewsSection[] = [];

  for (let i = 0; i < headingMatches.length - 1; i += 1) {
    const heading = headingMatches[i];
    const nextHeading = headingMatches[i + 1];
    const startIndex = articleBody.indexOf(heading);
    const endIndex = articleBody.indexOf(nextHeading);

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      continue;
    }

    const content = articleBody
      .slice(startIndex + heading.length, endIndex)
      .trim();

    if (heading === "What This Means for the Future") {
      const bulletParts = content
        .split(/-\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
      const lead = bulletParts.shift() ?? "";

      sections.push({
        heading,
        paragraphs: lead ? [lead] : [],
        bullets: bulletParts,
      });
      continue;
    }

    sections.push({
      heading,
      paragraphs: content ? [content] : [],
    });
  }

  const bottomLineIndex = articleBody.indexOf("The Bottom Line");
  const conclusion =
    bottomLineIndex === -1
      ? ""
      : articleBody.slice(bottomLineIndex + "The Bottom Line".length).trim();

  return {
    slug,
    title,
    date,
    intro,
    summary: createSummary(intro),
    sections,
    conclusion,
    ...mergeImageConfig(slug, imageConfig),
  };
}

async function readArticleFile(slug: string) {
  const articlePath = path.join(getNewsDirectory(), `${slug}.md`);
  return fs.readFile(articlePath, "utf8");
}

export async function getAllArticleSlugs() {
  const entries = await fs.readdir(getNewsDirectory(), { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name.replace(/\.md$/, ""))
    .sort();
}

export async function getAllArticles() {
  const slugs = await getAllArticleSlugs();
  const articles = await Promise.all(
    slugs.map(async (slug) => {
      const markdown = await readArticleFile(slug);
      return parseArticle(slug, markdown);
    }),
  );

  return articles.sort((left, right) =>
    right.date.localeCompare(left.date, "en-US"),
  );
}

export async function getArticleBySlug(slug: string) {
  try {
    const markdown = await readArticleFile(slug);
    return parseArticle(slug, markdown);
  } catch {
    return null;
  }
}
