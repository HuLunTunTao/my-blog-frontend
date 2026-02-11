import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet, ScrollRestoration } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
          {/* Subtle Vertical Lines (Traditional Stationery Pattern) */}
          <div className="absolute inset-0 opacity-[0.02]" 
               style={{ 
                 backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px)', 
                 backgroundSize: '80px 100%',
                 maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' 
               }} 
          />
          
          {/* Ink Wash Blob - Top Right */}
          <div className="absolute -top-[20%] -right-[10%] w-[50vh] h-[50vh] bg-stone-900 rounded-full opacity-[0.03] blur-[120px]" />

          {/* Ink Wash Blob - Bottom Left */}
          <div className="absolute bottom-[10%] -left-[10%] w-[40vh] h-[40vh] bg-stone-800 rounded-full opacity-[0.02] blur-[100px]" />
          
          {/* Optional: Faint Branch Silhouette (very abstract) */}
          <svg className="absolute bottom-0 right-0 w-[30vh] h-[40vh] opacity-[0.03] text-stone-900" viewBox="0 0 100 200" preserveAspectRatio="none">
             <path d="M50 200 Q60 150 55 100 T70 0" stroke="currentColor" strokeWidth="2" fill="none"/>
             <path d="M55 120 Q80 110 90 90" stroke="currentColor" strokeWidth="1" fill="none"/>
             <path d="M52 160 Q20 150 10 130" stroke="currentColor" strokeWidth="1" fill="none"/>
          </svg>
      </div>

      <Sidebar />
      <Header />
      
      {/* Main Content Area */}
      {/* Added left margin for sidebar offset on desktop */}
      <main className="flex-1 md:ml-20 lg:ml-48 min-h-screen relative w-full z-10">
        {/* Container for content - aligned slightly left or center, breathy */}
        <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 md:px-12 lg:px-24">
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
