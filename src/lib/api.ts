import { apiBaseUrl } from "@/config/backend.config";
import { encodeSlugForPath } from "./postSlug";

export interface Post {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  visibility: "public" | "encrypted" | "hidden";
  excerpt: string;
  commentId?: string;
  path: string;
  content?: string;
  locked?: boolean;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Tag {
  name: string;
  count: number;
  description?: string;
}

export interface Folder {
  name: string;
  path: string;
  description?: string;
  children?: Folder[];
  postCount: number;  directPostCount?: number;}

export interface AnalyticsOverview {
  totalRequests: number;
  successfulReads: number;
  failedReads: number;
  uniqueIps: number;
  uniquePosts: number;
  requestsLast24h: number;
  successfulLast24: number;
}

export interface AnalyticsPostStat {
  slug: string;
  title: string;
  path: string;
  totalRequests: number;
  successfulReads: number;
  failedReads: number;
  uniqueIps: number;
  latestAccessAt?: string;
}

export interface AnalyticsIPStat {
  ip: string;
  totalRequests: number;
  successfulReads: number;
  failedReads: number;
  uniquePosts: number;
  lastSeenAt?: string;
  topPosts?: string[];
}

export interface AnalyticsTimeBucket {
  label: string;
  totalRequests: number;
  successfulReads: number;
  failedReads: number;
}

export interface AnalyticsReferrerStat {
  referrer: string;
  host: string;
  totalRequests: number;
  successfulReads: number;
  failedReads: number;
}

export interface PostViewEvent {
  slug: string;
  title: string;
  path: string;
  visibility: string;
  ip: string;
  userAgent: string;
  referrer: string;
  accessedAt: string;
  accessGranted: boolean;
}

export interface AnalyticsResponse {
  generatedAt: string;
  overview: AnalyticsOverview;
  posts: AnalyticsPostStat[];
  ips: AnalyticsIPStat[];
  daily: AnalyticsTimeBucket[];
  hourly: AnalyticsTimeBucket[];
  referrers: AnalyticsReferrerStat[];
  recentEvents: PostViewEvent[];
}

interface RelatedPostsResponse {
  sameTags: Post[];
  nearby: Post[];
}

const API_BASE = apiBaseUrl;

function normalizePost(post: Post): Post {
  return {
    ...post,
    tags: Array.isArray(post.tags) ? post.tags : [],
  };
}

function normalizePostListResponse(response: PostListResponse): PostListResponse {
  return {
    ...response,
    posts: Array.isArray(response.posts) ? response.posts.map(normalizePost) : [],
  };
}

// 获取文章列表
export async function getPosts(params?: {
  page?: number;
  limit?: number;
  tag?: string;
  path?: string;
  includeSubfolders?: boolean;
}): Promise<PostListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.tag) queryParams.append("tag", params.tag);
  if (params?.path) queryParams.append("path", params.path);
  if (params?.includeSubfolders) queryParams.append("include_subfolders", "true");

  const response = await fetch(`${API_BASE}/posts?${queryParams}`);
  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }

  const data = await response.json();
  return normalizePostListResponse(data);
}

// 获取文章详情
export async function getPostBySlug(slug: string, password?: string): Promise<Post> {
  const queryParams = new URLSearchParams();
  if (password) queryParams.append("password", password);
  const encodedSlug = encodeSlugForPath(slug);

  const response = await fetch(`${API_BASE}/posts/${encodedSlug}?${queryParams}`);
  if (!response.ok) {
    throw new Error("Post not found");
  }

  const data = await response.json();
  return normalizePost(data);
}

export async function getRelatedPosts(slug: string, limit: number = 5): Promise<RelatedPostsResponse> {
  const encodedSlug = encodeSlugForPath(slug);
  const response = await fetch(`${API_BASE}/related/${encodedSlug}?limit=${limit}`);
  if (!response.ok) {
    throw new Error("Failed to fetch related posts");
  }
  const data = (await response.json()) as RelatedPostsResponse;
  return {
    sameTags: Array.isArray(data.sameTags) ? data.sameTags.map(normalizePost) : [],
    nearby: Array.isArray(data.nearby) ? data.nearby.map(normalizePost) : [],
  };
}

// 获取所有标签
export async function getTags(): Promise<Tag[]> {
  const response = await fetch(`${API_BASE}/tags`);
  if (!response.ok) {
    throw new Error("Failed to fetch tags");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

// 获取文件夹结构
export async function getFolders(): Promise<Folder[]> {
  const response = await fetch(`${API_BASE}/folders`);
  if (!response.ok) {
    throw new Error("Failed to fetch folders");
  }

  return response.json();
}

// 搜索文章
export async function searchPosts(query: string): Promise<Post[]> {
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error("Search failed");
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizePost) : [];
}

export async function getAnalytics(
  password: string,
  params?: {
    slug?: string;
    ip?: string;
    from?: string;
    to?: string;
  },
): Promise<AnalyticsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.slug) queryParams.append("slug", params.slug);
  if (params?.ip) queryParams.append("ip", params.ip);
  if (params?.from) queryParams.append("from", params.from);
  if (params?.to) queryParams.append("to", params.to);

  const url = `${API_BASE}/admin/stats${queryParams.size ? `?${queryParams.toString()}` : ""}`;
  const response = await fetch(url, {
    headers: {
      "X-Password": password,
    },
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch analytics");
  }

  return response.json();
}
