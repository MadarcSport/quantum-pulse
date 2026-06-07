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
    ...imageConfig,
  };
}

function isLikelyDateLine(line: string) {
  const normalized = line.replace(/\|$/, "").trim();

  if (!normalized) {
    return false;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return true;
  }

  return /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/i.test(
    normalized,
  );
}

function splitIntoBlocks(lines: string[]) {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    blocks.push(current);
  }

  return blocks;
}

function isBulletBlock(lines: string[]) {
  return lines.every((line) => /^[-*]\s+/.test(line));
}

function toBulletItems(lines: string[]) {
  return lines
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

function isLikelyHeadingBlock(lines: string[]) {
  if (lines.length !== 1) {
    return false;
  }

  const line = lines[0];
  const normalized = line.replace(/^#{1,6}\s+/, "").trim();

  if (!normalized || normalized.length > 90) {
    return false;
  }

  if (/^#{1,6}\s+/.test(line)) {
    return true;
  }

  if (/^[a-z]/.test(normalized)) {
    return false;
  }

  if (/[.?!]$/.test(normalized)) {
    return false;
  }

  return true;
}

function parseLegacyStructuredBody(articleBody: string) {
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
    return null;
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
    intro,
    sections,
    conclusion,
  };
}

function parseArticle(slug: string, markdown: string): NewsArticle {
  const { body: parsedBody, imageConfig } = parseFrontmatter(markdown);
  const normalized = parsedBody.replace(/\r\n/g, "\n").trim();
  const rawLines = normalized.split("\n");
  const nonEmptyLineIndices = rawLines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter((entry) => Boolean(entry.line));

  if (nonEmptyLineIndices.length < 1) {
    return createFallbackArticle(slug, normalized, imageConfig);
  }

  const title = nonEmptyLineIndices[0].line;
  const maybeDate = nonEmptyLineIndices[1]?.line ?? "";
  const hasDate = isLikelyDateLine(maybeDate);
  const date = hasDate ? maybeDate.replace(/\|$/, "").trim() : "";

  const bodyStartLineIndex =
    (hasDate ? nonEmptyLineIndices[1]?.index : nonEmptyLineIndices[0].index) +
    1;
  const bodyLines = rawLines.slice(bodyStartLineIndex);
  const blocks = splitIntoBlocks(bodyLines);

  if (blocks.length === 0) {
    return createFallbackArticle(slug, normalized, imageConfig);
  }

  let intro = "";
  const sections: NewsSection[] = [];
  let currentSection: NewsSection | null = null;

  for (const blockLines of blocks) {
    const blockText = blockLines.join(" ").trim();

    if (!blockText) {
      continue;
    }

    if (isLikelyHeadingBlock(blockLines)) {
      const heading = blockText.replace(/^#{1,6}\s+/, "").trim();
      currentSection = {
        heading,
        paragraphs: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (isBulletBlock(blockLines)) {
      const bullets = toBulletItems(blockLines);

      if (bullets.length === 0) {
        continue;
      }

      if (!currentSection) {
        currentSection = {
          heading: "Highlights",
          paragraphs: [],
          bullets: [],
        };
        sections.push(currentSection);
      }

      currentSection.bullets = [...(currentSection.bullets ?? []), ...bullets];
      continue;
    }

    if (!currentSection) {
      intro = intro ? `${intro}\n\n${blockText}` : blockText;
      continue;
    }

    currentSection.paragraphs.push(blockText);
  }

  let conclusion = "";

  if (sections.length > 0) {
    const lastSection = sections[sections.length - 1];
    if (/bottom line|verdict|conclusion/i.test(lastSection.heading)) {
      const paragraphText = lastSection.paragraphs.join(" ").trim();
      const bulletText = (lastSection.bullets ?? []).join(" ").trim();
      conclusion = [paragraphText, bulletText].filter(Boolean).join(" ");
      sections.pop();
    }
  }

  const compactBody = blocks.map((lines) => lines.join(" ").trim()).join(" ");

  if (sections.length === 0) {
    const legacy = parseLegacyStructuredBody(compactBody);
    if (legacy) {
      intro = legacy.intro;
      sections.push(...legacy.sections);
      conclusion = legacy.conclusion;
    }
  }

  const summarySource = intro || compactBody;

  return {
    slug,
    title,
    date,
    intro,
    summary: createSummary(summarySource),
    sections,
    conclusion,
    ...imageConfig,
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

  return articles.sort(
    (left, right) => getArticleTimestamp(right) - getArticleTimestamp(left),
  );
}

function getArticleTimestamp(article: NewsArticle) {
  const normalized = article.date.replace(/\|$/, "").trim();

  if (!normalized) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

export async function getArticleBySlug(slug: string) {
  try {
    const markdown = await readArticleFile(slug);
    return parseArticle(slug, markdown);
  } catch {
    return null;
  }
}
