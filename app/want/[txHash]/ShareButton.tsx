"use client";

export function ShareButton({ size = "default", title }: { size?: "default" | "equal"; title: string }) {
  function shareToX() {
    const params = new URLSearchParams({ text: `${title} - want` });
    params.set("url", window.location.href);
    window.open(`https://x.com/intent/tweet?${params.toString()}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="col-start-2">
      <button
        type="button"
        onClick={shareToX}
        className={
          size === "equal"
            ? "inline-flex h-7 min-w-14 items-center justify-center rounded border border-stone-700 bg-transparent px-2 text-xs text-stone-400 transition hover:border-sky-500 hover:text-sky-100 sm:h-8 sm:min-w-16 sm:px-3"
            : "inline-flex w-full items-center justify-center rounded-md border border-stone-100 bg-stone-100 px-5 py-3 text-sm text-stone-950 transition hover:border-sky-300 hover:bg-sky-100"
        }
      >
        share to x
      </button>
    </div>
  );
}
