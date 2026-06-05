import { NETWORK } from "./constants";

const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;
const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

export function normalizePlainText(input: string) {
  return input.normalize("NFC").trim().replace(/[ \t]+/g, " ");
}

export function visibleSlice(input: string, maxLength: number) {
  const normalized = normalizePlainText(input);

  if (!segmenter) {
    return Array.from(normalized).slice(0, maxLength).join("");
  }

  return Array.from(segmenter.segment(normalized))
    .slice(0, maxLength)
    .map((part) => part.segment)
    .join("");
}

export function validateTitle(input: string) {
  const title = visibleSlice(input, 100);

  if (!title) {
    throw new Error("enter a want");
  }

  if (CONTROL_CHARS.test(title)) {
    throw new Error("want cannot contain control characters");
  }

  return title;
}

export function validateBody(input: string) {
  const body = visibleSlice(input, 280);

  if (CONTROL_CHARS.test(body)) {
    throw new Error("text cannot contain control characters");
  }

  return body;
}

export function validateComment(input: string) {
  const comment = visibleSlice(input, 240);

  if (!comment) {
    throw new Error("enter a comment");
  }

  if (CONTROL_CHARS.test(comment)) {
    throw new Error("comment cannot contain control characters");
  }

  return comment;
}

export async function validateNetwork(wallet: { getNetworkId: () => Promise<number> }) {
  const expected = NETWORK === "mainnet" ? 1 : 0;
  const actual = await wallet.getNetworkId();

  if (actual !== expected) {
    throw new Error(
      `wallet is on ${actual === 1 ? "mainnet" : "testnet"}, but want is configured for ${NETWORK}.`
    );
  }
}
