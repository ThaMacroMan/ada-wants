"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet, useWalletList } from "@meshsdk/react";
import { explorerTxUrl } from "@/lib/explorer";
import { createWantTx } from "@/lib/tx";
import { useOutsideDismiss } from "@/lib/use-outside-dismiss";
import { isUserRejectedWalletError } from "@/lib/wallet-error";

export function CreateWantModal() {
  const wallets = useWalletList();
  const { connect, connected, connecting, wallet } = useWallet();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeWalletMenu = useCallback(() => {
    setWalletOpen(false);
    setPending(false);
  }, []);

  useOutsideDismiss(walletOpen, rootRef, closeWalletMenu);

  const submitWant = useCallback(async () => {
    if (!wallet) return;

    setPending(false);
    setError(null);

    try {
      setStatus("waiting for wallet...");
      const submittedTxHash = await createWantTx(wallet, title);
      setTxHash(submittedTxHash);
      setStatus("submitted.");
    } catch (submitError) {
      setStatus(null);
      if (!isUserRejectedWalletError(submitError)) {
        setError(submitError instanceof Error ? submitError.message : "unable to create want");
      }
    }
  }, [title, wallet]);

  useEffect(() => {
    if (pending && connected && wallet) {
      queueMicrotask(() => {
        void submitWant();
      });
    }
  }, [connected, pending, submitWant, wallet]);

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

    await submitWant();
  }

  function cancel() {
    setOpen(false);
    setWalletOpen(false);
    setPending(false);
  }

  return (
    <div ref={rootRef} className="relative z-[80] w-full">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="rounded-md border border-sky-200 bg-sky-100 px-3 py-2 text-xs text-sky-950 transition hover:border-sky-300 hover:bg-sky-200 sm:px-4 sm:py-2.5 sm:text-sm"
      >
        + want
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity,transform] duration-200 ease-out ${
          open ? "grid-rows-[1fr] opacity-100 translate-y-0" : "grid-rows-[0fr] -translate-y-1 opacity-0"
        }`}
      >
        <div className={open ? "overflow-visible" : "overflow-hidden"}>
          <div className="mt-4 rounded-lg border border-stone-800 bg-stone-950/80 p-3 text-left">
            <div className="space-y-3">
              <label className="block">
                <span className="sr-only">what do you want?</span>
                <div className="relative">
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={100}
                    disabled={!open}
                    placeholder="what do you want?"
                    className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 pr-16 text-sm text-stone-50 outline-none transition placeholder:text-stone-500 focus:border-sky-300 sm:py-3 sm:text-base"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500">
                    {title.length}/100
                  </span>
                </div>
              </label>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={submit}
                    disabled={Boolean(status && !txHash) || connecting}
                    className="rounded-md border border-sky-200 bg-sky-100 px-3 py-1.5 text-xs text-sky-950 transition hover:border-sky-300 hover:bg-sky-200 disabled:cursor-wait disabled:opacity-60 sm:px-4 sm:py-2 sm:text-sm"
                  >
                    {connecting ? "connecting..." : "send"}
                  </button>

                  {walletOpen ? (
                    <div className="absolute left-0 top-full z-[60] mt-2 min-w-44 rounded-lg border border-stone-800 bg-stone-950 p-2 shadow-2xl shadow-black">
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
                </div>
                <button
                  type="button"
                  onClick={cancel}
                  className="px-2 py-1.5 text-xs text-stone-500 transition hover:text-sky-200 sm:py-2 sm:text-sm"
                >
                  cancel
                </button>
              </div>

              {txHash ? (
                <p className="break-all text-sm text-stone-400">
                  submitted.{" "}
                  <a className="underline" href={explorerTxUrl(txHash)} target="_blank" rel="noreferrer">
                    tx
                  </a>
                </p>
              ) : status ? (
                <p className="break-all text-sm text-stone-400">{status}</p>
              ) : null}
              {error ? <p className="text-sm text-red-300">{error}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
