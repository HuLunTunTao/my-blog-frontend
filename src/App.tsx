import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import TimelineView from "./components/TimelineView";
import AllTagsPage from "./pages/AllTagsPage";
import TagDetailPage from "./pages/TagDetailPage";
import SearchPage from "./pages/SearchPage";
import PostPage from "./pages/PostPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <TimelineView /> },
      { path: "tags", element: <AllTagsPage /> },
      { path: "tags/:tag", element: <TagDetailPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "posts/:slug", element: <PostPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
