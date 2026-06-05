import { assertServerConfig, TREASURY_ADDRESS } from "./constants";

export type AddressTransaction = {
  tx_hash: string;
  block_time?: number | null;
};

export type TxMetadataItem = {
  label: string;
  json_metadata?: unknown;
};

export type TxUtxos = {
  outputs: Array<{
    address: string;
    amount: Array<{ unit: string; quantity: string }>;
  }>;
};

export type TxDetails = {
  hash: string;
  block_time?: number | null;
};

export class BlockfrostError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "BlockfrostError";
  }
}

export async function blockfrostFetch<T>(path: string): Promise<T> {
  assertServerConfig();

  const baseUrl = process.env.BLOCKFROST_BASE_URL;
  const projectId = process.env.BLOCKFROST_PROJECT_ID;
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      project_id: projectId || ""
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new BlockfrostError(response.status, `Blockfrost ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchAddressTransactions(
  address = TREASURY_ADDRESS,
  maxPages = Number(process.env.MAX_INDEX_PAGES || 5)
) {
  const all: AddressTransaction[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const txs = await blockfrostFetch<AddressTransaction[]>(
      `/addresses/${address}/transactions?order=desc&count=100&page=${page}`
    ).catch((error) => {
      if (error instanceof BlockfrostError && error.status === 404) {
        return [];
      }

      throw error;
    });

    all.push(...txs);

    if (txs.length < 100) break;
  }

  return all.slice(0, Number(process.env.MAX_TXS || 500));
}

export function fetchTxMetadata(txHash: string) {
  return blockfrostFetch<TxMetadataItem[]>(`/txs/${txHash}/metadata`);
}

export function fetchTxUtxos(txHash: string) {
  return blockfrostFetch<TxUtxos>(`/txs/${txHash}/utxos`);
}

export function fetchTx(txHash: string) {
  return blockfrostFetch<TxDetails>(`/txs/${txHash}`);
}
