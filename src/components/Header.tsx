import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="flex flex-col items-center pt-16 pb-8 space-y-4">
      <div className="w-24 h-24 rounded-full bg-neutral-200 overflow-hidden">
        {/* Placeholder for Avatar */}
        <div className="w-full h-full bg-cover bg-center bg-neutral-300" />
      </div>
      
      <Link to="/" className="text-2xl font-serif font-medium tracking-wide">
        My Blog
      </Link>
      
      <p className="text-subtle font-serif italic text-sm">
        Just a whisper in the digital void.
      </p>
    </header>
  );
}
