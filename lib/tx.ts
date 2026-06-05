"use client";

import { MeshTxBuilder } from "@meshsdk/core";
import { METADATA_LABEL, NETWORK, SIGNAL_LOVELACE, TREASURY_ADDRESS } from "./constants";
import { buildAgreeMetadata, buildCommentMetadata, buildCreateMetadata } from "./metadata";
import { validateNetwork } from "./validation";

type MeshWallet = {
  getNetworkId: () => Promise<number>;
  getChangeAddressBech32: () => Promise<string>;
  getUtxosMesh: () => Promise<Parameters<MeshTxBuilder["selectUtxosFrom"]>[0]>;
  signTxReturnFullTx: (tx: string, partialSign: boolean) => Promise<string>;
  submitTx: (tx: string) => Promise<string>;
};

async function submitSignalTx(wallet: MeshWallet, metadata: Record<string, unknown>) {
  if (!TREASURY_ADDRESS) {
    throw new Error("treasury address is not configured.");
  }

  await validateNetwork(wallet);

  const changeAddress = await wallet.getChangeAddressBech32();
  const utxos = await wallet.getUtxosMesh();
  const txBuilder = new MeshTxBuilder({ verbose: false }).setNetwork(
    NETWORK === "mainnet" ? "mainnet" : "preprod"
  );

  const unsignedTx = await txBuilder
    .txOut(TREASURY_ADDRESS, [{ unit: "lovelace", quantity: SIGNAL_LOVELACE }])
    .metadataValue(METADATA_LABEL, metadata)
    .changeAddress(changeAddress)
    .selectUtxosFrom(utxos)
    .complete();

  const signedTx = await wallet.signTxReturnFullTx(unsignedTx, false);
  return wallet.submitTx(signedTx);
}

export function createWantTx(wallet: MeshWallet, title: string) {
  return submitSignalTx(wallet, buildCreateMetadata(title, ""));
}

export function agreeWithWantTx(wallet: MeshWallet, wantTxHash: string) {
  return submitSignalTx(wallet, buildAgreeMetadata(wantTxHash));
}

export function commentOnWantTx(wallet: MeshWallet, wantTxHash: string, text: string) {
  return submitSignalTx(wallet, buildCommentMetadata(wantTxHash, text));
}
