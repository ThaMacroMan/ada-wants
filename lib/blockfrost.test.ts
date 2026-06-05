import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Blockfrost transaction cache", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    process.env.NEXT_PUBLIC_TREASURY_ADDRESS = "addr_test1treasury";
    process.env.BLOCKFROST_BASE_URL = "https://blockfrost.test";
    process.env.BLOCKFROST_PROJECT_ID = "project_test";
  });

  it("reuses cached immutable transaction responses", async () => {
    const fetchMock = vi.fn(async () => {
      return Response.json({
        outputs: [
          {
            address: "addr_test1treasury",
            amount: [{ unit: "lovelace", quantity: "1000000" }]
          }
        ]
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchTxUtxos } = await import("./blockfrost");

    await fetchTxUtxos("a".repeat(64));
    await fetchTxUtxos("a".repeat(64));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shares one in-flight transaction request", async () => {
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          setTimeout(() => {
            resolve(Response.json({ hash: "b".repeat(64), block_time: 1770000000 }));
          }, 10);
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchTx } = await import("./blockfrost");

    await Promise.all([fetchTx("b".repeat(64)), fetchTx("b".repeat(64))]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
