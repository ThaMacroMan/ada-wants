import { NETWORK } from "./constants";

export function explorerTxUrl(txHash: string) {
  if (NETWORK === "mainnet") {
    return `https://cardanoscan.io/transaction/${txHash}`;
  }

  return `https://preprod.cardanoscan.io/transaction/${txHash}`;
}
