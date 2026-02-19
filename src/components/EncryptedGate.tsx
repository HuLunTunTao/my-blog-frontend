import { useState } from "react";

export default function EncryptedGate({ onUnlock }: { onUnlock: (password: string) => Promise<boolean> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleUnlock = async () => {
    const ok = await onUnlock(password);
    if (!ok) {
        setError(true);
        return;
    }
    setError(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-lg bg-neutral-50/50">
      <h3 className="text-lg font-serif mb-4">This post is encrypted</h3>
      <div className="flex flex-col items-center space-y-4">
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
            type="button"
            onClick={() => void handleUnlock()}
            className="text-xs uppercase tracking-widest hover:text-neutral-500 transition-colors"
        >
            [ Unlock ]
        </button>
        {error && <p className="text-red-500 text-xs">Incorrect password</p>}
      </div>
    </div>
  );
}
