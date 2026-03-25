import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import TimelineView from "./components/TimelineView";
import AllTagsPage from "./pages/AllTagsPage";
import TagDetailPage from "./pages/TagDetailPage";
import SearchPage from "./pages/SearchPage";
import PostPage from "./pages/PostPage";
import FoldersPage from "./pages/FoldersPage";
import FolderDetailPage from "./pages/FolderDetailPage";
import { Suspense, lazy, useEffect } from "react";
import { siteConfig } from "./config/site.config";

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
      { path: "posts/*", element: <PostPage /> },
      { path: "folders", element: <FoldersPage /> },
      { path: "folders/:path", element: <FolderDetailPage /> },
      {
        path: "ops/analytics",
        element: (
          <Suspense fallback={<div className="py-24 text-center text-stone-500">Loading analytics workspace...</div>}>
            <AnalyticsPage />
          </Suspense>
        ),
      },
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
