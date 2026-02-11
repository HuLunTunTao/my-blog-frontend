import Header from "./Header";
import ModeTabs from "./ModeTabs";
import { Outlet, ScrollRestoration } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <div className="w-full max-w-prose px-6 md:px-0 flex flex-col min-h-screen">
        <Header />
        <ModeTabs />
        <main className="flex-1 py-12 animate-in fade-in duration-500">
          <Outlet />
        </main>
        <footer className="py-12 text-center text-xs text-subtle border-t border-border mt-auto">
          &copy; {new Date().getFullYear()} My Blog. All rights reserved.
        </footer>
      </div>
      <ScrollRestoration />
    </div>
  );
}
