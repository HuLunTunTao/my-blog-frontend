import {
  addIgnoredIp,
  adminLogin,
  deleteIgnoredIp,
  getAnalytics,
  type AnalyticsLocationStat,
  type AnalyticsPostStat,
  type AnalyticsResponse,
  type AnalyticsTimeBucket,
  type IgnoredIPEntry,
} from "@/lib/api";
import { clearAdminSession, loadAdminSession, saveAdminSession, type AdminSession } from "@/lib/adminSession";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { useEffect, useState, type ReactNode } from "react";
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

const worldCoordinates: Record<string, { x: number; y: number; label: string }> = {
  CN: { x: 78, y: 41, label: "China" },
  HK: { x: 80, y: 45, label: "Hong Kong" },
  TW: { x: 81, y: 46, label: "Taiwan" },
  JP: { x: 86, y: 40, label: "Japan" },
  KR: { x: 83, y: 39, label: "Korea" },
  SG: { x: 75, y: 58, label: "Singapore" },
  MY: { x: 73, y: 59, label: "Malaysia" },
  TH: { x: 71, y: 54, label: "Thailand" },
  IN: { x: 66, y: 49, label: "India" },
  AU: { x: 85, y: 76, label: "Australia" },
  US: { x: 20, y: 42, label: "United States" },
  CA: { x: 17, y: 28, label: "Canada" },
  GB: { x: 45, y: 31, label: "United Kingdom" },
  DE: { x: 49, y: 34, label: "Germany" },
  FR: { x: 46, y: 37, label: "France" },
  NL: { x: 48, y: 32, label: "Netherlands" },
  RU: { x: 63, y: 19, label: "Russia" },
};

const chinaCoordinates: Record<string, { col: number; row: number; label: string }> = {
  "北京": { col: 8, row: 2, label: "北京" },
  "天津": { col: 9, row: 3, label: "天津" },
  "河北": { col: 8, row: 4, label: "河北" },
  "山西": { col: 7, row: 4, label: "山西" },
  "内蒙古": { col: 7, row: 2, label: "内蒙古" },
  "辽宁": { col: 10, row: 3, label: "辽宁" },
  "吉林": { col: 11, row: 2, label: "吉林" },
  "黑龙江": { col: 12, row: 1, label: "黑龙江" },
  "上海": { col: 10, row: 6, label: "上海" },
  "江苏": { col: 9, row: 6, label: "江苏" },
  "浙江": { col: 10, row: 7, label: "浙江" },
  "安徽": { col: 8, row: 6, label: "安徽" },
  "福建": { col: 10, row: 8, label: "福建" },
  "江西": { col: 8, row: 8, label: "江西" },
  "山东": { col: 9, row: 4, label: "山东" },
  "河南": { col: 7, row: 6, label: "河南" },
  "湖北": { col: 7, row: 8, label: "湖北" },
  "湖南": { col: 7, row: 9, label: "湖南" },
  "广东": { col: 8, row: 11, label: "广东" },
  "广西": { col: 6, row: 11, label: "广西" },
  "海南": { col: 7, row: 13, label: "海南" },
  "重庆": { col: 5, row: 8, label: "重庆" },
  "四川": { col: 4, row: 8, label: "四川" },
  "贵州": { col: 5, row: 10, label: "贵州" },
  "云南": { col: 4, row: 11, label: "云南" },
  "西藏": { col: 2, row: 9, label: "西藏" },
  "陕西": { col: 5, row: 6, label: "陕西" },
  "甘肃": { col: 4, row: 5, label: "甘肃" },
  "青海": { col: 3, row: 6, label: "青海" },
  "宁夏": { col: 5, row: 5, label: "宁夏" },
  "新疆": { col: 1, row: 4, label: "新疆" },
  "台湾": { col: 11, row: 9, label: "台湾" },
  "香港": { col: 9, row: 11, label: "香港" },
  "澳门": { col: 8, row: 12, label: "澳门" },
};

const worldCountryShapes: Record<string, { label: string; d: string }> = {
  US: { label: "United States", d: "M90 142 L110 132 L146 128 L182 130 L210 122 L248 128 L258 144 L244 158 L210 160 L176 168 L134 164 L98 154 Z" },
  CA: { label: "Canada", d: "M84 96 L112 82 L154 76 L196 82 L232 88 L248 102 L224 114 L184 114 L140 108 L100 112 Z" },
  GB: { label: "United Kingdom", d: "M398 114 L408 104 L418 108 L420 122 L410 132 L398 126 Z" },
  FR: { label: "France", d: "M414 148 L430 140 L448 146 L446 164 L430 172 L414 164 Z" },
  DE: { label: "Germany", d: "M446 132 L460 124 L472 134 L470 156 L454 162 L442 150 Z" },
  NL: { label: "Netherlands", d: "M438 126 L446 122 L452 128 L448 138 L438 136 Z" },
  RU: { label: "Russia", d: "M474 78 L534 70 L600 74 L658 88 L710 98 L730 118 L700 126 L650 122 L596 128 L544 120 L496 108 Z" },
  IN: { label: "India", d: "M560 198 L578 188 L594 196 L600 214 L586 236 L570 228 L562 210 Z" },
  CN: { label: "China", d: "M598 126 L638 112 L682 118 L716 132 L734 154 L720 174 L692 182 L664 176 L638 184 L614 174 L596 154 Z" },
  KR: { label: "Korea", d: "M734 138 L742 132 L746 144 L740 156 L732 150 Z" },
  JP: { label: "Japan", d: "M760 132 L772 124 L780 136 L776 152 L764 162 L756 150 Z" },
  TW: { label: "Taiwan", d: "M732 176 L740 174 L742 190 L734 196 Z" },
  HK: { label: "Hong Kong", d: "M720 186 L726 184 L728 190 L722 192 Z" },
  SG: { label: "Singapore", d: "M646 250 L652 248 L654 254 L648 256 Z" },
  MY: { label: "Malaysia", d: "M636 230 L648 224 L656 232 L652 250 L640 248 Z" },
  TH: { label: "Thailand", d: "M620 214 L632 206 L642 216 L638 236 L626 240 Z" },
  AU: { label: "Australia", d: "M720 278 L752 268 L790 274 L812 294 L804 320 L772 330 L734 322 L714 302 Z" },
};

const chinaProvinceShapes: Record<string, { label: string; d: string }> = {
  "新疆": { label: "新疆", d: "M84 110 L132 96 L170 108 L168 146 L130 156 L92 144 Z" },
  "西藏": { label: "西藏", d: "M156 176 L220 164 L266 180 L250 222 L180 226 L150 208 Z" },
  "青海": { label: "青海", d: "M222 150 L270 140 L298 156 L290 192 L246 198 L218 178 Z" },
  "甘肃": { label: "甘肃", d: "M276 122 L330 118 L338 154 L314 184 L274 178 L264 148 Z" },
  "内蒙古": { label: "内蒙古", d: "M286 70 L372 60 L470 70 L520 90 L486 112 L392 110 L308 98 Z" },
  "黑龙江": { label: "黑龙江", d: "M548 62 L606 58 L646 78 L632 116 L574 118 L540 94 Z" },
  "吉林": { label: "吉林", d: "M520 102 L560 96 L584 112 L574 138 L530 140 L510 120 Z" },
  "辽宁": { label: "辽宁", d: "M486 118 L522 116 L536 138 L520 158 L486 150 Z" },
  "北京": { label: "北京", d: "M446 136 L456 132 L462 140 L454 148 L444 144 Z" },
  "天津": { label: "天津", d: "M458 144 L468 142 L472 150 L462 156 Z" },
  "河北": { label: "河北", d: "M420 136 L452 124 L480 138 L478 176 L440 186 L414 164 Z" },
  "山西": { label: "山西", d: "M382 132 L416 128 L422 168 L392 182 L370 158 Z" },
  "陕西": { label: "陕西", d: "M330 150 L364 144 L382 172 L368 210 L334 204 L322 176 Z" },
  "宁夏": { label: "宁夏", d: "M344 132 L358 128 L366 138 L358 150 L344 146 Z" },
  "山东": { label: "山东", d: "M478 154 L520 150 L542 164 L530 186 L492 186 L474 172 Z" },
  "河南": { label: "河南", d: "M384 182 L430 178 L450 194 L438 220 L392 220 L374 200 Z" },
  "江苏": { label: "江苏", d: "M488 190 L522 184 L540 198 L536 222 L502 226 L486 210 Z" },
  "上海": { label: "上海", d: "M538 222 L546 220 L548 232 L540 234 Z" },
  "安徽": { label: "安徽", d: "M454 188 L490 186 L502 220 L470 230 L448 212 Z" },
  "湖北": { label: "湖北", d: "M380 226 L436 222 L450 240 L432 260 L386 258 L370 240 Z" },
  "浙江": { label: "浙江", d: "M500 224 L536 220 L548 246 L522 260 L494 248 Z" },
  "福建": { label: "福建", d: "M486 258 L522 252 L532 286 L504 298 L480 282 Z" },
  "江西": { label: "江西", d: "M440 240 L482 238 L494 276 L458 288 L434 266 Z" },
  "湖南": { label: "湖南", d: "M376 258 L428 256 L438 292 L392 302 L368 280 Z" },
  "重庆": { label: "重庆", d: "M320 238 L348 234 L358 258 L344 278 L320 268 Z" },
  "四川": { label: "四川", d: "M258 226 L324 220 L344 270 L294 300 L244 278 L238 244 Z" },
  "贵州": { label: "贵州", d: "M330 286 L372 282 L388 304 L356 320 L324 314 Z" },
  "云南": { label: "云南", d: "M248 286 L320 284 L330 322 L278 348 L228 324 Z" },
  "广东": { label: "广东", d: "M426 304 L484 298 L516 320 L494 346 L438 348 L414 324 Z" },
  "广西": { label: "广西", d: "M352 304 L422 298 L436 336 L380 350 L344 330 Z" },
  "海南": { label: "海南", d: "M408 360 L438 358 L448 378 L420 388 L400 376 Z" },
  "台湾": { label: "台湾", d: "M548 272 L564 268 L570 302 L556 314 L544 292 Z" },
  "香港": { label: "香港", d: "M500 336 L508 334 L510 342 L502 344 Z" },
  "澳门": { label: "澳门", d: "M492 338 L498 338 L500 344 L494 344 Z" },
};

function normalizeChinaRegionName(raw: string): string {
  const value = raw.trim();
  const map: Record<string, string> = {
    Beijing: "北京",
    Shanghai: "上海",
    Guangdong: "广东",
    Zhejiang: "浙江",
    Jiangsu: "江苏",
    Sichuan: "四川",
    Fujian: "福建",
    Hubei: "湖北",
    Hunan: "湖南",
    Shandong: "山东",
    Henan: "河南",
    Hebei: "河北",
    Shaanxi: "陕西",
    Liaoning: "辽宁",
    InnerMongolia: "内蒙古",
  };
  return map[value] || value.replace(/省|市|自治区|特别行政区/g, "");
}

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
    <div className="max-w-[18rem] rounded-full border border-stone-200 bg-stone-50/80 px-3 py-2">
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

function clampOpacity(value: number) {
  return Math.max(0.18, Math.min(0.92, value));
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

function HorizontalBarChart({ items }: { items: AnalyticsPostStat[] }) {
  const maxValue = Math.max(1, ...items.map((item) => item.successfulReads));
  return (
    <div className="space-y-4">
      {items.length === 0 ? <div className="text-sm text-stone-500">No recent hot posts.</div> : null}
      {items.map((item) => (
        <div key={item.slug} className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <ScrollTitle title={item.title} slug={item.slug} />
            <div className="min-w-16 text-right text-sm text-stone-600">{item.successfulReads}</div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-gradient-to-r from-stone-900 via-amber-700 to-amber-500" style={{ width: `${(item.successfulReads / maxValue) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function WorldMap({ items }: { items: AnalyticsLocationStat[] }) {
  const visible = items.filter((item) => worldCountryShapes[item.code]);
  const maxValue = Math.max(1, ...visible.map((item) => item.totalRequests), 1);
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.10),transparent_35%),linear-gradient(180deg,#fafaf9_0%,#f5f5f4_100%)]">
        <svg viewBox="0 0 860 400" className="w-full">
          <rect x="0" y="0" width="860" height="400" fill="transparent" />
          <g fill="none" stroke="#d6d3d1" strokeWidth="1.2" strokeLinejoin="round">
            <path d="M56 86 L120 70 L190 74 L256 90 L292 112 L286 150 L228 174 L152 166 L86 148 L52 120 Z" />
            <path d="M372 96 L432 78 L520 76 L612 84 L708 100 L776 132 L800 174 L774 214 L704 212 L628 196 L566 192 L492 178 L420 160 L380 132 Z" />
            <path d="M574 214 L634 214 L684 236 L700 280 L676 320 L618 336 L560 324 L528 286 L540 244 Z" />
            <path d="M274 286 L324 284 L352 302 L346 328 L302 334 L272 318 Z" />
          </g>
          {visible.map((item) => {
            const shape = worldCountryShapes[item.code];
            const intensity = clampOpacity(item.totalRequests / maxValue);
            return (
              <path
                key={item.code}
                d={shape.d}
                fill={`rgba(180, 83, 9, ${intensity})`}
                stroke={item.code === "CN" ? "#7c2d12" : "#9a3412"}
                strokeWidth={item.code === "CN" ? 2.3 : 1.6}
              >
                <title>{`${shape.label}: ${item.totalRequests}`}</title>
              </path>
            );
          })}
          <g fill="#44403c" fontSize="11" fontWeight="600">
            {visible.map((item) => {
              const point = worldCoordinates[item.code];
              return (
                <text key={`${item.code}-label`} x={`${(point.x / 100) * 860}`} y={`${(point.y / 100) * 400}`} textAnchor="middle">
                  {worldCountryShapes[item.code].label}
                </text>
              );
            })}
          </g>
        </svg>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {items.slice(0, 8).map((item) => (
          <div key={item.code} className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50/70 px-3 py-2 text-sm">
            <span>{worldCountryShapes[item.code]?.label || item.name}</span>
            <span className="font-medium text-stone-700">{item.totalRequests}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChinaGridMap({ items }: { items: AnalyticsLocationStat[] }) {
  const normalized = items.map((item) => ({ ...item, normalizedName: normalizeChinaRegionName(item.name || item.code) }));
  const maxValue = Math.max(1, ...normalized.map((item) => item.totalRequests), 1);
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/80 p-3">
        <svg viewBox="0 0 700 430" className="w-full">
          <g fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1.4" strokeLinejoin="round">
            {Object.entries(chinaProvinceShapes).map(([name, shape]) => {
              const item = normalized.find((entry) => entry.normalizedName === name);
              const intensity = item ? clampOpacity(item.totalRequests / maxValue) : 0;
              return (
                <path
                  key={name}
                  d={shape.d}
                  fill={item ? `rgba(180, 83, 9, ${intensity})` : "#f5f5f4"}
                  stroke={item ? "#92400e" : "#d6d3d1"}
                >
                  <title>{`${name}: ${item?.totalRequests ?? 0}`}</title>
                </path>
              );
            })}
          </g>
          <g fill="#44403c" fontSize="10" fontWeight="600">
            {Object.entries(chinaCoordinates).map(([name, point]) => (
              <text
                key={`${name}-label`}
                x={point.col * 50}
                y={point.row * 28 + 14}
                textAnchor="middle"
              >
                {name}
              </text>
            ))}
          </g>
        </svg>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {normalized.slice(0, 10).map((item) => (
          <div key={item.code} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
            <span>{item.normalizedName}</span>
            <span className="font-medium text-stone-700">{item.totalRequests}</span>
          </div>
        ))}
      </div>
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
            <button type="button" onClick={() => void handleRefresh()} className="bg-stone-900 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white hover:bg-stone-800" disabled={loading}>
              Apply
            </button>
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Global IP Origins" subtitle="Country-level concentration, powered by proxy geo headers when your deployment provides them.">
          <WorldMap items={stats?.countryLocations ?? []} />
        </Panel>
        <Panel title="China Region Origins" subtitle="Province-level heat grid for China traffic. Unknown or missing region headers will not appear here.">
          <ChinaGridMap items={stats?.chinaLocations ?? []} />
        </Panel>
      </div>

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

      <Panel title="Article Performance" subtitle="Dedicated post view. Long titles stay inside a horizontally scrollable pill instead of stretching the table.">
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
            <button
              type="button"
              onClick={() => {
                setFilters((current) => ({ ...current, slug: post.slug }));
                void loadDashboard(session, { ...filters, slug: post.slug });
              }}
              className="text-left"
            >
              <ScrollTitle title={post.title} slug={post.slug} />
            </button>,
            <div className="max-w-[14rem] break-all text-stone-500">{post.path || "/"}</div>,
            post.totalRequests,
            post.successfulReads,
            post.failedReads,
            post.uniqueIps,
            formatDateTime(post.latestAccessAt),
            <button
              type="button"
              onClick={() => {
                setFilters((current) => ({ ...current, slug: post.slug }));
                void loadDashboard(session, { ...filters, slug: post.slug });
              }}
              className="border border-stone-300 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-stone-600 hover:bg-stone-50"
            >
              filter
            </button>,
          ])}
        />
        <Pagination page={pagedPosts.page} totalPages={pagedPosts.totalPages} onChange={setPostPage} />
      </Panel>

      <Panel title="IP Observation Deck" subtitle="Dedicated IP view with quick self-IP filtering support and top-post context per address.">
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
            <button
              type="button"
              onClick={() => {
                setFilters((current) => ({ ...current, ip: ip.ip }));
                void loadDashboard(session, { ...filters, ip: ip.ip });
              }}
              className="space-y-1 text-left"
            >
              <div className="font-mono text-xs text-stone-900">{ip.ip}</div>
              <div className="text-xs text-stone-500">Last seen {formatDateTime(ip.lastSeenAt)}</div>
            </button>,
            ip.totalRequests,
            ip.successfulReads,
            ip.failedReads,
            ip.uniquePosts,
            <div className="max-w-[16rem] overflow-x-auto whitespace-nowrap text-xs text-stone-500 themed-scrollbar">{(ip.topPosts ?? []).join(" • ") || "-"}</div>,
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilters((current) => ({ ...current, ip: ip.ip }));
                  void loadDashboard(session, { ...filters, ip: ip.ip });
                }}
                className="border border-stone-300 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-stone-600 hover:bg-stone-50"
              >
                filter
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
              <div className="font-mono text-xs">{event.ip}</div>,
              <div className="text-xs text-stone-500">{[event.countryCode, event.region].filter(Boolean).join(" / ") || "Unknown"}</div>,
              <span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-medium", event.accessGranted ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                {event.accessGranted ? "Success" : "Blocked"}
              </span>,
            ])}
          />
        </Panel>
      </div>
    </section>
  );
}
