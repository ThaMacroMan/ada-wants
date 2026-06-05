import { describe, expect, it } from "vitest";
import { METADATA_LABEL, SIGNAL_LOVELACE, TREASURY_ADDRESS } from "./constants";
import { buildAgreeMetadata, buildCommentMetadata, buildCreateMetadata } from "./metadata";
import { buildWantsFromIndexedTransactions } from "./indexer";

const txHash = "b".repeat(64);
const agreeTxHash = "c".repeat(64);
const commentTxHash = "d".repeat(64);

function indexedTx({
  hash = txHash,
  lovelace = SIGNAL_LOVELACE,
  metadata = buildCreateMetadata("Better wallets", "Less ceremony")
}: {
  hash?: string;
  lovelace?: string;
  metadata?: unknown;
} = {}) {
  return {
    txHash: hash,
    blockTime: 1770000000,
    metadata: [{ label: String(METADATA_LABEL), json_metadata: metadata }],
    utxos: {
      outputs: [
        {
          address: TREASURY_ADDRESS,
          amount: [{ unit: "lovelace", quantity: lovelace }]
        }
      ]
    }
  };
}

describe("indexer", () => {
  it("ignores transactions that have metadata but no 1 ADA treasury payment", () => {
    const wants = buildWantsFromIndexedTransactions([indexedTx({ lovelace: "999999" })]);
    expect(wants).toEqual([]);
  });

  it("counts a valid create as the first signal", () => {
    const wants = buildWantsFromIndexedTransactions([indexedTx()]);
    expect(wants).toHaveLength(1);
    expect(wants[0]).toMatchObject({
      id: txHash,
      title: "Better wallets",
      signalCount: 1,
      adaSignaled: 1
    });
  });

  it("attaches paid comments to the parent want without a db", () => {
    const wants = buildWantsFromIndexedTransactions([
      indexedTx(),
      indexedTx({
        hash: agreeTxHash,
        metadata: buildAgreeMetadata(txHash)
      }),
      indexedTx({
        hash: commentTxHash,
        metadata: buildCommentMetadata(txHash, "ship it")
      })
    ]);

    expect(wants).toHaveLength(1);
    expect(wants[0]).toMatchObject({
      signalCount: 3,
      adaSignaled: 3,
      comments: [
        {
          txHash: commentTxHash,
          wantId: txHash,
          text: "ship it"
        }
      ]
    });
    expect(wants[0].recentSignals.map((signal) => signal.op)).toContain("comment");
  });
});
