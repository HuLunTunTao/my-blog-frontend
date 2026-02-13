import { toPostRoute } from "./postSlug";

const OBSIDIAN_EMBED_SCHEME = "obsidian-embed://";
const OBSIDIAN_DETAILS_SCHEME = "obsidian-details://";
const OBSIDIAN_WIDTH_TITLE_PREFIX = "obsidian-width=";

type RefParts = {
  slug: string;
  fragment?: string;
  option?: string;
};

function parseRefParts(raw: string): RefParts {
  const [targetRaw, optionRaw] = raw.split("|", 2);
  const target = (targetRaw || "").trim();
  const [slugRaw, fragmentRaw] = target.split("#", 2);
  return {
    slug: (slugRaw || "").trim(),
    fragment: fragmentRaw ? fragmentRaw.trim() : undefined,
    option: optionRaw ? optionRaw.trim() : undefined,
  };
}

function isImagePath(path: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(path);
}

function normalizeAssetPath(path: string): string {
  return path
    .trim()
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "");
}

function encodeAssetApiPath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");
}

function encodeApiAssetHref(href: string): string {
  const marker = "/api/assets/";
  if (!href.startsWith(marker)) return href;
  const rest = href.slice(marker.length);
  const queryPos = rest.indexOf("?");
  const hashPos = rest.indexOf("#");
  let cut = rest.length;
  if (queryPos >= 0) cut = Math.min(cut, queryPos);
  if (hashPos >= 0) cut = Math.min(cut, hashPos);
  const pathPart = rest.slice(0, cut);
  const suffix = rest.slice(cut);
  return `${marker}${encodeAssetApiPath(pathPart)}${suffix}`;
}

function extractInlineCodeSpan(content: string, start: number): { end: number } | null {
  let run = 0;
  while (content[start + run] === "`") run++;
  const delimiter = "`".repeat(run);
  const closePos = content.indexOf(delimiter, start + run);
  if (closePos === -1) return null;
  return { end: closePos + run };
}

function extractFencedCode(content: string, start: number): { end: number } | null {
  let run = 0;
  while (content[start + run] === "`") run++;
  if (run < 3) return null;
  const atLineStart = start === 0 || content[start - 1] === "\n";
  if (!atLineStart) return null;

  const fence = "`".repeat(run);
  let searchFrom = start + run;
  while (searchFrom < content.length) {
    const candidate = content.indexOf(`\n${fence}`, searchFrom);
    if (candidate === -1) return null;
    let after = candidate + 1 + run;
    while (after < content.length && (content[after] === " " || content[after] === "\t")) after++;
    if (after >= content.length || content[after] === "\n") {
      let end = after;
      if (end < content.length) end++;
      return { end };
    }
    searchFrom = candidate + 1;
  }
  return null;
}

function maskCodeChunks(content: string): { masked: string; chunks: string[] } {
  const chunks: string[] = [];
  let out = "";
  let i = 0;

  const pushChunk = (chunk: string) => {
    const token = `__CODE_CHUNK_${chunks.length}__`;
    chunks.push(chunk);
    out += token;
  };

  while (i < content.length) {
    const tickPos = content.indexOf("`", i);
    if (tickPos === -1) {
      out += content.slice(i);
      break;
    }
    out += content.slice(i, tickPos);

    const fenced = extractFencedCode(content, tickPos);
    if (fenced) {
      pushChunk(content.slice(tickPos, fenced.end));
      i = fenced.end;
      continue;
    }

    const inline = extractInlineCodeSpan(content, tickPos);
    if (inline) {
      pushChunk(content.slice(tickPos, inline.end));
      i = inline.end;
      continue;
    }

    out += "`";
    i = tickPos + 1;
  }

  return { masked: out, chunks };
}

function replaceOutsideCode(content: string, replacer: (text: string) => string): string {
  const { masked, chunks } = maskCodeChunks(content);
  const transformed = replacer(masked);
  return transformed.replace(/__CODE_CHUNK_(\d+)__/g, (_, idx) => chunks[Number(idx)] ?? "");
}

export function removeObsidianComments(content: string): string {
  return replaceOutsideCode(content, (text) => text.replace(/%%[\s\S]*?%%/g, ""));
}

export function convertObsidianEmbeds(content: string): string {
  return replaceOutsideCode(content, (text) =>
    text.replace(/!\[\[([^\]]+)\]\]/g, (_, inner: string) => {
      const ref = parseRefParts(inner);
      if (!ref.slug) return "";

      if (isImagePath(ref.slug)) {
        const assetPath = normalizeAssetPath(ref.slug);
        const alt = assetPath.split("/").pop() || "image";
        const encodedHref = `/api/assets/${encodeAssetApiPath(assetPath)}`;
        const width = ref.option && /^\d+(?:px)?$/i.test(ref.option) ? parseInt(ref.option, 10) : undefined;
        if (width && width > 0) {
          return `![${alt}](${encodedHref} "${OBSIDIAN_WIDTH_TITLE_PREFIX}${width}")`;
        }
        return `![${alt}](${encodedHref})`;
      }

      return `[嵌入引用](${OBSIDIAN_EMBED_SCHEME}${encodeURIComponent(inner.trim())})`;
    }),
  );
}

export function normalizeApiAssetMarkdownLinks(content: string): string {
  return replaceOutsideCode(content, (text) =>
    text.replace(/(!?\[[^\]]*\]\()([^)\n]+)(\))/g, (whole, prefix: string, destinationRaw: string, suffix: string) => {
      let destination = destinationRaw.trim();
      let titlePart = "";

      // Keep optional markdown title (e.g. "... \"obsidian-width=560\"") untouched.
      if (destination.endsWith(`"`)) {
        const splitPos = destination.lastIndexOf(` "`);
        if (splitPos > 0) {
          titlePart = destination.slice(splitPos);
          destination = destination.slice(0, splitPos);
        }
      }

      if (!destination.startsWith("/api/assets/")) {
        return whole;
      }

      const encoded = encodeApiAssetHref(destination);
      return `${prefix}${encoded}${titlePart}${suffix}`;
    }),
  );
}

type DetailsBlock = {
  summary: string;
  body: string;
};

function encodeDetailsBlock(payload: DetailsBlock): string {
  return `${OBSIDIAN_DETAILS_SCHEME}${encodeURIComponent(JSON.stringify(payload))}`;
}

function extractSummaryText(raw: string): string {
  return raw.replace(/<[^>]+>/g, "").trim();
}

export function convertHtmlDetailsBlocks(content: string): string {
  return replaceOutsideCode(content, (text) =>
    text.replace(/<details\b[^>]*>([\s\S]*?)<\/details>/gi, (full, inner: string) => {
      const summaryMatch = /<summary\b[^>]*>([\s\S]*?)<\/summary>/i.exec(inner);
      if (!summaryMatch) return full;

      const summary = extractSummaryText(summaryMatch[1]);
      const body = inner.replace(summaryMatch[0], "").trim();
      if (!summary || !body) return full;

      const href = encodeDetailsBlock({ summary, body });
      return `[${summary}](${href})`;
    }),
  );
}

export function parseWikiLinks(content: string): string {
  return replaceOutsideCode(content, (text) =>
    text.replace(/(?<!!)\[\[([^\]]+)\]\]/g, (_, inner: string) => {
      const [targetRaw, aliasRaw] = inner.split("|", 2);
      const target = (targetRaw || "").trim();
      const alias = (aliasRaw || "").trim();
      if (!target) return "";

      const [slugRaw, fragmentRaw] = target.split("#", 2);
      const slug = slugRaw.trim();
      if (!slug) return alias || "";

      const display = alias || slug.split("/").pop() || slug;
      let href = toPostRoute(slug);
      if (fragmentRaw) {
        const fragment = fragmentRaw.trim();
        const params = new URLSearchParams();
        if (fragment.startsWith("^")) {
          params.set("block", fragment.slice(1));
        } else {
          params.set("heading", fragment);
        }
        href += `?${params.toString()}`;
      }
      return `[${display}](${href})`;
    }),
  );
}

export function parseHashTags(content: string): string {
  return replaceOutsideCode(content, (text) =>
    text.replace(/(^|\s|>)#([a-zA-Z0-9\u4e00-\u9fa5]+)/g, (_, prefix: string, tag: string) => {
      return `${prefix}[#${tag}](/tags/${tag})`;
    }),
  );
}

function applyObsidianLineBreaks(content: string): string {
  return replaceOutsideCode(content, (text) => {
    const lines = text.split("\n");
    for (let i = 0; i < lines.length - 1; i++) {
      const curr = lines[i];
      const next = lines[i + 1];
      // Obsidian with non-strict line breaks keeps single newline visible.
      if (curr.trim() === "" || next.trim() === "") continue;
      if (curr.endsWith("  ")) continue;
      lines[i] = `${curr}  `;
    }
    return lines.join("\n");
  });
}

export function preprocessMarkdown(content: string): string {
  const noComments = removeObsidianComments(content);
  const withEmbeds = convertObsidianEmbeds(noComments);
  const withDetails = convertHtmlDetailsBlocks(withEmbeds);
  const withLinks = parseWikiLinks(withDetails);
  const normalizedAssets = normalizeApiAssetMarkdownLinks(withLinks);
  const withObsidianBreaks = applyObsidianLineBreaks(normalizedAssets);
  return parseHashTags(withObsidianBreaks);
}

export function isObsidianEmbedHref(href?: string): boolean {
  return Boolean(href && href.startsWith(OBSIDIAN_EMBED_SCHEME));
}

export function decodeObsidianEmbedHref(href: string): string {
  return decodeURIComponent(href.replace(OBSIDIAN_EMBED_SCHEME, ""));
}

export function isObsidianDetailsHref(href?: string): boolean {
  return Boolean(href && href.startsWith(OBSIDIAN_DETAILS_SCHEME));
}

export function decodeObsidianDetailsHref(href: string): DetailsBlock | null {
  try {
    const decoded = decodeURIComponent(href.replace(OBSIDIAN_DETAILS_SCHEME, ""));
    const parsed = JSON.parse(decoded) as Partial<DetailsBlock>;
    if (!parsed.summary || !parsed.body) return null;
    return {
      summary: parsed.summary,
      body: parsed.body,
    };
  } catch {
    return null;
  }
}

export function getImageWidthFromTitle(title?: string): number | null {
  if (!title || !title.startsWith(OBSIDIAN_WIDTH_TITLE_PREFIX)) return null;
  const value = parseInt(title.slice(OBSIDIAN_WIDTH_TITLE_PREFIX.length), 10);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function parseObsidianRef(raw: string): RefParts {
  return parseRefParts(raw);
}

function stripBlockIdSuffix(line: string): string {
  return line.replace(/\s+\^[A-Za-z0-9_-]+\s*$/, "").trim();
}

function headingLevel(line: string): number {
  const m = /^(#{1,6})\s+/.exec(line);
  return m ? m[1].length : 0;
}

function extractByHeading(content: string, heading: string): string {
  const target = heading.trim().toLowerCase();
  if (!target) return "";
  const lines = content.split("\n");
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const lv = headingLevel(lines[i]);
    if (lv === 0) continue;
    const text = stripBlockIdSuffix(lines[i].replace(/^#{1,6}\s+/, "")).toLowerCase();
    if (text === target) {
      start = i;
      level = lv;
      break;
    }
  }
  if (start === -1) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const lv = headingLevel(lines[i]);
    if (lv > 0 && lv <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}

function extractByBlockId(content: string, blockId: string): string {
  const id = blockId.replace(/^\^/, "").trim();
  if (!id) return "";
  const lines = content.split("\n");
  const mark = `^${id}`;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes(mark)) continue;
    const lv = headingLevel(lines[i]);
    if (lv > 0) {
      let end = lines.length;
      for (let j = i + 1; j < lines.length; j++) {
        const nl = headingLevel(lines[j]);
        if (nl > 0 && nl <= lv) {
          end = j;
          break;
        }
      }
      return lines.slice(i, end).join("\n").trim();
    }

    let start = i;
    while (start > 0 && lines[start - 1].trim() !== "") start--;
    let end = i + 1;
    while (end < lines.length && lines[end].trim() !== "") end++;
    return lines.slice(start, end).join("\n").trim();
  }
  return "";
}

export function extractObsidianFragment(content: string, fragment?: string): string {
  if (!fragment) return content;
  if (fragment.startsWith("^")) {
    return extractByBlockId(content, fragment) || "";
  }
  return extractByHeading(content, fragment) || "";
}
