import { format, parseISO } from "date-fns";
import * as api from "./api";

// Re-export types from API
export type { Post, Tag, Folder, PostListResponse } from "./api";

// 兼容旧的 FolderNode 类型
export interface FolderNode {
  name: string;
  path: string;
  description?: string;
  children: FolderNode[];
  posts: api.Post[];
  postCount?: number;
  directPostCount?: number; // 新增
}

// 将 API Folder 转换为 FolderNode（兼容旧代码）
function convertFolderToNode(folder: api.Folder): FolderNode {
  return {
    name: folder.name,
    path: folder.path,
    description: folder.description,
    children: (folder.children || []).map(convertFolderToNode),
    posts: [],
    postCount: folder.postCount,
    directPostCount: folder.directPostCount // 映射
  };
}

// Build folder tree structure from API
export async function buildFolderTree(): Promise<FolderNode> {
  const folders = await api.getFolders();
  
  const root: FolderNode = {
    name: '根目录',
    path: '',
    children: folders.map(convertFolderToNode),
    posts: [],
    postCount: 0
  };

  return root;
}

// Get a specific folder by path
export async function getFolderByPath(path: string): Promise<FolderNode | undefined> {
  const tree = await buildFolderTree();
  
  if (!path || path === '') {
    return tree;
  }

  const parts = path.split('/');
  let current: FolderNode | undefined = tree;

  for (const part of parts) {
    if (!current) return undefined;
    current = current.children.find(child => child.name === part);
  }

  return current;
}

// Get all posts under a folder (including subfolders)
export async function getAllPostsInFolder(
  path: string, 
  includeSubfolders: boolean = false,
  page: number = 1,
  limit: number = 100
): Promise<api.PostListResponse> {
  return api.getPosts({ path, includeSubfolders, page, limit });
}

// Get all posts (with pagination)
export async function getAllPosts(page: number = 1, limit: number = 100): Promise<api.PostListResponse> {
  return api.getPosts({ page, limit });
}

// Get visible posts for timeline
export async function getTimelinePosts(page: number = 1, limit: number = 100): Promise<api.Post[]> {
  const response = await api.getPosts({ page, limit });
  return response.posts;
}

// Get post by slug
export async function getPostBySlug(slug: string, password?: string): Promise<api.Post | undefined> {
  try {
    return await api.getPostBySlug(slug, password);
  } catch (error) {
    console.error("Failed to fetch post:", error);
    return undefined;
  }
}

// Get posts by tag (with pagination)
export async function getPostsByTag(tag: string, page: number = 1, limit: number = 100): Promise<api.PostListResponse> {
  return api.getPosts({ tag, page, limit });
}

// Search posts
export async function searchPosts(query: string): Promise<api.Post[]> {
  return api.searchPosts(query);
}

// Group posts by year and month
export function groupPostsByYearMonth(posts: api.Post[]) {
  const groups: Record<string, Record<string, api.Post[]>> = {};

  posts.forEach((post) => {
    const date = parseISO(post.date);
    const year = format(date, "yyyy");
    const month = format(date, "MM");

    if (!groups[year]) groups[year] = {};
    if (!groups[year][month]) groups[year][month] = [];

    groups[year][month].push(post);
  });

  return groups;
}

// Get related posts by tags
export async function getRelatedPostsByTags(currentSlug: string, tags: string[]): Promise<api.Post[]> {
  if (tags.length === 0) return [];
  const related = await api.getRelatedPosts(currentSlug, 5);
  return related.sameTags;
}

// Get posts near a given date
export async function getNearbyPostsByDate(
  currentSlug: string,
  _currentDate: string,
  limit: number = 5
): Promise<api.Post[]> {
  const related = await api.getRelatedPosts(currentSlug, limit);
  return related.nearby;
}

// Get all tags
export async function getAllTags(): Promise<api.Tag[]> {
  return api.getTags();
}
