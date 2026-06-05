import { CreateWantModal } from "@/components/CreateWantModal";
import { WalletConnect } from "@/components/WalletConnect";
import { WantCard } from "@/components/WantCard";
import { summarizeWantRows } from "@/lib/ai-summary";
import { indexWantsFromChain } from "@/lib/indexer";
import { TREASURY_ADDRESS } from "@/lib/constants";
import type { Want } from "@/types/want";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let wants: Want[] = [];
  let error: string | null = null;

  try {
    wants = await indexWantsFromChain();
  } catch (indexError) {
    error = indexError instanceof Error ? indexError.message : "unable to load wants";
  }

  const summaries = await summarizeWantRows(wants);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 lowercase sm:px-5 sm:py-8">
      <header className="relative border-b border-stone-800 pb-6 sm:pb-8">
        <div>
          <CreateWantModal />
        </div>
        <p className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 text-xl font-medium tracking-normal sm:text-2xl">
          ada wants
        </p>
        <div className="absolute right-0 top-0 z-[100]">
          <WalletConnect />
        </div>
      </header>

      {error ? (
        <div className="mt-8 rounded-lg border border-red-500 bg-red-950/40 p-4 text-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 py-8 sm:gap-4">
        {wants.length > 0 ? (
          wants.map((want) => <WantCard key={want.id} summary={summaries[want.id]} want={want} />)
        ) : (
          <div className="rounded-lg border border-stone-800 bg-stone-950/80 p-8 text-stone-300">
            no wants yet.
          </div>
        )}
      </section>

      <footer className="mt-auto border-t border-stone-800 py-5 text-sm text-stone-500">
        {TREASURY_ADDRESS ? (
          <a
            className="text-xs underline"
            href={`https://pool.pm/${TREASURY_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            tresasury
          </a>
        ) : null}
      </footer>
    </main>
  );
}
