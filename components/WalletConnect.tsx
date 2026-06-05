"use client";

import { useCallback, useRef, useState } from "react";
import { useWallet, useWalletList } from "@meshsdk/react";
import { useOutsideDismiss } from "@/lib/use-outside-dismiss";

export function WalletConnect() {
  const wallets = useWalletList();
  const { address, connect, connected, connecting, disconnect } = useWallet();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeMenu = useCallback(() => setOpen(false), []);

  useOutsideDismiss(open && !connected, rootRef, closeMenu);

  async function connectWallet(walletId: string) {
    setError(null);
    setOpen(false);

    try {
      await connect(walletId);
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "could not connect");
    }
  }

  async function handleClick() {
    if (connected) {
      disconnect();
      return;
    }

    if (wallets.length === 1) {
      await connectWallet(wallets[0].id);
      return;
    }

    setOpen((current) => !current);
  }

  const label =
    connected && address ? `${address.slice(0, 6)}...${address.slice(-6)}` : "connect";

  return (
    <div ref={rootRef} className="relative flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={connecting}
        className="rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-stone-100 transition hover:border-sky-500 hover:text-sky-100 disabled:cursor-wait disabled:opacity-60 sm:px-5 sm:py-3 sm:text-sm"
      >
        {connecting ? "connecting..." : label}
      </button>

      {open && !connected ? (
        <div className="absolute right-0 top-full z-[60] mt-2 min-w-44 rounded-lg border border-stone-800 bg-stone-950 p-2 shadow-2xl shadow-black">
          {wallets.length > 0 ? (
            wallets.map((wallet) => (
              <button
                key={wallet.id}
                type="button"
                onClick={() => connectWallet(wallet.id)}
                className="block w-full rounded-md px-3 py-2 text-left text-sm text-stone-200 transition hover:bg-sky-950/40 hover:text-sky-100"
              >
                {wallet.name.toLowerCase()}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-stone-400">no wallet found.</p>
          )}
        </div>
      ) : null}

      {error ? (
        <p className="absolute right-0 top-full mt-2 min-w-56 text-right text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
