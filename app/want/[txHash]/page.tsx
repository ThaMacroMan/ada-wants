import Link from "next/link";
import { AgreeButton } from "@/components/AgreeButton";
import { CommentButton } from "@/components/CommentButton";
import { CreateWantModal } from "@/components/CreateWantModal";
import { WalletConnect } from "@/components/WalletConnect";
import { summarizeCommentRows, summarizeWantRows } from "@/lib/ai-summary";
import { indexWantsFromChain } from "@/lib/indexer";
import { isValidTxHash } from "@/lib/metadata";
import { ShareButton } from "./ShareButton";

export const dynamic = "force-dynamic";

export default async function WantPage({ params }: { params: Promise<{ txHash: string }> }) {
  const { txHash } = await params;

  if (!isValidTxHash(txHash)) {
    return <NotFound message="want not found on-chain." />;
  }

  const wants = await indexWantsFromChain();
  const want = wants.find((item) => item.id === txHash.toLowerCase());

  if (!want) {
    return <NotFound message="want not found on-chain." />;
  }

  const [wantSummaries, commentSummaries] = await Promise.all([
    summarizeWantRows([want]),
    summarizeCommentRows(want.comments)
  ]);
  const wantSummary = wantSummaries[want.id];

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-5 lowercase sm:px-5 sm:py-8">
      <header className="relative border-b border-stone-800 pb-6 sm:pb-8">
        <div>
          <CreateWantModal />
        </div>
        <Link
          href="/"
          className="absolute left-1/2 top-2 -translate-x-1/2 text-xl font-medium tracking-normal hover:underline sm:text-2xl"
        >
          want
        </Link>
        <div className="absolute right-0 top-0">
          <WalletConnect />
        </div>
      </header>

      <article className="py-5 sm:py-8">
        <div className="rounded-lg border border-stone-800 bg-stone-950/80 p-3 sm:p-5">
          <div>
            <h1 className="break-words text-3xl font-medium leading-tight sm:text-5xl sm:leading-tight">{want.title}</h1>
            {wantSummary ? <p className="mt-2 text-xs text-stone-500 sm:mt-3 sm:text-sm">{wantSummary}</p> : null}
            <p className="mt-2 text-xs text-stone-400 sm:mt-3 sm:text-sm">{want.adaSignaled} ada want</p>
            <div className="mt-4 grid grid-cols-[1fr_auto_auto_auto] items-end gap-2 sm:mt-5">
              <ShareButton size="equal" title={want.title} />
              <AgreeButton compact size="equal" wantId={want.id} />
              <CommentButton compact size="equal" wantId={want.id} />
            </div>
          </div>

          <section className="mt-6 sm:mt-8">
            <h2 className="text-lg font-medium sm:text-xl">comments</h2>
            <div className="mt-3 divide-y divide-stone-800 rounded-lg border border-stone-800 bg-black/20 sm:mt-4">
            {want.comments.length > 0 ? (
              want.comments.map((comment) => (
                <div
                  key={comment.txHash}
                  className="p-3 text-xs text-stone-300 sm:p-4 sm:text-sm"
                >
                  <p className="whitespace-pre-wrap">{comment.text}</p>
                  {commentSummaries[comment.txHash] ? (
                    <p className="mt-2 text-xs text-stone-500">{commentSummaries[comment.txHash]}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="p-3 text-xs text-stone-500 sm:p-4 sm:text-sm">no comments yet.</p>
            )}
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}

function NotFound({ message }: { message: string }) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-8 lowercase">
      <Link href="/" className="text-sm underline">
        want
      </Link>
      <div className="mt-8 rounded-lg border border-stone-800 bg-stone-950/80 p-8">{message}</div>
    </main>
  );
}
