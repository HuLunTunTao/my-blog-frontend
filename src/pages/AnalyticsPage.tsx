import {
  addIgnoredIp,
  adminLogin,
  deleteIgnoredIp,
  getAnalytics,
  type AnalyticsPostStat,
  type AnalyticsResponse,
  type AnalyticsTimeBucket,
  type IgnoredIPEntry,
} from "@/lib/api";
import { clearAdminSession, loadAdminSession, saveAdminSession, type AdminSession } from "@/lib/adminSession";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { lazy, Suspense, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, LogOut, RefreshCw, Trash2 } from "lucide-react";
import { usePageMeta } from "@/lib/pageMeta";

type FilterState = {
  slug: string;
  ip: string;
  from: string;
  to: string;
  excludeIgnored: boolean;
};

type PostSortKey = "successfulReads" | "totalRequests" | "failedReads" | "uniqueIps" | "latestAccessAt" | "title";
type IPSortKey = "totalRequests" | "successfulReads" | "failedReads" | "uniquePosts" | "lastSeenAt" | "ip";
type SortDirection = "asc" | "desc";

const defaultFilters: FilterState = {
  slug: "",
  ip: "",
  from: format(subDays(new Date(), 30), "yyyy-MM-dd'T'00:00"),
  to: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  excludeIgnored: true,
};

const RANGE_PRESETS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

const PAGE_SIZE = 10;
const AnalyticsGeoMapsSection = lazy(() => import("@/components/AnalyticsGeoMaps"));

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "yyyy-MM-dd HH:mm");
}

function toDateTimeLocalValue(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function ScrollTitle({ title, slug }: { title: string; slug: string }) {
  return (
    <div className="flex min-h-[4.75rem] w-[18rem] max-w-[18rem] flex-col justify-between border border-stone-200 dark:border-stone-700/60 bg-stone-50/80 dark:bg-stone-900/40 px-3 py-2">
      <div className="overflow-x-auto whitespace-nowrap text-sm font-medium text-stone-900 dark:text-stone-100 themed-scrollbar">{title}</div>
      <div className="mt-1 overflow-x-auto whitespace-nowrap font-mono text-[11px] text-stone-500 dark:text-stone-400 themed-scrollbar">{slug}</div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="border border-border bg-paper p-5">
      <div className="text-[11px] uppercase tracking-[0.2em] text-subtle">{label}</div>
      <div className="mt-3 text-3xl font-serif text-foreground">{value}</div>
      <div className="mt-2 text-sm text-muted">{hint}</div>
    </div>
  );
}

function Panel({ title, subtitle, action, children, className }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("border border-border bg-paper p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-serif text-stone-900 dark:text-stone-100">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function LineChart({ data, lines }: { data: AnalyticsTimeBucket[]; lines: Array<{ key: "totalRequests" | "successfulReads" | "failedReads"; color: string; label: string }> }) {
  const width = 720;
  const height = 240;
  const padding = 24;
  const maxValue = Math.max(1, ...data.flatMap((item) => lines.map((line) => item[line.key])));
  const pointsFor = (key: "totalRequests" | "successfulReads" | "failedReads") =>
    data
      .map((item, index) => {
        const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
        const y = height - padding - (item[key] / maxValue) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
        {lines.map((line) => (
          <div key={line.key} className="flex items-center gap-2">
            <span className="h-2 w-2" style={{ backgroundColor: line.color }} />
            {line.label}
          </div>
        ))}
      </div>
      <div className="overflow-x-auto themed-scrollbar">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[640px]">
          {[0.25, 0.5, 0.75].map((step) => {
            const y = height - padding - step * (height - padding * 2);
            return <line key={step} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e7e5e4" strokeDasharray="4 6" />;
          })}
          {lines.map((line) => (
            <polyline
              key={line.key}
              fill="none"
              stroke={line.color}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={pointsFor(line.key)}
            />
          ))}
          {data.map((item, index) => {
            const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
            return (
              <text key={item.label} x={x} y={height - 4} textAnchor="middle" className="fill-stone-400 dark:fill-stone-500 text-[10px]">
                {item.label.slice(5)}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string | number | boolean | null | undefined) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function analyticsToCsv(stats: AnalyticsResponse) {
  const sections: string[] = [];
  sections.push("overview");
  sections.push("metric,value");
  Object.entries(stats.overview).forEach(([key, value]) => {
    sections.push(`${csvEscape(key)},${csvEscape(value)}`);
  });

  sections.push("");
  sections.push("posts");
  sections.push("slug,title,path,totalRequests,successfulReads,failedReads,uniqueIps,latestAccessAt");
  stats.posts.forEach((post) => {
    sections.push(
      [
        post.slug,
        post.title,
        post.path,
        post.totalRequests,
        post.successfulReads,
        post.failedReads,
        post.uniqueIps,
        post.latestAccessAt ?? "",
      ].map(csvEscape).join(","),
    );
  });

  sections.push("");
  sections.push("ips");
  sections.push("ip,totalRequests,successfulReads,failedReads,uniquePosts,lastSeenAt,topPosts");
  stats.ips.forEach((ip) => {
    sections.push(
      [
        ip.ip,
        ip.totalRequests,
        ip.successfulReads,
        ip.failedReads,
        ip.uniquePosts,
        ip.lastSeenAt ?? "",
        (ip.topPosts ?? []).join(" | "),
      ].map(csvEscape).join(","),
    );
  });

  sections.push("");
  sections.push("daily");
  sections.push("label,totalRequests,successfulReads,failedReads");
  stats.daily.forEach((item) => {
    sections.push([item.label, item.totalRequests, item.successfulReads, item.failedReads].map(csvEscape).join(","));
  });

  return sections.join("\n");
}

function sortPosts(items: AnalyticsPostStat[], key: PostSortKey, direction: SortDirection) {
  const sorted = [...items].sort((a, b) => {
    const multiplier = direction === "asc" ? 1 : -1;
    switch (key) {
      case "title":
        return multiplier * a.title.localeCompare(b.title);
      case "latestAccessAt":
        return multiplier * ((new Date(a.latestAccessAt ?? 0).getTime() || 0) - (new Date(b.latestAccessAt ?? 0).getTime() || 0));
      default:
        return multiplier * ((a[key] ?? 0) - (b[key] ?? 0));
    }
  });
  return sorted;
}

function sortIps(items: AnalyticsResponse["ips"], key: IPSortKey, direction: SortDirection) {
  const sorted = [...items].sort((a, b) => {
    const multiplier = direction === "asc" ? 1 : -1;
    switch (key) {
      case "ip":
        return multiplier * a.ip.localeCompare(b.ip);
      case "lastSeenAt":
        return multiplier * ((new Date(a.lastSeenAt ?? 0).getTime() || 0) - (new Date(b.lastSeenAt ?? 0).getTime() || 0));
      default:
        return multiplier * ((a[key] ?? 0) - (b[key] ?? 0));
    }
  });
  return sorted;
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
  };
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <button type="button" onClick={onClick} className={cn("inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em]", active ? "text-stone-900 dark:text-stone-100" : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200")}>
      {label}
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-stone-500 dark:text-stone-400">
      <span>Page {page} / {totalPages}</span>
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} className="border border-stone-300 dark:border-stone-600/60 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-stone-600 dark:text-stone-300 disabled:opacity-40">
          Prev
        </button>
        <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} className="border border-stone-300 dark:border-stone-600/60 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-stone-600 dark:text-stone-300 disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  );
}

function AnalyticsMapsLoading() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {["Global IP Origins", "China Region Origins"].map((title) => (
        <section key={title} className="border border-border bg-paper p-5">
          <div className="mb-4">
            <h2 className="text-lg font-serif text-stone-900 dark:text-stone-100">{title}</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Loading geo visualization...</p>
          </div>
          <div className="h-[420px] animate-pulse border border-stone-200 dark:border-stone-700/60 bg-stone-100/80 dark:bg-stone-800/60" />
        </section>
      ))}
    </div>
  );
}

function FilterBadge({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <div className="inline-flex min-h-[2.25rem] min-w-[14rem] items-center gap-2 border border-stone-300 dark:border-stone-600/60 bg-white dark:bg-stone-900/60 px-3 py-1.5 text-xs text-stone-700 dark:text-stone-200">
      <span className="uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">{label}</span>
      <span className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[11px] themed-scrollbar">{value}</span>
      <button type="button" onClick={onClear} className="border-l border-stone-200 dark:border-stone-700/60 pl-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100">
        clear
      </button>
    </div>
  );
}

function InlineCopyButton({ text }: { text: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy text", error);
    }
  };

  return (
    <button type="button" onClick={() => void handleCopy()} className="border border-stone-300 dark:border-stone-600/60 bg-white dark:bg-stone-900/60 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60">
      copy
    </button>
  );
}

function FilterBadgeSlot({
  active,
  label,
  value,
  onClear,
}: {
  active: boolean;
  label: string;
  value: string;
  onClear: () => void;
}) {
  return (
    <div className="min-h-[2.25rem] min-w-[14rem]">
      {active ? <FilterBadge label={label} value={value} onClear={onClear} /> : <div className="h-[2.25rem] border border-transparent" />}
    </div>
  );
}

function HorizontalBarChart({ items }: { items: AnalyticsPostStat[] }) {
  const maxValue = Math.max(1, ...items.map((item) => item.successfulReads));
  return (
    <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 themed-scrollbar">
      {items.length === 0 ? <div className="text-sm text-stone-500 dark:text-stone-400">No recent hot posts.</div> : null}
      {items.map((item) => (
        <div key={item.slug} className="border border-stone-200 dark:border-stone-700/60 bg-stone-50/70 dark:bg-stone-900/40 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-900/60 px-3 py-2">
              <div className="overflow-x-auto whitespace-nowrap text-sm font-medium text-stone-900 dark:text-stone-100 themed-scrollbar">{item.title}</div>
              <div className="mt-1 overflow-x-auto whitespace-nowrap font-mono text-[11px] text-stone-500 dark:text-stone-400 themed-scrollbar">{item.slug}</div>
            </div>
            <div className="w-20 border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-900/60 px-2 py-2 text-right">
              <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Reads</div>
              <div className="mt-1 text-lg font-serif text-stone-900 dark:text-stone-100">{item.successfulReads}</div>
            </div>
          </div>
          <div className="mt-2 border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-900/60 p-2">
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              <span>Heat</span>
              <span>{item.totalRequests} requests</span>
            </div>
            <div className="h-2 bg-stone-100 dark:bg-stone-800/60">
              <div className="h-full bg-gradient-to-r from-stone-900 via-amber-700 to-amber-500" style={{ width: `${(item.successfulReads / maxValue) * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto themed-scrollbar">
      <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-700 text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-[0.24em] text-stone-500 dark:text-stone-400">
            {columns.map((column) => (
              <th key={column} className="px-3 py-3 font-medium">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-stone-500 dark:text-stone-400">No data</td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="align-top">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-3 text-stone-700 dark:text-stone-200">{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function LoginPanel({ onSubmit, loading, error }: { onSubmit: (password: string) => Promise<void>; loading: boolean; error: string }) {
  const [password, setPassword] = useState("");
  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-3xl font-serif text-foreground">访问统计</h1>
      <p className="mt-3 text-sm leading-7 text-muted">
        输入管理密码后查看阅读量、来源和地域。会话在令牌过期前保持有效。
      </p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(password);
        }}
      >
        <label className="block space-y-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-subtle">Admin Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border border-border bg-paper px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground"
            placeholder="Enter password"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-foreground px-4 py-3 text-sm uppercase tracking-[0.2em] text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing In..." : "登录"}
        </button>
        {error ? <p className="text-sm text-muted">{error}</p> : null}
      </form>
    </section>
  );
}

type PaginatedResult<T> = {
  items: T[];
  page: number;
  totalPages: number;
};

interface AnalyticsOverviewProps {
  stats: AnalyticsResponse | null;
  filters: FilterState;
  setFilters: Dispatch<SetStateAction<FilterState>>;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onResetFilters: () => void;
  onApplyRangePreset: (days: number) => void;
  onClearSlugFilter: () => void;
  onClearIpFilter: () => void;
  ignoredIp: string;
  setIgnoredIp: (value: string) => void;
  ignoredLabel: string;
  setIgnoredLabel: (value: string) => void;
  ignoredIps: IgnoredIPEntry[];
  onAddIgnoredIp: () => Promise<void>;
  onDeleteIgnoredIp: (ip: string) => Promise<void>;
}

function AnalyticsOverview(props: AnalyticsOverviewProps) {
  const {
    stats, filters, setFilters, loading, onRefresh, onResetFilters, onApplyRangePreset,
    onClearSlugFilter, onClearIpFilter, ignoredIp, setIgnoredIp, ignoredLabel,
    setIgnoredLabel, ignoredIps, onAddIgnoredIp, onDeleteIgnoredIp,
  } = props;

  return (
    <>
      <section className="grid gap-4 xl:grid-cols-5">
        <MetricCard label="Requests" value={stats?.overview.totalRequests ?? 0} hint="Raw access attempts in current range" />
        <MetricCard label="Reads" value={stats?.overview.successfulReads ?? 0} hint="Successful article reads" />
        <MetricCard label="Ignored Traffic" value={stats?.overview.ignoredRequests ?? 0} hint="Requests from your saved IPs" />
        <MetricCard label="Filtered IPs" value={stats?.overview.filteredUniqueIps ?? 0} hint="Unique IPs after filtering" />
        <MetricCard label="24h Reads" value={stats?.overview.successfulLast24 ?? 0} hint="Successful reads in last 24 hours" />
      </section>

      <Panel
        title="Filters"
        subtitle="Ignored self-IP traffic is excluded by default."
        action={<div className="border border-border bg-paper px-3 py-1 text-xs text-subtle">Generated {formatDateTime(stats?.generatedAt)}</div>}
      >
        <div className="grid gap-4 lg:grid-cols-5">
          <label className="space-y-2 text-sm">
            <span className="block text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">Post Slug</span>
            <input value={filters.slug} onChange={(event) => setFilters((current) => ({ ...current, slug: event.target.value }))} className="w-full border border-stone-300 dark:border-stone-600/60 bg-stone-50/60 dark:bg-stone-900/40 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-500 dark:focus:ring-stone-400" placeholder="folder/post" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="block text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">IP</span>
            <input value={filters.ip} onChange={(event) => setFilters((current) => ({ ...current, ip: event.target.value }))} className="w-full border border-stone-300 dark:border-stone-600/60 bg-stone-50/60 dark:bg-stone-900/40 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-500 dark:focus:ring-stone-400" placeholder="203.0.113.8" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="block text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">From</span>
            <input type="datetime-local" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} className="w-full border border-stone-300 dark:border-stone-600/60 bg-stone-50/60 dark:bg-stone-900/40 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-500 dark:focus:ring-stone-400" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="block text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">To</span>
            <input type="datetime-local" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} className="w-full border border-stone-300 dark:border-stone-600/60 bg-stone-50/60 dark:bg-stone-900/40 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-500 dark:focus:ring-stone-400" />
          </label>
          <div className="flex flex-col justify-between gap-3">
            <label className="flex items-center gap-3 border border-border bg-paper px-3 py-3 text-sm text-foreground">
              <input type="checkbox" checked={filters.excludeIgnored} onChange={(event) => setFilters((current) => ({ ...current, excludeIgnored: event.target.checked }))} className="h-4 w-4 accent-stone-900 dark:accent-stone-100" />
              Exclude ignored IPs
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => void onRefresh()} className="bg-stone-900 dark:bg-stone-100 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-300" disabled={loading}>Apply</button>
              <button type="button" onClick={onResetFilters} className="border border-stone-300 dark:border-stone-600/60 bg-white dark:bg-stone-900/60 px-4 py-2 text-xs uppercase tracking-[0.24em] text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/60">Reset</button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {RANGE_PRESETS.map((preset) => (
            <button key={preset.label} type="button" onClick={() => onApplyRangePreset(preset.days)} className="border border-border bg-paper px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-muted hover:text-foreground">Last {preset.label}</button>
          ))}
        </div>
        {filters.slug || filters.ip ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.slug ? <FilterBadge label="post" value={filters.slug} onClear={onClearSlugFilter} /> : null}
            {filters.ip ? <FilterBadge label="ip" value={filters.ip} onClear={onClearIpFilter} /> : null}
          </div>
        ) : null}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Traffic" subtitle="Requests, successful reads, and failed attempts in the selected window.">
          <LineChart data={stats?.daily ?? []} lines={[{ key: "totalRequests", color: "#1c1c1c", label: "Requests" }, { key: "successfulReads", color: "#6e6e67", label: "Reads" }, { key: "failedReads", color: "#a3a39a", label: "Failed" }]} />
        </Panel>
        <Panel title="Recent hot posts" subtitle="Top articles by successful reads in the last 7 days.">
          <HorizontalBarChart items={stats?.recentHotPosts ?? []} />
        </Panel>
      </div>

      <Panel title="Hourly" subtitle="Requests and reads by hour in the current range.">
        <LineChart data={stats?.hourly ?? []} lines={[{ key: "totalRequests", color: "#1c1c1c", label: "Hourly Requests" }, { key: "successfulReads", color: "#6e6e67", label: "Hourly Reads" }]} />
      </Panel>

      <Suspense fallback={<AnalyticsMapsLoading />}>
        <AnalyticsGeoMapsSection countryLocations={stats?.countryLocations ?? []} chinaLocations={stats?.chinaLocations ?? []} />
      </Suspense>

      <Panel title="Ignored IPs" subtitle="Saved addresses can be excluded from the totals.">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_auto]">
          <input value={ignoredIp} onChange={(event) => setIgnoredIp(event.target.value)} className="w-full border border-stone-300 dark:border-stone-600/60 bg-stone-50/60 dark:bg-stone-900/40 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-500 dark:focus:ring-stone-400" placeholder="IP address" />
          <input value={ignoredLabel} onChange={(event) => setIgnoredLabel(event.target.value)} className="w-full border border-stone-300 dark:border-stone-600/60 bg-stone-50/60 dark:bg-stone-900/40 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-500 dark:focus:ring-stone-400" placeholder="Label (home / office / server)" />
          <button type="button" onClick={() => void onAddIgnoredIp()} className="bg-stone-900 dark:bg-stone-100 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-300">Save IP</button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ignoredIps.length === 0 ? <div className="text-sm text-stone-500 dark:text-stone-400">No ignored IPs configured yet.</div> : null}
          {ignoredIps.map((item) => (
            <div key={item.ip} className="flex items-center justify-between gap-3 border border-border bg-paper px-4 py-3">
              <div>
                <div className="font-mono text-sm text-stone-900 dark:text-stone-100">{item.ip}</div>
                <div className="text-xs text-stone-500 dark:text-stone-400">{item.label || "No label"} • added {formatDateTime(item.createdAt)}</div>
              </div>
              <button type="button" aria-label={`删除忽略的 IP ${item.ip}`} onClick={() => void onDeleteIgnoredIp(item.ip)} className="border border-border p-2 text-muted hover:text-foreground">
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

interface AnalyticsTablesProps {
  stats: AnalyticsResponse | null;
  filters: FilterState;
  pagedPosts: PaginatedResult<AnalyticsPostStat>;
  postSortKey: PostSortKey;
  postSortDirection: SortDirection;
  onTogglePostSort: (key: PostSortKey) => void;
  onApplySlugFilter: (slug: string) => void;
  onClearSlugFilter: () => void;
  onPostPageChange: (page: number) => void;
  pagedIps: PaginatedResult<AnalyticsResponse["ips"][number]>;
  ipSortKey: IPSortKey;
  ipSortDirection: SortDirection;
  onToggleIpSort: (key: IPSortKey) => void;
  onApplyIpFilter: (ip: string) => void;
  onClearIpFilter: () => void;
  onIpPageChange: (page: number) => void;
  onPrepareIgnoredIp: (ip: string) => void;
}

function AnalyticsTables(props: AnalyticsTablesProps) {
  const {
    stats, filters, pagedPosts, postSortKey, postSortDirection, onTogglePostSort,
    onApplySlugFilter, onClearSlugFilter, onPostPageChange, pagedIps, ipSortKey,
    ipSortDirection, onToggleIpSort, onApplyIpFilter, onClearIpFilter,
    onIpPageChange, onPrepareIgnoredIp,
  } = props;

  return (
    <>
      <Panel title="Article Performance" subtitle="Dedicated post view with fixed-size article cards, so varying title length no longer changes row rhythm or table density." action={<FilterBadgeSlot active={Boolean(filters.slug)} label="active post" value={filters.slug} onClear={onClearSlugFilter} />}>
        <div className="mb-4 flex flex-wrap gap-3">
          <SortButton label="Reads" active={postSortKey === "successfulReads"} direction={postSortDirection} onClick={() => onTogglePostSort("successfulReads")} />
          <SortButton label="Requests" active={postSortKey === "totalRequests"} direction={postSortDirection} onClick={() => onTogglePostSort("totalRequests")} />
          <SortButton label="Failed" active={postSortKey === "failedReads"} direction={postSortDirection} onClick={() => onTogglePostSort("failedReads")} />
          <SortButton label="IPs" active={postSortKey === "uniqueIps"} direction={postSortDirection} onClick={() => onTogglePostSort("uniqueIps")} />
          <SortButton label="Latest" active={postSortKey === "latestAccessAt"} direction={postSortDirection} onClick={() => onTogglePostSort("latestAccessAt")} />
          <SortButton label="Title" active={postSortKey === "title"} direction={postSortDirection} onClick={() => onTogglePostSort("title")} />
        </div>
        <DataTable columns={["Post", "Path", "Requests", "Reads", "Failed", "Unique IPs", "Last Access", "Action"]} rows={pagedPosts.items.map((post) => [
          <button key="post" type="button" onClick={() => onApplySlugFilter(post.slug)} className="text-left"><ScrollTitle title={post.title} slug={post.slug} /></button>,
          <div key="path" className="max-w-[14rem] break-all text-stone-500 dark:text-stone-400">{post.path || "/"}</div>,
          post.totalRequests, post.successfulReads, post.failedReads, post.uniqueIps, formatDateTime(post.latestAccessAt),
          <div key="actions" className="grid min-w-[7.5rem] grid-cols-1 gap-2">
            <button type="button" onClick={() => onApplySlugFilter(post.slug)} className="border border-stone-300 dark:border-stone-600/60 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60">filter</button>
            <button type="button" onClick={onClearSlugFilter} disabled={filters.slug !== post.slug} className={cn("border border-stone-300 dark:border-stone-600/60 px-3 py-1 text-[11px] uppercase tracking-[0.22em]", filters.slug === post.slug ? "text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60" : "pointer-events-none opacity-0")}>clear</button>
          </div>,
        ])} />
        <Pagination page={pagedPosts.page} totalPages={pagedPosts.totalPages} onChange={onPostPageChange} />
      </Panel>

      <Panel title="IP Observation Deck" subtitle="Dedicated IP view with quick self-IP filtering support and top-post context per address." action={<FilterBadgeSlot active={Boolean(filters.ip)} label="active ip" value={filters.ip} onClear={onClearIpFilter} />}>
        <div className="mb-4 flex flex-wrap gap-3">
          <SortButton label="Requests" active={ipSortKey === "totalRequests"} direction={ipSortDirection} onClick={() => onToggleIpSort("totalRequests")} />
          <SortButton label="Reads" active={ipSortKey === "successfulReads"} direction={ipSortDirection} onClick={() => onToggleIpSort("successfulReads")} />
          <SortButton label="Failed" active={ipSortKey === "failedReads"} direction={ipSortDirection} onClick={() => onToggleIpSort("failedReads")} />
          <SortButton label="Posts" active={ipSortKey === "uniquePosts"} direction={ipSortDirection} onClick={() => onToggleIpSort("uniquePosts")} />
          <SortButton label="Latest" active={ipSortKey === "lastSeenAt"} direction={ipSortDirection} onClick={() => onToggleIpSort("lastSeenAt")} />
          <SortButton label="IP" active={ipSortKey === "ip"} direction={ipSortDirection} onClick={() => onToggleIpSort("ip")} />
        </div>
        <DataTable columns={["IP", "Requests", "Reads", "Failed", "Unique Posts", "Top Posts", "Actions"]} rows={pagedIps.items.map((ip) => [
          <div key="ip" className="min-w-[9.5rem] space-y-2">
            <button type="button" onClick={() => onApplyIpFilter(ip.ip)} className="space-y-1 text-left"><div className="font-mono text-xs text-stone-900 dark:text-stone-100">{ip.ip}</div><div className="text-xs text-stone-500 dark:text-stone-400">Last seen {formatDateTime(ip.lastSeenAt)}</div></button>
            <InlineCopyButton text={ip.ip} />
          </div>,
          ip.totalRequests, ip.successfulReads, ip.failedReads, ip.uniquePosts,
          <div key="top-posts" className="max-w-[16rem] overflow-x-auto whitespace-nowrap text-xs text-stone-500 dark:text-stone-400 themed-scrollbar">{(ip.topPosts ?? []).join(" • ") || "-"}</div>,
          <div key="actions" className="grid min-w-[11rem] grid-cols-1 gap-2">
            <button type="button" onClick={() => onApplyIpFilter(ip.ip)} className="border border-stone-300 dark:border-stone-600/60 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60">filter</button>
            <button type="button" onClick={onClearIpFilter} disabled={filters.ip !== ip.ip} className={cn("border border-stone-300 dark:border-stone-600/60 px-3 py-1 text-[11px] uppercase tracking-[0.22em]", filters.ip === ip.ip ? "text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60" : "pointer-events-none opacity-0")}>clear</button>
            <button type="button" onClick={() => onPrepareIgnoredIp(ip.ip)} className="border border-stone-300 dark:border-stone-600/60 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60">ignore</button>
          </div>,
        ])} />
        <Pagination page={pagedIps.page} totalPages={pagedIps.totalPages} onChange={onIpPageChange} />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Referrers" subtitle="External sources for the current filter.">
          <DataTable columns={["Referrer", "Host", "Requests", "Reads", "Failed"]} rows={(stats?.referrers ?? []).map((referrer) => [<div key="referrer" className="max-w-[20rem] break-all text-stone-600 dark:text-stone-300">{referrer.referrer}</div>, referrer.host || "-", referrer.totalRequests, referrer.successfulReads, referrer.failedReads])} />
        </Panel>
        <Panel title="Recent Access Events" subtitle="Recent event stream showing which article, from which IP, and whether content was actually returned.">
          <DataTable columns={["Time", "Post", "IP", "Geo", "Result"]} rows={(stats?.recentEvents ?? []).map((event) => [
            formatDateTime(event.accessedAt),
            <ScrollTitle key="post" title={event.title} slug={event.slug} />,
            <div key="ip" className="flex items-center gap-2"><div className="font-mono text-xs">{event.ip}</div><InlineCopyButton text={event.ip} /></div>,
            <div key="geo" className="border border-stone-200 dark:border-stone-700/60 bg-stone-50 dark:bg-stone-900/40 px-2 py-1 text-xs text-stone-500 dark:text-stone-400">{[event.countryName || event.countryCode, event.region].filter(Boolean).join(" / ") || "Unknown"}</div>,
            <span key="result" className="inline-flex border border-border bg-paper px-2 py-1 text-xs text-foreground">{event.accessGranted ? "Success" : "Blocked"}</span>,
          ])} />
        </Panel>
      </div>
    </>
  );
}

export default function AnalyticsPage() {
  usePageMeta({
    title: "访问统计",
    canonicalPath: "/ops/analytics",
    robots: "noindex,nofollow",
  });

  const [session, setSession] = useState<AdminSession | null>(null);
  const [booting, setBooting] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<AnalyticsResponse | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [ignoredIp, setIgnoredIp] = useState("");
  const [ignoredLabel, setIgnoredLabel] = useState("");
  const [postSortKey, setPostSortKey] = useState<PostSortKey>("successfulReads");
  const [postSortDirection, setPostSortDirection] = useState<SortDirection>("desc");
  const [postPage, setPostPage] = useState(1);
  const [ipSortKey, setIpSortKey] = useState<IPSortKey>("totalRequests");
  const [ipSortDirection, setIpSortDirection] = useState<SortDirection>("desc");
  const [ipPage, setIpPage] = useState(1);

  const applyRangePreset = (days: number) => {
    setFilters((current) => ({
      ...current,
      from: toDateTimeLocalValue(subDays(new Date(), days)),
      to: toDateTimeLocalValue(new Date()),
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    if (!session) return;
    void loadDashboard(session, defaultFilters);
  };

  const applySlugFilter = (slug: string) => {
    const nextFilters = { ...filters, slug };
    setFilters(nextFilters);
    if (!session) return;
    void loadDashboard(session, nextFilters);
  };

  const applyIpFilter = (ip: string) => {
    const nextFilters = { ...filters, ip };
    setFilters(nextFilters);
    if (!session) return;
    void loadDashboard(session, nextFilters);
  };

  const clearSlugFilter = () => {
    const nextFilters = { ...filters, slug: "" };
    setFilters(nextFilters);
    if (!session) return;
    void loadDashboard(session, nextFilters);
  };

  const clearIpFilter = () => {
    const nextFilters = { ...filters, ip: "" };
    setFilters(nextFilters);
    if (!session) return;
    void loadDashboard(session, nextFilters);
  };

  async function loadDashboard(activeSession: AdminSession, nextFilters: FilterState) {
    setLoading(true);
    setError("");
    try {
      const data = await getAnalytics(activeSession.token, {
        slug: nextFilters.slug || undefined,
        ip: nextFilters.ip || undefined,
        from: nextFilters.from ? new Date(nextFilters.from).toISOString() : undefined,
        to: nextFilters.to ? new Date(nextFilters.to).toISOString() : undefined,
        excludeIgnored: nextFilters.excludeIgnored,
      });
      setStats(data);
      setPostPage(1);
      setIpPage(1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load analytics";
      if (message === "Unauthorized") {
        clearAdminSession();
        setSession(null);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const cached = loadAdminSession();
    if (cached) {
      setSession(cached);
      void loadDashboard(cached, defaultFilters);
    }
    setBooting(false);
  }, []);

  const handleLogin = async (password: string) => {
    setAuthLoading(true);
    setError("");
    try {
      const nextSession = await adminLogin(password);
      saveAdminSession(nextSession);
      setSession(nextSession);
      await loadDashboard(nextSession, filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setSession(null);
    setStats(null);
    setError("");
  };

  const handleRefresh = async () => {
    if (!session) return;
    await loadDashboard(session, filters);
  };

  const handleAddIgnoredIp = async () => {
    if (!session || !ignoredIp.trim()) return;
    setLoading(true);
    setError("");
    try {
      await addIgnoredIp(session.token, ignoredIp.trim(), ignoredLabel.trim() || undefined);
      setIgnoredIp("");
      setIgnoredLabel("");
      await loadDashboard(session, filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add ignored IP");
      setLoading(false);
    }
  };

  const handleDeleteIgnoredIp = async (ip: string) => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      await deleteIgnoredIp(session.token, ip);
      await loadDashboard(session, filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete ignored IP");
      setLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!stats) return;
    downloadTextFile(`analytics-${format(new Date(), "yyyyMMdd-HHmmss")}.json`, JSON.stringify(stats, null, 2), "application/json");
  };

  const handleExportCsv = () => {
    if (!stats) return;
    downloadTextFile(`analytics-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`, analyticsToCsv(stats), "text/csv;charset=utf-8");
  };

  if (booting) {
    return <div className="py-24 text-center text-stone-500 dark:text-stone-400">Loading analytics workspace...</div>;
  }

  if (!session) {
    return <LoginPanel onSubmit={handleLogin} loading={authLoading} error={error} />;
  }

  const ignoredIps: IgnoredIPEntry[] = stats?.ignoredIps ?? [];
  const sortedPosts = sortPosts(stats?.posts ?? [], postSortKey, postSortDirection);
  const pagedPosts = paginate(sortedPosts, postPage, PAGE_SIZE);
  const sortedIps = sortIps(stats?.ips ?? [], ipSortKey, ipSortDirection);
  const pagedIps = paginate(sortedIps, ipPage, PAGE_SIZE);

  const togglePostSort = (key: PostSortKey) => {
    setPostPage(1);
    if (postSortKey === key) {
      setPostSortDirection((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }
    setPostSortKey(key);
    setPostSortDirection(key === "title" ? "asc" : "desc");
  };

  const toggleIpSort = (key: IPSortKey) => {
    setIpPage(1);
    if (ipSortKey === key) {
      setIpSortDirection((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }
    setIpSortKey(key);
    setIpSortDirection(key === "ip" ? "asc" : "desc");
  };

  return (
    <section className="space-y-8">
      <header className="border border-border bg-paper p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-serif text-foreground md:text-4xl">访问记录</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
              会话有效至 {formatDateTime(session.expiresAt)}。地域图使用反代提供的国家与地区头。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="inline-flex items-center gap-2 border border-border bg-paper px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground hover:bg-background"
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 border border-border bg-paper px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground hover:bg-background"
            >
              <Download className="h-4 w-4" />
              JSON
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 border border-border bg-paper px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground hover:bg-background"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] text-background hover:opacity-90"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {error ? <div className="border border-border bg-paper px-4 py-3 text-sm text-foreground"><span className="font-medium">错误</span> — {error}</div> : null}

      <AnalyticsOverview
        stats={stats}
        filters={filters}
        setFilters={setFilters}
        loading={loading}
        onRefresh={handleRefresh}
        onResetFilters={resetFilters}
        onApplyRangePreset={applyRangePreset}
        onClearSlugFilter={clearSlugFilter}
        onClearIpFilter={clearIpFilter}
        ignoredIp={ignoredIp}
        setIgnoredIp={setIgnoredIp}
        ignoredLabel={ignoredLabel}
        setIgnoredLabel={setIgnoredLabel}
        ignoredIps={ignoredIps}
        onAddIgnoredIp={handleAddIgnoredIp}
        onDeleteIgnoredIp={handleDeleteIgnoredIp}
      />

      <AnalyticsTables
        stats={stats}
        filters={filters}
        pagedPosts={pagedPosts}
        postSortKey={postSortKey}
        postSortDirection={postSortDirection}
        onTogglePostSort={togglePostSort}
        onApplySlugFilter={applySlugFilter}
        onClearSlugFilter={clearSlugFilter}
        onPostPageChange={setPostPage}
        pagedIps={pagedIps}
        ipSortKey={ipSortKey}
        ipSortDirection={ipSortDirection}
        onToggleIpSort={toggleIpSort}
        onApplyIpFilter={applyIpFilter}
        onClearIpFilter={clearIpFilter}
        onIpPageChange={setIpPage}
        onPrepareIgnoredIp={(ip) => {
          setIgnoredIp(ip);
          setIgnoredLabel("self");
        }}
      />
    </section>
  );
}
