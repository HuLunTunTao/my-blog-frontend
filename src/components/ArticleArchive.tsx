import { Link } from "react-router-dom";
import { formatPostTimeInZone, getPostTimeOffsetLabel, getSystemTimeZone } from "@/lib/postTime";

export interface ArticleArchiveData {
  excerpt?: string;
  createdTime?: string;
  publishedTime?: string;
  updatedTime?: string;
  tags: string[];
}

export default function ArticleArchive({ archive }: { archive: ArticleArchiveData }) {
  const timeZone = getSystemTimeZone();
  const times = [
    { label: "创建", value: archive.createdTime },
    { label: "发布", value: archive.publishedTime },
    { label: "更新", value: archive.updatedTime },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  return (
    <section aria-label="文章描述、时间与标签" className="text-left">
      {archive.excerpt && (
        <div className="mb-3">
          <div className="mb-1 font-sans text-[14px] tracking-[0.12em] text-stone-500 dark:text-stone-400">
            描述
          </div>
          <p className="font-serif text-[14px] leading-[1.45] text-stone-700 dark:text-stone-300">
            {archive.excerpt}
          </p>
        </div>
      )}

      <dl className="space-y-1.5">
        {times.map((item) => (
          <div key={item.label} className="grid grid-cols-[2rem_minmax(0,1fr)] items-baseline gap-x-2">
            <dt className="font-sans text-[14px] leading-tight tracking-[0.04em] text-stone-500 dark:text-stone-400">
              {item.label}
            </dt>
            <dd className="min-w-0 leading-none">
              <time
                dateTime={item.value}
                title="原始数据按北京时间解释；仅包含日期的记录按 00:00:00 补齐。"
                className="whitespace-nowrap font-serif text-[14px] leading-tight text-stone-700 dark:text-stone-300"
              >
                {formatPostTimeInZone(item.value, timeZone)} {getPostTimeOffsetLabel(item.value, timeZone)}
              </time>
            </dd>
          </div>
        ))}
      </dl>

      {archive.tags.length > 0 && (
        <div className="mt-3.5">
          <div className="mb-1.5 font-sans text-[14px] leading-tight tracking-[0.12em] text-stone-500 dark:text-stone-400">标签</div>
          <div className="flex flex-wrap gap-1.5">
            {archive.tags.map((tag) => (
              <Link
                key={tag}
                to={`/tags/${encodeURIComponent(tag)}`}
                className="border border-stone-300/70 px-1.5 py-0.5 font-sans text-[14px] text-stone-600 transition-colors hover:border-stone-600 hover:text-stone-900 dark:border-stone-700/70 dark:text-stone-400 dark:hover:border-stone-400 dark:hover:text-stone-100"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
