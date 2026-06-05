"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet, useWalletList } from "@meshsdk/react";
import { explorerTxUrl } from "@/lib/explorer";
import { commentOnWantTx } from "@/lib/tx";
import { useOutsideDismiss } from "@/lib/use-outside-dismiss";
import { isUserRejectedWalletError } from "@/lib/wallet-error";

export function CommentButton({
  compact = false,
  size = "default",
  wantId
}: {
  compact?: boolean;
  size?: "default" | "equal";
  wantId: string;
}) {
  const wallets = useWalletList();
  const { connect, connected, connecting, wallet } = useWallet();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [openAfterConnect, setOpenAfterConnect] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [text, setText] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeWalletMenu = useCallback(() => {
    setWalletOpen(false);
    if (!pending) {
      setOpenAfterConnect(false);
    }
  }, [pending]);

  useOutsideDismiss(walletOpen, rootRef, closeWalletMenu);

  const submitComment = useCallback(async () => {
    if (!wallet) return;

    setPending(false);
    setError(null);
    setTxHash(null);

    try {
      setStatus("waiting for wallet...");
      const submittedTxHash = await commentOnWantTx(wallet, wantId, text);
      setTxHash(submittedTxHash);
      setStatus("submitted.");
    } catch (submitError) {
      setStatus(null);
      if (!isUserRejectedWalletError(submitError)) {
        setError(submitError instanceof Error ? submitError.message : "unable to comment");
      }
    }
  }, [text, wallet, wantId]);

  useEffect(() => {
    if (pending && connected && wallet) {
      queueMicrotask(() => {
        void submitComment();
      });
    }
  }, [connected, pending, submitComment, wallet]);

  useEffect(() => {
    if (openAfterConnect && connected && wallet) {
      queueMicrotask(() => {
        setOpenAfterConnect(false);
        setStatus(null);
        setOpen(true);
        textareaRef.current?.focus();
      });
    }
  }, [connected, openAfterConnect, wallet]);

  async function connectWallet(walletId: string) {
    setError(null);
    setWalletOpen(false);
    setStatus("connecting wallet...");

    try {
      await connect(walletId);
    } catch (connectError) {
      setPending(false);
      setOpenAfterConnect(false);
      setStatus(null);
      setError(connectError instanceof Error ? connectError.message : "could not connect");
    }
  }

  async function openComment() {
    setError(null);
    setTxHash(null);

    if (!connected || !wallet) {
      setOpenAfterConnect(true);

      if (wallets.length === 1) {
        await connectWallet(wallets[0].id);
        return;
      }

      setStatus(null);
      setWalletOpen(true);
      return;
    }

    setWalletOpen(false);
    setOpen(!open);
    if (!open) {
      queueMicrotask(() => textareaRef.current?.focus());
    }
  }

  async function submit() {
    setError(null);
    setTxHash(null);

    if (!connected || !wallet) {
      setPending(true);
      setOpenAfterConnect(false);

      if (wallets.length === 1) {
        await connectWallet(wallets[0].id);
        return;
      }

      setStatus(null);
      setWalletOpen(true);
      return;
    }

    await submitComment();
  }

  function cancel() {
    setOpen(false);
    setWalletOpen(false);
    setOpenAfterConnect(false);
  }

  return (
    <div ref={rootRef} className={size === "equal" ? "contents" : "w-full"}>
      <div className="relative">
        <button
          type="button"
          aria-expanded={open || walletOpen}
          onClick={openComment}
          disabled={connecting}
          className={
            size === "equal"
              ? "h-7 min-w-16 rounded border border-stone-700 px-2 text-xs text-stone-400 transition hover:border-sky-500 hover:text-sky-100 disabled:cursor-wait disabled:opacity-60 sm:h-8 sm:min-w-20 sm:px-3"
              : compact
              ? "rounded-md border border-stone-700 px-3 py-2 text-sm text-stone-300 transition hover:border-sky-300 hover:bg-sky-100 hover:text-sky-950 disabled:cursor-wait disabled:opacity-60"
              : "rounded-md border border-stone-700 px-4 py-3 text-sm text-stone-300 transition hover:border-sky-300 hover:bg-sky-100 hover:text-sky-950 disabled:cursor-wait disabled:opacity-60"
          }
        >
          {connecting ? "connecting..." : "comment"}
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
      </div>

      <div
        className={`col-span-full grid transition-[grid-template-rows,opacity,transform] duration-200 ease-out ${
          open ? "grid-rows-[1fr] opacity-100 translate-y-0" : "grid-rows-[0fr] -translate-y-1 opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-3 space-y-2">
            <div className="relative">
              <label className="sr-only">comment</label>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={240}
                rows={2}
                disabled={!open}
                placeholder="comment"
                className="w-full resize-none rounded-md border border-stone-800 bg-transparent px-3 pb-12 pt-3 text-sm text-stone-50 outline-none transition placeholder:text-stone-600 focus:border-sky-500"
              />
              <span className="pointer-events-none absolute bottom-3 right-3 text-xs text-stone-600">
                {text.length}/240
              </span>
              <div className="absolute bottom-2 left-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={Boolean(status && !txHash) || connecting}
                  className="rounded border border-stone-700 bg-stone-950 px-2 py-1 text-xs text-stone-200 transition hover:border-sky-500 hover:text-sky-100 disabled:cursor-wait disabled:opacity-60"
                >
                  {connecting ? "connecting..." : "comment"}
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  className="px-1 py-1 text-xs text-stone-600 transition hover:text-sky-300"
                >
                  cancel
                </button>
              </div>
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
  );
}
