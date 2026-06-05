import { describe, expect, it } from "vitest";
import { APP_ID, APP_VERSION } from "./constants";
import {
  buildAgreeMetadata,
  buildCommentMetadata,
  chunkUtf8,
  joinChunks,
  parseProofOfWantMetadata
} from "./metadata";

describe("metadata helpers", () => {
  it("does not create chunks over 64 bytes", () => {
    const chunks = chunkUtf8("I want multilingual signal ".repeat(10) + "☀️".repeat(20));

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(new TextEncoder().encode(chunk).length).toBeLessThanOrEqual(64);
    }
  });

  it("reconstructs original strings", () => {
    const input = "Cardano builders want simpler tiny apps ☀️";
    expect(joinChunks(chunkUtf8(input))).toBe(input);
  });

  it("rejects wrong app", () => {
    expect(
      parseProofOfWantMetadata({
        app: "other",
        v: APP_VERSION,
        op: "create",
        title: ["Want"],
        body: [],
        ts: 1
      })
    ).toBeNull();
  });

  it("rejects wrong version", () => {
    expect(
      parseProofOfWantMetadata({
        app: APP_ID,
        v: 2,
        op: "create",
        title: ["Want"],
        body: [],
        ts: 1
      })
    ).toBeNull();
  });

  it("rejects invalid op", () => {
    expect(
      parseProofOfWantMetadata({
        app: APP_ID,
        v: APP_VERSION,
        op: "vote",
        title: ["Want"],
        body: [],
        ts: 1
      })
    ).toBeNull();
  });

  it("requires agree want to be a 64-character hex transaction hash", () => {
    expect(() => buildAgreeMetadata("not-a-tx")).toThrow(/64-character/);
    expect(
      buildAgreeMetadata("a".repeat(64))
    ).toMatchObject({
      app: APP_ID,
      v: APP_VERSION,
      op: "agree",
      want: "a".repeat(64)
    });
  });

  it("builds and parses comment metadata with a parent want tx hash", () => {
    const want = "b".repeat(64);
    const metadata = buildCommentMetadata(want, "this would help");

    expect(metadata).toMatchObject({
      app: APP_ID,
      v: APP_VERSION,
      op: "comment",
      want
    });
    expect(joinChunks(metadata.text)).toBe("this would help");
    expect(parseProofOfWantMetadata(metadata)).toMatchObject({
      op: "comment",
      want
    });
  });
});
