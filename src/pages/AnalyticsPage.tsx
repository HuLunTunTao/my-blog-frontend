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
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Activity, ArrowDown, ArrowUp, ArrowUpDown, BarChart3, Download, Globe2, LockKeyhole, LogOut, MapPinned, RefreshCw, Shield, Trash2 } from "lucide-react";

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
    <div className="flex min-h-[4.75rem] w-[18rem] max-w-[18rem] flex-col justify-between border border-stone-200 bg-stone-50/80 px-3 py-2">
      <div className="overflow-x-auto whitespace-nowrap text-sm font-medium text-stone-900 themed-scrollbar">{title}</div>
      <div className="mt-1 overflow-x-auto whitespace-nowrap font-mono text-[11px] text-stone-500 themed-scrollbar">{slug}</div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, hint }: { icon: typeof Activity; label: string; value: string | number; hint: string }) {
  return (
    <div className="relative overflow-hidden border border-stone-200/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(120,113,108,0.08)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-stone-700 via-amber-700/70 to-stone-300" />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.32em] text-stone-500">{label}</div>
          <div className="mt-4 text-3xl font-serif text-stone-900">{value}</div>
          <div className="mt-2 text-sm text-stone-500">{hint}</div>
        </div>
        <div className="rounded-full border border-stone-200 bg-stone-50 p-2 text-stone-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, action, children, className }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("border border-stone-200/70 bg-white/88 p-5 shadow-[0_24px_80px_rgba(120,113,108,0.09)]", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-serif text-stone-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-stone-500">{subtitle}</p> : null}
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
      <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-stone-500">
        {lines.map((line) => (
          <div key={line.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />
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
              <text key={item.label} x={x} y={height - 4} textAnchor="middle" className="fill-stone-400 text-[10px]">
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
    <button type="button" onClick={onClick} className={cn("inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em]", active ? "text-stone-900" : "text-stone-500 hover:text-stone-800")}>
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
    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-stone-500">
      <span>Page {page} / {totalPages}</span>
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} className="border border-stone-300 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-stone-600 disabled:opacity-40">
          Prev
        </button>
        <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} className="border border-stone-300 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-stone-600 disabled:opacity-40">
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
        <section key={title} className="border border-stone-200/70 bg-white/88 p-5 shadow-[0_24px_80px_rgba(120,113,108,0.09)]">
          <div className="mb-4">
            <h2 className="text-lg font-serif text-stone-900">{title}</h2>
            <p className="mt-1 text-sm text-stone-500">Loading geo visualization...</p>
          </div>
          <div className="h-[420px] animate-pulse border border-stone-200 bg-stone-100/80" />
        </section>
      ))}
    </div>
  );
}

function FilterBadge({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <div className="inline-flex min-h-[2.25rem] min-w-[14rem] items-center gap-2 border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-700">
      <span className="uppercase tracking-[0.2em] text-stone-500">{label}</span>
      <span className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[11px] themed-scrollbar">{value}</span>
      <button type="button" onClick={onClear} className="border-l border-stone-200 pl-2 text-stone-500 hover:text-stone-900">
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
    <button type="button" onClick={() => void handleCopy()} className="border border-stone-300 bg-white px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-stone-600 hover:bg-stone-50">
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
      {items.length === 0 ? <div className="text-sm text-stone-500">No recent hot posts.</div> : null}
      {items.map((item) => (
        <div key={item.slug} className="border border-stone-200 bg-stone-50/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 border border-stone-200 bg-white px-3 py-2">
              <div className="overflow-x-auto whitespace-nowrap text-sm font-medium text-stone-900 themed-scrollbar">{item.title}</div>
              <div className="mt-1 overflow-x-auto whitespace-nowrap font-mono text-[11px] text-stone-500 themed-scrollbar">{item.slug}</div>
            </div>
            <div className="w-20 border border-stone-200 bg-white px-2 py-2 text-right">
              <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Reads</div>
              <div className="mt-1 text-lg font-serif text-stone-900">{item.successfulReads}</div>
            </div>
          </div>
          <div className="mt-2 border border-stone-200 bg-white p-2">
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-stone-500">
              <span>Heat</span>
              <span>{item.totalRequests} requests</span>
            </div>
            <div className="h-2 bg-stone-100">
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
      <table className="min-w-full divide-y divide-stone-200 text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-[0.24em] text-stone-500">
            {columns.map((column) => (
              <th key={column} className="px-3 py-3 font-medium">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-stone-500">No data</td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="align-top">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-3 text-stone-700">{cell}</td>
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
    <section className="mx-auto max-w-5xl">
      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="relative overflow-hidden border border-stone-200/70 bg-[radial-gradient(circle_at_top_left,rgba(120,113,108,0.14),transparent_35%),linear-gradient(135deg,#fafaf9_0%,#f5f5f4_45%,#eee7da_100%)] p-8 md:p-10">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-amber-600/10 blur-3xl" />
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-300/70 bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-stone-600">
              <Shield className="h-3.5 w-3.5" />
              Ops Analytics
            </div>
            <div>
              <h1 className="max-w-xl text-4xl font-serif leading-tight text-stone-900 md:text-5xl">Professional traffic intelligence for your blog operations.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
                JWT session persistence, ignored self-IP management, recent hot posts, access trends, referrers, and geo-origin dashboards are all consolidated here.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["JWT Session", "Login once, keep the state until token expiry."],
                ["Self-IP Filter", "Persist your own IPs and exclude them by default."],
                ["Geo Pulse", "Visualize country and China-region access concentration."],
              ].map(([title, desc]) => (
                <div key={title} className="border border-stone-200/70 bg-white/75 p-4">
                  <div className="text-sm font-medium text-stone-900">{title}</div>
                  <div className="mt-2 text-sm text-stone-500">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-stone-200/70 bg-white/90 p-8 shadow-[0_24px_70px_rgba(120,113,108,0.10)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-full border border-stone-200 bg-stone-50 p-3 text-stone-700">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-stone-900">Administrator Sign-In</div>
              <div className="text-sm text-stone-500">The route stays hidden, and all data requires backend authorization.</div>
            </div>
          </div>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit(password);
            }}
          >
            <label className="block space-y-2">
              <span className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Admin Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border border-stone-300 bg-stone-50/60 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-stone-500"
                placeholder="Enter password"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-900 px-4 py-3 text-sm uppercase tracking-[0.28em] text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Enter Dashboard"}
            </button>
            {error ? <div className="text-sm text-red-600">{error}</div> : null}
          </form>
        </div>
      </div>
    </section>
  );
}

export default function AnalyticsPage() {
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
    return <div className="py-24 text-center text-stone-500">Loading analytics workspace...</div>;
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
      <header className="relative overflow-hidden border border-stone-200/70 bg-[radial-gradient(circle_at_top_left,rgba(146,64,14,0.12),transparent_32%),linear-gradient(145deg,#fafaf9_0%,#f6f3ee_52%,#f0ece4_100%)] p-6 md:p-8">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[linear-gradient(to_left,rgba(120,113,108,0.12),transparent)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-300/70 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-stone-600">
              <Activity className="h-3.5 w-3.5" />
              Internal Analytics
            </div>
            <div>
              <h1 className="text-3xl font-serif text-stone-900 md:text-4xl">Traffic Intelligence Console</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-600">
                JWT session active until {formatDateTime(session.expiresAt)}. Geo charts rely on reverse-proxy country and region headers when available.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="inline-flex items-center gap-2 border border-stone-300 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.24em] text-stone-700 hover:bg-white"
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 border border-stone-300 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.24em] text-stone-700 hover:bg-white"
            >
              <Download className="h-4 w-4" />
              JSON
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 border border-stone-300 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.24em] text-stone-700 hover:bg-white"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 border border-stone-300 bg-stone-900 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white hover:bg-stone-800"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {error ? <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <section className="grid gap-4 xl:grid-cols-5">
        <MetricCard icon={BarChart3} label="Requests" value={stats?.overview.totalRequests ?? 0} hint="Raw access attempts in current range" />
        <MetricCard icon={Activity} label="Reads" value={stats?.overview.successfulReads ?? 0} hint="Successful article reads" />
        <MetricCard icon={Shield} label="Ignored Traffic" value={stats?.overview.ignoredRequests ?? 0} hint="Requests from your saved IPs" />
        <MetricCard icon={Globe2} label="Filtered IPs" value={stats?.overview.filteredUniqueIps ?? 0} hint="Unique IPs after filtering" />
        <MetricCard icon={MapPinned} label="24h Reads" value={stats?.overview.successfulLast24 ?? 0} hint="Successful reads in last 24 hours" />
      </section>

      <Panel
        title="Filters & Session Controls"
        subtitle="Apply structured filters without re-entering the password. Ignored self-IP traffic is excluded by default."
        action={
          <div className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs uppercase tracking-[0.22em] text-stone-500">
            Generated {formatDateTime(stats?.generatedAt)}
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-5">
          <label className="space-y-2 text-sm">
            <span className="block text-[11px] uppercase tracking-[0.22em] text-stone-500">Post Slug</span>
            <input value={filters.slug} onChange={(event) => setFilters((current) => ({ ...current, slug: event.target.value }))} className="w-full border border-stone-300 bg-stone-50/60 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-500" placeholder="folder/post" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="block text-[11px] uppercase tracking-[0.22em] text-stone-500">IP</span>
            <input value={filters.ip} onChange={(event) => setFilters((current) => ({ ...current, ip: event.target.value }))} className="w-full border border-stone-300 bg-stone-50/60 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-500" placeholder="203.0.113.8" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="block text-[11px] uppercase tracking-[0.22em] text-stone-500">From</span>
            <input type="datetime-local" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} className="w-full border border-stone-300 bg-stone-50/60 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-500" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="block text-[11px] uppercase tracking-[0.22em] text-stone-500">To</span>
            <input type="datetime-local" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} className="w-full border border-stone-300 bg-stone-50/60 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-500" />
          </label>
          <div className="flex flex-col justify-between gap-3">
            <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-3 text-sm text-stone-700">
              <input type="checkbox" checked={filters.excludeIgnored} onChange={(event) => setFilters((current) => ({ ...current, excludeIgnored: event.target.checked }))} className="h-4 w-4 accent-stone-900" />
              Exclude ignored IPs
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => void handleRefresh()} className="bg-stone-900 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white hover:bg-stone-800" disabled={loading}>
                Apply
              </button>
              <button type="button" onClick={resetFilters} className="border border-stone-300 bg-white px-4 py-2 text-xs uppercase tracking-[0.24em] text-stone-700 hover:bg-stone-50">
                Reset
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyRangePreset(preset.days)}
              className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-stone-600 hover:bg-stone-50"
            >
              Last {preset.label}
            </button>
          ))}
        </div>
        {(filters.slug || filters.ip) ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.slug ? <FilterBadge label="post" value={filters.slug} onClear={clearSlugFilter} /> : null}
            {filters.ip ? <FilterBadge label="ip" value={filters.ip} onClear={clearIpFilter} /> : null}
          </div>
        ) : null}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Blog Traffic Trend" subtitle="Requests, successful reads, and failed attempts across the selected time window.">
          <LineChart data={stats?.daily ?? []} lines={[{ key: "totalRequests", color: "#1c1917", label: "Requests" }, { key: "successfulReads", color: "#b45309", label: "Reads" }, { key: "failedReads", color: "#dc2626", label: "Failed" }]} />
        </Panel>
        <Panel title="Recent Hot Posts" subtitle="Top articles by successful reads in the last 7 days within the current filter scope.">
          <HorizontalBarChart items={stats?.recentHotPosts ?? []} />
        </Panel>
      </div>

      <Panel title="Hourly Access Pulse" subtitle="Short-window hourly rhythm helps distinguish bursts, crawler noise, and release-day spikes.">
        <LineChart data={stats?.hourly ?? []} lines={[{ key: "totalRequests", color: "#44403c", label: "Hourly Requests" }, { key: "successfulReads", color: "#0f766e", label: "Hourly Reads" }]} />
      </Panel>

      <Suspense fallback={<AnalyticsMapsLoading />}>
        <AnalyticsGeoMapsSection countryLocations={stats?.countryLocations ?? []} chinaLocations={stats?.chinaLocations ?? []} />
      </Suspense>

      <Panel title="Ignored Self-IP Registry" subtitle="Persist your own IPs here. They can be excluded from all analytics with a single toggle.">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_auto]">
          <input value={ignoredIp} onChange={(event) => setIgnoredIp(event.target.value)} className="w-full border border-stone-300 bg-stone-50/60 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-500" placeholder="IP address" />
          <input value={ignoredLabel} onChange={(event) => setIgnoredLabel(event.target.value)} className="w-full border border-stone-300 bg-stone-50/60 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-500" placeholder="Label (home / office / server)" />
          <button type="button" onClick={() => void handleAddIgnoredIp()} className="bg-stone-900 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white hover:bg-stone-800">
            Save IP
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ignoredIps.length === 0 ? <div className="text-sm text-stone-500">No ignored IPs configured yet.</div> : null}
          {ignoredIps.map((item) => (
            <div key={item.ip} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-4 py-3">
              <div>
                <div className="font-mono text-sm text-stone-900">{item.ip}</div>
                <div className="text-xs text-stone-500">{item.label || "No label"} • added {formatDateTime(item.createdAt)}</div>
              </div>
              <button type="button" onClick={() => void handleDeleteIgnoredIp(item.ip)} className="rounded-full border border-stone-300 p-2 text-stone-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Article Performance"
        subtitle="Dedicated post view with fixed-size article cards, so varying title length no longer changes row rhythm or table density."
        action={<FilterBadgeSlot active={Boolean(filters.slug)} label="active post" value={filters.slug} onClear={clearSlugFilter} />}
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <SortButton label="Reads" active={postSortKey === "successfulReads"} direction={postSortDirection} onClick={() => togglePostSort("successfulReads")} />
          <SortButton label="Requests" active={postSortKey === "totalRequests"} direction={postSortDirection} onClick={() => togglePostSort("totalRequests")} />
          <SortButton label="Failed" active={postSortKey === "failedReads"} direction={postSortDirection} onClick={() => togglePostSort("failedReads")} />
          <SortButton label="IPs" active={postSortKey === "uniqueIps"} direction={postSortDirection} onClick={() => togglePostSort("uniqueIps")} />
          <SortButton label="Latest" active={postSortKey === "latestAccessAt"} direction={postSortDirection} onClick={() => togglePostSort("latestAccessAt")} />
          <SortButton label="Title" active={postSortKey === "title"} direction={postSortDirection} onClick={() => togglePostSort("title")} />
        </div>
        <DataTable
          columns={["Post", "Path", "Requests", "Reads", "Failed", "Unique IPs", "Last Access", "Action"]}
          rows={pagedPosts.items.map((post) => [
              <button type="button" onClick={() => applySlugFilter(post.slug)} className="text-left">
                <ScrollTitle title={post.title} slug={post.slug} />
              </button>,
            <div className="max-w-[14rem] break-all text-stone-500">{post.path || "/"}</div>,
            post.totalRequests,
            post.successfulReads,
            post.failedReads,
            post.uniqueIps,
            formatDateTime(post.latestAccessAt),
            <div className="grid min-w-[7.5rem] grid-cols-1 gap-2">
              <button type="button" onClick={() => applySlugFilter(post.slug)} className="border border-stone-300 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-stone-600 hover:bg-stone-50">
                filter
              </button>
              <button
                type="button"
                onClick={clearSlugFilter}
                disabled={filters.slug !== post.slug}
                className={cn(
                  "border border-stone-300 px-3 py-1 text-[11px] uppercase tracking-[0.22em]",
                  filters.slug === post.slug ? "text-stone-600 hover:bg-stone-50" : "pointer-events-none opacity-0",
                )}
              >
                clear
              </button>
            </div>,
          ])}
        />
        <Pagination page={pagedPosts.page} totalPages={pagedPosts.totalPages} onChange={setPostPage} />
      </Panel>

      <Panel
        title="IP Observation Deck"
        subtitle="Dedicated IP view with quick self-IP filtering support and top-post context per address."
        action={<FilterBadgeSlot active={Boolean(filters.ip)} label="active ip" value={filters.ip} onClear={clearIpFilter} />}
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <SortButton label="Requests" active={ipSortKey === "totalRequests"} direction={ipSortDirection} onClick={() => toggleIpSort("totalRequests")} />
          <SortButton label="Reads" active={ipSortKey === "successfulReads"} direction={ipSortDirection} onClick={() => toggleIpSort("successfulReads")} />
          <SortButton label="Failed" active={ipSortKey === "failedReads"} direction={ipSortDirection} onClick={() => toggleIpSort("failedReads")} />
          <SortButton label="Posts" active={ipSortKey === "uniquePosts"} direction={ipSortDirection} onClick={() => toggleIpSort("uniquePosts")} />
          <SortButton label="Latest" active={ipSortKey === "lastSeenAt"} direction={ipSortDirection} onClick={() => toggleIpSort("lastSeenAt")} />
          <SortButton label="IP" active={ipSortKey === "ip"} direction={ipSortDirection} onClick={() => toggleIpSort("ip")} />
        </div>
        <DataTable
          columns={["IP", "Requests", "Reads", "Failed", "Unique Posts", "Top Posts", "Actions"]}
          rows={pagedIps.items.map((ip) => [
            <div className="min-w-[9.5rem] space-y-2">
              <button type="button" onClick={() => applyIpFilter(ip.ip)} className="space-y-1 text-left">
                <div className="font-mono text-xs text-stone-900">{ip.ip}</div>
                <div className="text-xs text-stone-500">Last seen {formatDateTime(ip.lastSeenAt)}</div>
              </button>
              <InlineCopyButton text={ip.ip} />
            </div>,
            ip.totalRequests,
            ip.successfulReads,
            ip.failedReads,
            ip.uniquePosts,
            <div className="max-w-[16rem] overflow-x-auto whitespace-nowrap text-xs text-stone-500 themed-scrollbar">{(ip.topPosts ?? []).join(" • ") || "-"}</div>,
            <div className="grid min-w-[11rem] grid-cols-1 gap-2">
              <button type="button" onClick={() => applyIpFilter(ip.ip)} className="border border-stone-300 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-stone-600 hover:bg-stone-50">
                filter
              </button>
              <button
                type="button"
                onClick={clearIpFilter}
                disabled={filters.ip !== ip.ip}
                className={cn(
                  "border border-stone-300 px-3 py-1 text-[11px] uppercase tracking-[0.22em]",
                  filters.ip === ip.ip ? "text-stone-600 hover:bg-stone-50" : "pointer-events-none opacity-0",
                )}
              >
                clear
              </button>
              <button type="button" onClick={() => { setIgnoredIp(ip.ip); setIgnoredLabel("self"); }} className="border border-stone-300 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-stone-600 hover:bg-stone-50">
                ignore
              </button>
            </div>,
          ])}
        />
        <Pagination page={pagedIps.page} totalPages={pagedIps.totalPages} onChange={setIpPage} />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Referrer Intelligence" subtitle="External source breakdown for the current filter scope.">
          <DataTable
            columns={["Referrer", "Host", "Requests", "Reads", "Failed"]}
            rows={(stats?.referrers ?? []).map((referrer) => [
              <div className="max-w-[20rem] break-all text-stone-600">{referrer.referrer}</div>,
              referrer.host || "-",
              referrer.totalRequests,
              referrer.successfulReads,
              referrer.failedReads,
            ])}
          />
        </Panel>
        <Panel title="Recent Access Events" subtitle="Recent event stream showing which article, from which IP, and whether content was actually returned.">
          <DataTable
            columns={["Time", "Post", "IP", "Geo", "Result"]}
            rows={(stats?.recentEvents ?? []).map((event) => [
              formatDateTime(event.accessedAt),
              <ScrollTitle title={event.title} slug={event.slug} />,
              <div className="flex items-center gap-2">
                <div className="font-mono text-xs">{event.ip}</div>
                <InlineCopyButton text={event.ip} />
              </div>,
              <div className="border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-500">
                {[event.countryName || event.countryCode, event.region].filter(Boolean).join(" / ") || "Unknown"}
              </div>,
              <span className={cn("inline-flex border px-2 py-1 text-xs font-medium", event.accessGranted ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700")}>
                {event.accessGranted ? "Success" : "Blocked"}
              </span>,
            ])}
          />
        </Panel>
      </div>
    </section>
  );
}
