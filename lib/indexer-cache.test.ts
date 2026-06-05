import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createTxHash = "a".repeat(64);

function createMetadata(title: string) {
  return {
    app: "proof-of-want",
    v: 1,
    op: "create",
    title: [title],
    body: [],
    ts: 1770000000
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });

  return { promise, resolve };
}

describe("indexer cache", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T19:00:00.000Z"));
    process.env.NEXT_PUBLIC_TREASURY_ADDRESS = "addr_test1treasury";
    process.env.WANTS_CACHE_TTL_MS = "1000";
    process.env.WANTS_STALE_CACHE_TTL_MS = "10000";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.doUnmock("./blockfrost");
    delete process.env.WANTS_CACHE_TTL_MS;
    delete process.env.WANTS_STALE_CACHE_TTL_MS;
  });

  it("shares one cold-start index refresh across concurrent callers", async () => {
    const addressTransactions = deferred<Array<{ tx_hash: string; block_time: number }>>();
    const fetchAddressTransactions = vi.fn(() => addressTransactions.promise);

    vi.doMock("./blockfrost", () => ({
      fetchAddressTransactions,
      fetchTxMetadata: vi.fn(async () => [{ label: "5357", json_metadata: createMetadata("faster wallets") }]),
      fetchTxUtxos: vi.fn(async () => ({
        outputs: [
          {
            address: "addr_test1treasury",
            amount: [{ unit: "lovelace", quantity: "1000000" }]
          }
        ]
      })),
      fetchTx: vi.fn(async () => ({ hash: createTxHash, block_time: 1770000000 }))
    }));

    const { indexWantsFromChain } = await import("./indexer");
    const firstRequest = indexWantsFromChain();
    const secondRequest = indexWantsFromChain();

    expect(fetchAddressTransactions).toHaveBeenCalledTimes(1);

    addressTransactions.resolve([{ tx_hash: createTxHash, block_time: 1770000000 }]);
    const [first, second] = await Promise.all([firstRequest, secondRequest]);

    expect(first).toBe(second);
    expect(first[0].title).toBe("faster wallets");
  });

  it("returns stale wants while a refresh is running", async () => {
    const refreshAddressTransactions = deferred<Array<{ tx_hash: string; block_time: number }>>();
    const fetchAddressTransactions = vi
      .fn()
      .mockResolvedValueOnce([{ tx_hash: createTxHash, block_time: 1770000000 }])
      .mockReturnValueOnce(refreshAddressTransactions.promise);

    vi.doMock("./blockfrost", () => ({
      fetchAddressTransactions,
      fetchTxMetadata: vi
        .fn()
        .mockResolvedValueOnce([{ label: "5357", json_metadata: createMetadata("first want") }])
        .mockResolvedValueOnce([{ label: "5357", json_metadata: createMetadata("refreshed want") }]),
      fetchTxUtxos: vi.fn(async () => ({
        outputs: [
          {
            address: "addr_test1treasury",
            amount: [{ unit: "lovelace", quantity: "1000000" }]
          }
        ]
      })),
      fetchTx: vi.fn(async () => ({ hash: createTxHash, block_time: 1770000000 }))
    }));

    const { indexWantsFromChain } = await import("./indexer");
    const initial = await indexWantsFromChain();
    expect(initial[0].title).toBe("first want");

    vi.setSystemTime(new Date("2026-06-05T19:00:02.000Z"));
    const stale = await indexWantsFromChain();

    expect(stale[0].title).toBe("first want");
    expect(fetchAddressTransactions).toHaveBeenCalledTimes(2);

    refreshAddressTransactions.resolve([{ tx_hash: createTxHash, block_time: 1770000000 }]);
    await vi.runAllTimersAsync();
  });
});
