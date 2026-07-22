import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import TimelineView from "./components/TimelineView";
import RouteErrorPage from "./components/RouteErrorPage";
import { lazy } from "react";

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
    errorElement: <RouteErrorPage />,
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
