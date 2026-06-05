import { METADATA_LABEL, SIGNAL_LOVELACE_NUMBER, TREASURY_ADDRESS } from "./constants";
import {
  fetchAddressTransactions,
  fetchTx,
  fetchTxMetadata,
  fetchTxUtxos,
  type TxMetadataItem,
  type TxUtxos
} from "./blockfrost";
import { joinChunks, parseProofOfWantMetadata } from "./metadata";
import type { SignalTx, Want, WantComment } from "@/types/want";

type IndexedTx = {
  txHash: string;
  blockTime: number | null;
  metadata: TxMetadataItem[];
  utxos: TxUtxos;
};

const WANTS_FRESH_TTL_MS = readPositiveNumber(process.env.WANTS_CACHE_TTL_MS, 60_000);
const WANTS_STALE_TTL_MS = readPositiveNumber(process.env.WANTS_STALE_CACHE_TTL_MS, 10 * 60_000);

let cache: { freshUntil: number; staleUntil: number; wants: Want[] } | null = null;
let refreshPromise: Promise<Want[]> | null = null;

export function validateTreasuryPayment(txUtxos: TxUtxos, treasuryAddress = TREASURY_ADDRESS) {
  return txUtxos.outputs.reduce((total, output) => {
    if (output.address !== treasuryAddress) return total;

    const lovelace = output.amount.find((asset) => asset.unit === "lovelace");
    return total + Number(lovelace?.quantity || 0);
  }, 0);
}

function readLabelMetadata(metadata: TxMetadataItem[]) {
  const item = metadata.find((entry) => Number(entry.label) === METADATA_LABEL);
  return item?.json_metadata ?? null;
}

export function buildWantsFromIndexedTransactions(indexedTransactions: IndexedTx[]): Want[] {
  const creates = new Map<string, Want>();
  const pendingSignals: SignalTx[] = [];
  const pendingComments: WantComment[] = [];

  for (const tx of indexedTransactions) {
    const lovelace = validateTreasuryPayment(tx.utxos);
    if (lovelace < SIGNAL_LOVELACE_NUMBER) continue;

    const proofMetadata = parseProofOfWantMetadata(readLabelMetadata(tx.metadata));
    if (!proofMetadata) continue;

    if (proofMetadata.op === "create") {
      const title = joinChunks(proofMetadata.title);
      if (!title) continue;

      const want: Want = {
        id: tx.txHash,
        title,
        body: joinChunks(proofMetadata.body),
        createdTxHash: tx.txHash,
        createdAt: tx.blockTime,
        signalCount: 1,
        adaSignaled: 1,
        comments: [],
        recentSignals: [
          {
            txHash: tx.txHash,
            op: "create",
            wantId: tx.txHash,
            blockTime: tx.blockTime,
            lovelace
          }
        ]
      };

      creates.set(tx.txHash, want);
      continue;
    }

    if (proofMetadata.op === "comment") {
      const text = joinChunks(proofMetadata.text);
      if (!text) continue;

      pendingComments.push({
        txHash: tx.txHash,
        wantId: proofMetadata.want,
        text,
        blockTime: tx.blockTime,
        lovelace
      });

      pendingSignals.push({
        txHash: tx.txHash,
        op: "comment",
        wantId: proofMetadata.want,
        blockTime: tx.blockTime,
        lovelace
      });
      continue;
    }

    pendingSignals.push({
      txHash: tx.txHash,
      op: "agree",
      wantId: proofMetadata.want,
      blockTime: tx.blockTime,
      lovelace
    });
  }

  for (const signal of pendingSignals) {
    const want = creates.get(signal.wantId);
    if (!want) continue;

    want.signalCount += 1;
    want.adaSignaled = want.signalCount;
    want.recentSignals.push(signal);
  }

  for (const comment of pendingComments) {
    const want = creates.get(comment.wantId);
    if (!want) continue;

    want.comments.push(comment);
  }

  return Array.from(creates.values())
    .map((want) => ({
      ...want,
      comments: want.comments.sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0)),
      recentSignals: want.recentSignals
        .sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0))
        .slice(0, 10)
    }))
    .sort((a, b) => b.signalCount - a.signalCount || (b.createdAt || 0) - (a.createdAt || 0));
}

export async function indexWantsFromChain() {
  const now = Date.now();
  if (cache && cache.freshUntil > now) {
    return cache.wants;
  }

  if (refreshPromise) {
    return cache && cache.staleUntil > now ? cache.wants : refreshPromise;
  }

  refreshPromise = refreshWantsFromChain()
    .catch((error) => {
      if (cache && cache.staleUntil > Date.now()) {
        return cache.wants;
      }

      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  if (cache && cache.staleUntil > now) {
    return cache.wants;
  }

  return refreshPromise;
}

async function refreshWantsFromChain() {
  // TODO: A production release should use a real chain indexer. The MVP
  // intentionally reconstructs from recent treasury transactions with no DB.
  const addressTransactions = await fetchAddressTransactions();
  const indexedTransactions: IndexedTx[] = [];

  for (const addressTx of addressTransactions) {
    const txHash = addressTx.tx_hash;

    try {
      const [metadata, utxos, details] = await Promise.all([
        fetchTxMetadata(txHash).catch(() => []),
        fetchTxUtxos(txHash),
        fetchTx(txHash).catch(() => ({ hash: txHash, block_time: addressTx.block_time ?? null }))
      ]);

      indexedTransactions.push({
        txHash,
        blockTime: details.block_time ?? addressTx.block_time ?? null,
        metadata,
        utxos
      });
    } catch {
      // Skip malformed or temporarily unavailable transaction records.
    }
  }

  const wants = buildWantsFromIndexedTransactions(indexedTransactions);
  const now = Date.now();
  cache = {
    freshUntil: now + WANTS_FRESH_TTL_MS,
    staleUntil: now + WANTS_FRESH_TTL_MS + WANTS_STALE_TTL_MS,
    wants
  };
  return wants;
}

function readPositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
