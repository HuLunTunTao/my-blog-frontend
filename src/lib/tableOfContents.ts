export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
  kind?: "heading" | "section";
}

type HastNode = {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function plainHeadingText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_~`]/g, "")
    .replace(/\s+\^[\w-]+\s*$/, "")
    .trim();
}

function headingIdBase(value: string): string {
  return plainHeadingText(value)
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function uniqueHeadingId(base: string, seen: Map<string, number>): string {
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

export function extractTableOfContents(markdown: string): TableOfContentsItem[] {
  const headings: TableOfContentsItem[] = [];
  const seen = new Map<string, number>();
  let fenceMarker = "";

  for (const line of markdown.split("\n")) {
    const fence = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fence) {
      const marker = fence[1][0];
      if (!fenceMarker) fenceMarker = marker;
      else if (fenceMarker === marker) fenceMarker = "";
      continue;
    }
    if (fenceMarker) continue;

    const match = /^\s{0,3}(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/.exec(line);
    if (!match) continue;
    const level = match[1].length;
    const text = plainHeadingText(match[2]);
    if (!text) continue;
    headings.push({ id: uniqueHeadingId(headingIdBase(text), seen), text, level });
  }

  return headings;
}

function hastText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(hastText).join("");
}

export function rehypeHeadingIds() {
  return (tree: HastNode) => {
    const seen = new Map<string, number>();

    const visit = (node: HastNode) => {
      if (/^h[1-6]$/.test(node.tagName ?? "")) {
        const id = uniqueHeadingId(headingIdBase(hastText(node)), seen);
        node.properties = { ...(node.properties ?? {}), id };
      }
      node.children?.forEach(visit);
    };

    visit(tree);
  };
}
