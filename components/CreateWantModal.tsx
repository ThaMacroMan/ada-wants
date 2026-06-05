"use client";

import { useState } from "react";
import { useWallet } from "@meshsdk/react";
import { explorerTxUrl } from "@/lib/explorer";
import { createWantTx } from "@/lib/tx";
import { isUserRejectedWalletError } from "@/lib/wallet-error";

export function CreateWantModal() {
  const { connected, wallet } = useWallet();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setTxHash(null);

    if (!connected || !wallet) {
      setError("connect a wallet first.");
      return;
    }

    try {
      setStatus("waiting for wallet...");
      setStatus("submitting...");
      const submittedTxHash = await createWantTx(wallet, title);
      setTxHash(submittedTxHash);
      setStatus("submitted.");
    } catch (submitError) {
      setStatus(null);
      if (!isUserRejectedWalletError(submitError)) {
        setError(submitError instanceof Error ? submitError.message : "unable to create want.");
      }
    }
  }

  return (
    <div className="w-full">
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
        <div className="overflow-hidden">
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
                <button
                  type="button"
                  onClick={submit}
                  disabled={Boolean(status && !txHash)}
                  className="rounded-md border border-sky-200 bg-sky-100 px-3 py-1.5 text-xs text-sky-950 transition hover:border-sky-300 hover:bg-sky-200 disabled:cursor-wait disabled:opacity-60 sm:px-4 sm:py-2 sm:text-sm"
                >
                  + want
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
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
