"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet, useWalletList } from "@meshsdk/react";
import { explorerTxUrl } from "@/lib/explorer";
import { agreeWithWantTx } from "@/lib/tx";
import { useOutsideDismiss } from "@/lib/use-outside-dismiss";
import { isUserRejectedWalletError } from "@/lib/wallet-error";

export function AgreeButton({
  compact = false,
  size = "default",
  wantId
}: {
  compact?: boolean;
  size?: "default" | "equal";
  wantId: string;
}) {
  const router = useRouter();
  const wallets = useWalletList();
  const { connect, connected, connecting, wallet } = useWallet();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [pending, setPending] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeWalletMenu = useCallback(() => setWalletOpen(false), []);

  useOutsideDismiss(walletOpen, rootRef, closeWalletMenu);

  const submitSignal = useCallback(async () => {
    if (!wallet) return;

    setPending(false);
    setError(null);

    try {
      setStatus("waiting for wallet...");
      const submittedTxHash = await agreeWithWantTx(wallet, wantId);
      setTxHash(submittedTxHash);
      setStatus("submitted.");
      router.refresh();
    } catch (submitError) {
      setStatus(null);
      if (!isUserRejectedWalletError(submitError)) {
        setError(submitError instanceof Error ? submitError.message : "unable to submit signal");
      }
    }
  }, [router, wallet, wantId]);

  useEffect(() => {
    if (pending && connected && wallet) {
      queueMicrotask(() => {
        void submitSignal();
      });
    }
  }, [connected, pending, submitSignal, wallet]);

  async function connectWallet(walletId: string) {
    setError(null);
    setWalletOpen(false);
    setStatus("connecting wallet...");

    try {
      await connect(walletId);
    } catch (connectError) {
      setPending(false);
      setStatus(null);
      setError(connectError instanceof Error ? connectError.message : "could not connect");
    }
  }

  async function submit() {
    setError(null);
    setTxHash(null);

    if (!connected || !wallet) {
      setPending(true);

      if (wallets.length === 1) {
        await connectWallet(wallets[0].id);
        return;
      }

      setStatus(null);
      setWalletOpen(true);
      return;
    }

    await submitSignal();
  }

  return (
    <div ref={rootRef} className={compact ? "relative flex w-full flex-col items-end gap-2" : "relative space-y-2"}>
      <button
        type="button"
        onClick={submit}
        disabled={Boolean(status) || connecting}
        className={
          size === "equal"
            ? "h-7 min-w-14 rounded border border-stone-700 bg-transparent px-2 text-xs text-stone-400 transition hover:border-sky-500 hover:text-sky-100 disabled:cursor-wait disabled:opacity-60 sm:h-8 sm:min-w-16 sm:px-3"
            : compact
            ? "rounded-md border border-stone-100 bg-stone-100 px-3 py-2 text-sm text-stone-950 transition hover:border-sky-300 hover:bg-sky-100 disabled:cursor-wait disabled:opacity-60 sm:px-3"
            : "w-full rounded-md border border-stone-100 bg-stone-100 px-4 py-3 text-sm text-stone-950 transition hover:border-sky-300 hover:bg-sky-100 disabled:cursor-wait disabled:opacity-60"
        }
      >
        {connecting ? "connecting..." : "agree"}
      </button>
      {walletOpen ? (
        <div className="absolute right-0 top-full z-[60] mt-2 min-w-44 rounded-lg border border-stone-800 bg-stone-950 p-2 shadow-2xl shadow-black">
          {wallets.length > 0 ? (
            wallets.map((walletOption) => (
              <button
                key={walletOption.id}
                type="button"
                onClick={() => connectWallet(walletOption.id)}
                className="block w-full rounded-md px-3 py-2 text-left text-sm text-stone-200 transition hover:bg-sky-950/40 hover:text-sky-100"
              >
                {walletOption.name.toLowerCase()}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-stone-400">no wallet found.</p>
          )}
        </div>
      ) : null}
      {status ? (
        <p className={compact ? "max-w-64 break-all text-right text-xs text-stone-400" : "break-all text-xs text-stone-400"}>
          {status}{" "}
          {txHash ? (
            <a className="underline" href={explorerTxUrl(txHash)} target="_blank" rel="noreferrer">
              tx
            </a>
          ) : null}
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
