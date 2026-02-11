import { Link } from "react-router-dom";
import { siteConfig } from "@/config/site.config";

export default function Header() {
  return (
    <header className="md:hidden flex items-center justify-between p-6 border-b border-stone-100 bg-background/80 backdrop-blur sticky top-0 z-40">
       <div />
       
       {/* Simple Mobile Menu Trigger (Ideally would open a drawer, but for prototype links are fine) */}
       <nav className="flex gap-4 text-xs font-sans uppercase tracking-widest">
         <Link to="/" className="hover:text-foreground hover:underline hover:underline-offset-4">Time</Link>
         <Link to="/tags" className="hover:text-foreground hover:underline hover:underline-offset-4">Tags</Link>
         <Link to="/search" className="hover:text-foreground hover:underline hover:underline-offset-4">Srch</Link>
       </nav>
    </header>
  );
}
