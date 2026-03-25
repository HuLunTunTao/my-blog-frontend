import EncryptedGate from "@/components/EncryptedGate";
import { getAnalytics, type AnalyticsResponse } from "@/lib/api";
import { format, subDays } from "date-fns";
import { useState, type ReactNode } from "react";

type FilterState = {
  slug: string;
  ip: string;
  from: string;
  to: string;
};

const defaultFilters: FilterState = {
  slug: "",
  ip: "",
  from: format(subDays(new Date(), 30), "yyyy-MM-dd'T'00:00"),
  to: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
};

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "yyyy-MM-dd HH:mm");
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="border border-stone-200/70 bg-white/80 px-5 py-4">
      <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">{label}</div>
      <div className="mt-3 text-3xl font-serif text-stone-900">{value}</div>
      {hint ? <div className="mt-2 text-sm text-stone-500">{hint}</div> : null}
    </div>
  );
}

function DataTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-serif">{title}</h2>
      <div className="overflow-x-auto border border-stone-200/70 bg-white/80 themed-scrollbar">
        <table className="min-w-full divide-y divide-stone-200 text-sm">
          <thead className="bg-stone-50/80 text-left text-xs uppercase tracking-[0.2em] text-stone-500">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-stone-500">
                  No data
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="align-top">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-stone-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AnalyticsPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [stats, setStats] = useState<AnalyticsResponse | null>(null);

  async function loadStats(nextPassword: string, nextFilters: FilterState) {
    setLoading(true);
    setError("");
    try {
      const data = await getAnalytics(nextPassword, {
        slug: nextFilters.slug || undefined,
        ip: nextFilters.ip || undefined,
        from: nextFilters.from ? new Date(nextFilters.from).toISOString() : undefined,
        to: nextFilters.to ? new Date(nextFilters.to).toISOString() : undefined,
      });
      setStats(data);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch analytics";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  const handleUnlock = async (nextPassword: string) => {
    const ok = await loadStats(nextPassword, filters);
    if (ok) {
      setPassword(nextPassword);
      setAuthorized(true);
    }
    return ok;
  };

  const applyFilters = async () => {
    if (!password) return;
    await loadStats(password, filters);
  };

  if (!authorized) {
    return (
      <section className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-3 text-center">
          <div className="text-xs uppercase tracking-[0.35em] text-stone-500">Internal Analytics</div>
          <h1 className="text-3xl font-serif">Traffic Intelligence</h1>
          <p className="text-sm text-stone-500">
            This route is not linked in navigation. Backend password verification is required for any query.
          </p>
        </header>
        <EncryptedGate onUnlock={handleUnlock} />
        {error ? <p className="text-center text-sm text-red-500">{error}</p> : null}
      </section>
    );
  }

  return (
    <section className="space-y-10">
      <header className="space-y-3">
        <div className="text-xs uppercase tracking-[0.35em] text-stone-500">Internal Analytics</div>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-serif">Traffic Intelligence</h1>
            <p className="text-sm text-stone-500">Generated at {formatDateTime(stats?.generatedAt)}</p>
          </div>
          <button
            type="button"
            onClick={() => void applyFilters()}
            className="border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.25em] text-stone-700 hover:bg-stone-50"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Requests" value={stats?.overview.totalRequests ?? 0} hint="All access attempts" />
        <StatCard label="Successful Reads" value={stats?.overview.successfulReads ?? 0} hint="Content returned" />
        <StatCard label="Unique IPs" value={stats?.overview.uniqueIps ?? 0} hint="Filtered scope" />
        <StatCard label="24h Reads" value={stats?.overview.successfulLast24 ?? 0} hint="Successful reads in last 24h" />
      </section>

      <section className="grid gap-4 border border-stone-200/70 bg-white/80 p-5 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2 text-sm text-stone-600">
          <span className="block text-xs uppercase tracking-[0.2em] text-stone-500">Post Slug</span>
          <input
            value={filters.slug}
            onChange={(event) => setFilters((current) => ({ ...current, slug: event.target.value }))}
            className="w-full border border-stone-300 bg-transparent px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-400"
            placeholder="a/post"
          />
        </label>
        <label className="space-y-2 text-sm text-stone-600">
          <span className="block text-xs uppercase tracking-[0.2em] text-stone-500">IP</span>
          <input
            value={filters.ip}
            onChange={(event) => setFilters((current) => ({ ...current, ip: event.target.value }))}
            className="w-full border border-stone-300 bg-transparent px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-400"
            placeholder="203.0.113.8"
          />
        </label>
        <label className="space-y-2 text-sm text-stone-600">
          <span className="block text-xs uppercase tracking-[0.2em] text-stone-500">From</span>
          <input
            type="datetime-local"
            value={filters.from}
            onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
            className="w-full border border-stone-300 bg-transparent px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </label>
        <label className="space-y-2 text-sm text-stone-600">
          <span className="block text-xs uppercase tracking-[0.2em] text-stone-500">To</span>
          <input
            type="datetime-local"
            value={filters.to}
            onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
            className="w-full border border-stone-300 bg-transparent px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </label>
      </section>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="grid gap-8 xl:grid-cols-2">
        <DataTable
          title="Posts"
          columns={["Post", "Path", "Requests", "Reads", "IPs", "Last Access"]}
          rows={(stats?.posts ?? []).map((post) => [
            <div className="space-y-1">
              <div className="font-medium text-stone-900">{post.title}</div>
              <div className="break-all font-mono text-xs text-stone-500">{post.slug}</div>
            </div>,
            <span className="break-all">{post.path || "/"}</span>,
            post.totalRequests,
            post.successfulReads,
            post.uniqueIps,
            formatDateTime(post.latestAccessAt),
          ])}
        />
        <DataTable
          title="IP Sources"
          columns={["IP", "Requests", "Reads", "Posts", "Top Posts", "Last Seen"]}
          rows={(stats?.ips ?? []).map((ip) => [
            <span className="font-mono text-xs">{ip.ip}</span>,
            ip.totalRequests,
            ip.successfulReads,
            ip.uniquePosts,
            (ip.topPosts ?? []).join(", ") || "-",
            formatDateTime(ip.lastSeenAt),
          ])}
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <DataTable
          title="Daily Trend"
          columns={["Day", "Requests", "Reads", "Failed"]}
          rows={(stats?.daily ?? []).map((bucket) => [
            bucket.label,
            bucket.totalRequests,
            bucket.successfulReads,
            bucket.failedReads,
          ])}
        />
        <DataTable
          title="Recent 24h Hours"
          columns={["Hour", "Requests", "Reads", "Failed"]}
          rows={(stats?.hourly ?? []).map((bucket) => [
            bucket.label,
            bucket.totalRequests,
            bucket.successfulReads,
            bucket.failedReads,
          ])}
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <DataTable
          title="Referrers"
          columns={["Referrer", "Host", "Requests", "Reads", "Failed"]}
          rows={(stats?.referrers ?? []).map((referrer) => [
            <div className="max-w-md break-all">{referrer.referrer}</div>,
            referrer.host || "-",
            referrer.totalRequests,
            referrer.successfulReads,
            referrer.failedReads,
          ])}
        />
        <DataTable
          title="Recent Events"
          columns={["Time", "Post", "IP", "Result", "Referrer"]}
          rows={(stats?.recentEvents ?? []).map((event) => [
            formatDateTime(event.accessedAt),
            <div className="space-y-1">
              <div>{event.title}</div>
              <div className="break-all font-mono text-xs text-stone-500">{event.slug}</div>
            </div>,
            <span className="font-mono text-xs">{event.ip}</span>,
            event.accessGranted ? "Success" : "Blocked",
            <span className="max-w-md break-all">{event.referrer || "(direct)"}</span>,
          ])}
        />
      </div>
    </section>
  );
}
