import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet, ScrollRestoration } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <Sidebar />
      <Header />
      
      {/* Main Content Area */}
      {/* Added left margin for sidebar offset on desktop */}
      <main className="flex-1 md:ml-20 lg:ml-48 min-h-screen relative w-full">
        {/* Container for content - aligned slightly left or center, breathy */}
        <div className="w-full max-w-4xl mx-auto px-6 py-12 md:py-20 md:px-12 lg:px-24">
            <Outlet />
        </div>
        
        <footer className="py-12 text-center text-[10px] text-stone-300 md:hidden">
          &copy; {new Date().getFullYear()} My Blog.
        </footer>
      </main>
      
      {/* Global Scroll Restoration */}
      <ScrollRestoration />
    </div>
  );
}
