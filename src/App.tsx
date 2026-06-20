import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import TimelineView from "./components/TimelineView";
import { lazy, useEffect } from "react";
import { siteConfig } from "./config/site.config";
import { warmImageCache } from "./lib/imageCache";

const AllTagsPage = lazy(() => import("./pages/AllTagsPage"));
const TagDetailPage = lazy(() => import("./pages/TagDetailPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const PostPage = lazy(() => import("./pages/PostPage"));
const FoldersPage = lazy(() => import("./pages/FoldersPage"));
const FolderDetailPage = lazy(() => import("./pages/FolderDetailPage"));
const GuestbookPage = lazy(() => import("./pages/GuestbookPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <TimelineView /> },
      { path: "tags", element: <AllTagsPage /> },
      { path: "tags/:tag", element: <TagDetailPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "guestbook", element: <GuestbookPage /> },
      { path: "posts/*", element: <PostPage /> },
      { path: "p/:shortId", element: <PostPage /> },
      { path: "folders", element: <FoldersPage /> },
      { path: "folders/:path", element: <FolderDetailPage /> },
      { path: "ops/analytics", element: <AnalyticsPage /> },
    ],
  },
]);

function App() {
  useEffect(() => {
    // Update Favicon (Browser Tab Logo)
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) {
      link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${siteConfig.logo}</text></svg>`;
    }

    void warmImageCache(siteConfig.author.avatar);
  }, []);

  return (
    <RouterProvider
      router={router}
      future={{
        v7_startTransition: true,
      }}
    />
  );
}

export default App;
