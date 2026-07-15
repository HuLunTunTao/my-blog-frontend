import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="md:hidden flex items-center justify-between p-6 border-b border-stone-100 dark:border-stone-800/60 bg-background sticky top-0 z-40">
       <nav className="flex gap-4 text-xs font-sans uppercase tracking-widest">
         <Link to="/" className="hover:text-foreground hover:underline hover:underline-offset-4">Time</Link>
         <Link to="/tags" className="hover:text-foreground hover:underline hover:underline-offset-4">Tags</Link>
         <Link to="/search" className="hover:text-foreground hover:underline hover:underline-offset-4">Srch</Link>
         <Link to="/guestbook" className="hover:text-foreground hover:underline hover:underline-offset-4">Note</Link>
       </nav>

       <ThemeToggle />
    </header>
  );
}
