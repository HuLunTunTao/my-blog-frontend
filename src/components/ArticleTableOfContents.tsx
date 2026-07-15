import type { TableOfContentsItem } from "@/lib/tableOfContents";
import type { MouseEvent } from "react";
import ArticleArchive, { type ArticleArchiveData } from "./ArticleArchive";

interface ArticleTableOfContentsProps {
  items: TableOfContentsItem[];
  archive: ArticleArchiveData;
}

function jumpToHeading(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const heading = document.getElementById(id);
  if (!heading) return;
  event.preventDefault();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  heading.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  window.history.replaceState(null, "", `#${encodeURIComponent(id)}`);
}

export default function ArticleTableOfContents({ items, archive }: ArticleTableOfContentsProps) {
  const firstSectionIndex = items.findIndex((item) => item.kind === "section");
  const hasHeadingItems = items.some((item) => item.kind !== "section");

  return (
    <aside className="sticky top-28 hidden max-h-[calc(100vh-9rem)] self-start overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[1180px]:block" aria-label="文章目录">
      <div className="border-l border-stone-300/70 py-1 pl-5 dark:border-stone-700/70">
        <ArticleArchive archive={archive} />
        {items.length > 0 && (
          <nav className="mt-6 border-t border-stone-300/60 pt-6 dark:border-stone-700/60">
            <div className="mb-3 font-sans text-[14px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              {hasHeadingItems ? "本文目录" : "页面导航"}
            </div>
            <ol className="space-y-1 font-serif text-[14px] leading-snug text-stone-500 dark:text-stone-400">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  className={[
                    item.level >= 3 ? "pl-3" : "",
                    hasHeadingItems && index === firstSectionIndex
                      ? "mt-3 border-t border-stone-300/60 pt-3 dark:border-stone-700/60"
                      : "",
                  ].filter(Boolean).join(" ") || undefined}
                >
                  <a
                    href={`#${item.id}`}
                    onClick={(event) => jumpToHeading(event, item.id)}
                    className="block border-l border-transparent py-px transition-colors duration-200 hover:text-stone-900 focus-visible:outline-none focus-visible:text-stone-900 dark:hover:text-stone-100 dark:focus-visible:text-stone-100"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </aside>
  );
}
