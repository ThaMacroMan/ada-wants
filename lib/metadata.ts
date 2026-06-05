import { APP_ID, APP_VERSION } from "./constants";
import { validateBody, validateComment, validateTitle } from "./validation";

export type CreateMetadata = {
  app: typeof APP_ID;
  v: typeof APP_VERSION;
  op: "create";
  title: string[];
  body: string[];
  ts: number;
};

export type AgreeMetadata = {
  app: typeof APP_ID;
  v: typeof APP_VERSION;
  op: "agree";
  want: string;
  ts: number;
};

export type CommentMetadata = {
  app: typeof APP_ID;
  v: typeof APP_VERSION;
  op: "comment";
  want: string;
  text: string[];
  ts: number;
};

export type ProofOfWantMetadata = CreateMetadata | AgreeMetadata | CommentMetadata;

const encoder = new TextEncoder();

export function chunkUtf8(input: string, maxBytes = 64): string[] {
  const value = input.normalize("NFC").trim();
  if (!value) return [];

  const chunks: string[] = [];
  let current = "";

  for (const char of value) {
    const next = `${current}${char}`;

    if (encoder.encode(next).length > maxBytes) {
      if (!current) {
        throw new Error(`A single character exceeds ${maxBytes} UTF-8 bytes.`);
      }
      chunks.push(current);
      current = char;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

export function joinChunks(chunks: string[]) {
  return chunks.join("").normalize("NFC").trim();
}

export function isValidTxHash(input: unknown): input is string {
  return typeof input === "string" && /^[0-9a-fA-F]{64}$/.test(input);
}

export function buildCreateMetadata(titleInput: string, bodyInput: string): CreateMetadata {
  const title = validateTitle(titleInput);
  const body = validateBody(bodyInput);

  return {
    app: APP_ID,
    v: APP_VERSION,
    op: "create",
    title: chunkUtf8(title),
    body: chunkUtf8(body),
    ts: Math.floor(Date.now() / 1000)
  };
}

export function buildAgreeMetadata(wantTxHash: string): AgreeMetadata {
  if (!isValidTxHash(wantTxHash)) {
    throw new Error("want id must be a 64-character transaction hash.");
  }

  return {
    app: APP_ID,
    v: APP_VERSION,
    op: "agree",
    want: wantTxHash.toLowerCase(),
    ts: Math.floor(Date.now() / 1000)
  };
}

export function buildCommentMetadata(wantTxHash: string, textInput: string): CommentMetadata {
  if (!isValidTxHash(wantTxHash)) {
    throw new Error("want id must be a 64-character transaction hash.");
  }

  const text = validateComment(textInput);

  return {
    app: APP_ID,
    v: APP_VERSION,
    op: "comment",
    want: wantTxHash.toLowerCase(),
    text: chunkUtf8(text),
    ts: Math.floor(Date.now() / 1000)
  };
}

export function parseProofOfWantMetadata(rawMetadata: unknown): ProofOfWantMetadata | null {
  if (!rawMetadata || typeof rawMetadata !== "object") return null;

  const metadata = rawMetadata as Record<string, unknown>;
  if (metadata.app !== APP_ID) return null;
  if (metadata.v !== APP_VERSION) return null;
  if (metadata.op !== "create" && metadata.op !== "agree" && metadata.op !== "comment") return null;

  const ts = typeof metadata.ts === "number" && Number.isFinite(metadata.ts) ? metadata.ts : 0;

  if (metadata.op === "create") {
    if (!Array.isArray(metadata.title) || !metadata.title.every((chunk) => typeof chunk === "string")) {
      return null;
    }

    if (!Array.isArray(metadata.body) || !metadata.body.every((chunk) => typeof chunk === "string")) {
      return null;
    }

    try {
      const title = validateTitle(joinChunks(metadata.title));
      const body = validateBody(joinChunks(metadata.body));

      return {
        app: APP_ID,
        v: APP_VERSION,
        op: "create",
        title: chunkUtf8(title),
        body: chunkUtf8(body),
        ts
      };
    } catch {
      return null;
    }
  }

  if (!isValidTxHash(metadata.want)) {
    return null;
  }

  if (metadata.op === "comment") {
    if (!Array.isArray(metadata.text) || !metadata.text.every((chunk) => typeof chunk === "string")) {
      return null;
    }

    try {
      const text = validateComment(joinChunks(metadata.text));

      return {
        app: APP_ID,
        v: APP_VERSION,
        op: "comment",
        want: metadata.want.toLowerCase(),
        text: chunkUtf8(text),
        ts
      };
    } catch {
      return null;
    }
  }

  return {
    app: APP_ID,
    v: APP_VERSION,
    op: "agree",
    want: metadata.want.toLowerCase(),
    ts
  };
}
