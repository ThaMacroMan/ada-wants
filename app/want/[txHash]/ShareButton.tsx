"use client";

import { useState } from "react";

export function ShareButton({ size = "default", title }: { size?: "default" | "equal"; title: string }) {
  const [status, setStatus] = useState<string | null>(null);

  async function share() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setStatus("shared.");
        return;
      }

      await navigator.clipboard.writeText(url);
      setStatus("copied link.");
    } catch {
      setStatus("share cancelled.");
    }
  }

  return (
    <div className="col-start-2 space-y-1">
      <button
        type="button"
        onClick={share}
        className={
          size === "equal"
            ? "h-7 min-w-14 rounded border border-stone-700 bg-transparent px-2 text-xs text-stone-400 transition hover:border-sky-500 hover:text-sky-100 sm:h-8 sm:min-w-16 sm:px-3"
            : "w-full rounded-md border border-stone-100 bg-stone-100 px-5 py-3 text-sm text-stone-950 transition hover:border-sky-300 hover:bg-sky-100"
        }
      >
        share
      </button>
      {status ? <p className="text-xs text-stone-400">{status}</p> : null}
    </div>
  );
}
