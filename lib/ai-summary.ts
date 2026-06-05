import type { Want, WantComment } from "@/types/want";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.4-nano";
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; summaries: Record<string, string> }>();

type SummaryItem = {
  id: string;
  text: string;
};

export async function summarizeWantRows(wants: Want[]) {
  const items = wants.map((want) => ({
    id: want.id,
    text: [
      `want: ${want.title}`,
      want.comments.length > 0
        ? `comments: ${want.comments
            .slice(0, 3)
            .map((comment) => comment.text)
            .join(" | ")}`
        : ""
    ]
      .filter(Boolean)
      .join("\n")
  }));

  return summarizeItems("want-row", items, "summarize each want as a calm lowercase gist, max 8 words.");
}

export async function summarizeCommentRows(comments: WantComment[]) {
  const items = comments.map((comment) => ({
    id: comment.txHash,
    text: comment.text
  }));

  return summarizeItems("comment-row", items, "summarize each comment as a calm lowercase gist, max 7 words.");
}

async function summarizeItems(kind: string, items: SummaryItem[], instruction: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || items.length === 0) return {};

  const safeItems = items
    .filter((item) => item.id && item.text.trim())
    .slice(0, 30)
    .map((item) => ({ id: item.id, text: item.text.slice(0, 900) }));

  if (safeItems.length === 0) return {};

  const cacheKey = `${kind}:${process.env.OPENAI_SUMMARY_MODEL || DEFAULT_MODEL}:${JSON.stringify(safeItems)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.summaries;

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_SUMMARY_MODEL || DEFAULT_MODEL,
        input: [
          {
            role: "system",
            content:
              "you write tiny ui summaries. lowercase only. no markdown. no quotes. return only valid json."
          },
          {
            role: "user",
            content: `${kind}: ${instruction}\n\nitems:\n${JSON.stringify(safeItems)}\n\nreturn a json object where each key is item id and each value is the summary.`
          }
        ],
        max_output_tokens: 700
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return {};

    const data = await response.json();
    const summaries = sanitizeSummaries(parseSummaryJson(readOutputText(data)), safeItems);
    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, summaries });
    return summaries;
  } catch {
    return {};
  }
}

function readOutputText(data: unknown) {
  if (!data || typeof data !== "object") return "";
  if ("output_text" in data && typeof data.output_text === "string") return data.output_text;

  const output = "output" in data && Array.isArray(data.output) ? data.output : [];
  return output
    .flatMap((item) => (item && typeof item === "object" && "content" in item && Array.isArray(item.content) ? item.content : []))
    .map((content) => {
      if (!content || typeof content !== "object") return "";
      if ("text" in content && typeof content.text === "string") return content.text;
      if ("output_text" in content && typeof content.output_text === "string") return content.output_text;
      return "";
    })
    .join("");
}

function parseSummaryJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {};

    try {
      return JSON.parse(match[0]);
    } catch {
      return {};
    }
  }
}

function sanitizeSummaries(raw: unknown, items: SummaryItem[]) {
  if (!raw || typeof raw !== "object") return {};

  const ids = new Set(items.map((item) => item.id));
  return Object.fromEntries(
    Object.entries(raw)
      .filter(([id, value]) => ids.has(id) && typeof value === "string")
      .map(([id, value]) => [
        id,
        value
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 90)
      ])
      .filter(([, value]) => value)
  );
}
