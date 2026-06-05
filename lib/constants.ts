export const APP_ID = "proof-of-want";
export const APP_VERSION = 1;
export const SIGNAL_LOVELACE = "1000000";
export const SIGNAL_LOVELACE_NUMBER = Number(SIGNAL_LOVELACE);
export const METADATA_LABEL = Number(process.env.NEXT_PUBLIC_METADATA_LABEL || 5357);
export const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "";
export const NETWORK = process.env.NEXT_PUBLIC_CARDANO_NETWORK || "preprod";

export function assertServerConfig() {
  if (!TREASURY_ADDRESS) {
    throw new Error("NEXT_PUBLIC_TREASURY_ADDRESS is required");
  }

  if (!process.env.BLOCKFROST_PROJECT_ID) {
    throw new Error("BLOCKFROST_PROJECT_ID is required");
  }

  if (!process.env.BLOCKFROST_BASE_URL) {
    throw new Error("BLOCKFROST_BASE_URL is required");
  }
}
