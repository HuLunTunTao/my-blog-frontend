import { useState } from "react";
import { Post } from "@/data/mockData";

export default function EncryptedGate({ post, onUnlock }: { post: Post; onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === post.encryptedPassword) {
        onUnlock();
    } else {
        setError(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-lg bg-neutral-50/50">
      <h3 className="text-lg font-serif mb-4">This post is encrypted</h3>
      <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
          }}
          placeholder="Enter password"
          className="border-b border-neutral-300 bg-transparent text-center focus:outline-none focus:border-black transition-colors py-1"
        />
        <button 
            type="submit"
            className="text-xs uppercase tracking-widest hover:text-neutral-500 transition-colors"
        >
            [ Unlock ]
        </button>
        {error && <p className="text-red-500 text-xs">Incorrect password</p>}
      </form>
    </div>
  );
}
