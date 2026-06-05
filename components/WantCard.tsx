import Link from "next/link";
import type { Want } from "@/types/want";
import { AgreeButton } from "./AgreeButton";

export function WantCard({ summary, want }: { summary?: string; want: Want }) {
  const commentActivity = getCommentActivity(want);

  return (
    <article className="relative rounded-lg border border-stone-800 bg-stone-950/80 p-3 transition hover:z-50 hover:border-stone-600 focus-within:z-50 sm:p-4">
      <Link href={`/want/${want.id}`} className="absolute inset-0 rounded-lg" aria-label={want.title} />
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6">
        <div className="min-w-0">
          <p className="truncate text-lg font-medium sm:text-xl">{want.title}</p>
          {summary ? <p className="mt-0.5 truncate text-xs leading-tight text-stone-500 sm:text-sm">{summary}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-none text-stone-400 sm:justify-center sm:text-center sm:text-sm">
          <span className="inline-flex items-center gap-1.5">
            <AdaIcon />
            <span>{want.adaSignaled}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CommentIcon />
            <span>{want.comments.length}</span>
          </span>
          {commentActivity ? <span className="text-stone-500">{commentActivity}</span> : null}
        </div>
        <div className="relative z-10 hidden justify-self-end sm:block">
          <AgreeButton compact wantId={want.id} />
        </div>
      </div>
    </article>
  );
}

function AdaIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 text-stone-500">
      <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.9 10.8 8 4.9l2.1 5.9M6.7 8.8h2.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 text-stone-500">
      <path
        d="M4.2 4.2h7.6a1.7 1.7 0 0 1 1.7 1.7v3.4a1.7 1.7 0 0 1-1.7 1.7H8.5l-3.1 2v-2h-1.2a1.7 1.7 0 0 1-1.7-1.7V5.9a1.7 1.7 0 0 1 1.7-1.7Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function getCommentActivity(want: Want) {
  const latestComment = want.comments[0];
  if (!latestComment) return null;

  return formatActivityTime(latestComment.blockTime);
}

function formatActivityTime(blockTime: number | null) {
  if (!blockTime) return "on-chain";

  const secondsAgo = Math.max(0, Math.floor(Date.now() / 1000) - blockTime);
  if (secondsAgo < 60) return "just now";

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `${minutesAgo}m ago`;

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 30) return `${daysAgo}d ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: new Date(blockTime * 1000).getFullYear() === new Date().getFullYear() ? undefined : "numeric"
  }).format(new Date(blockTime * 1000));
}
