import { NextResponse } from "next/server";
import { indexWantsFromChain } from "@/lib/indexer";
import { isValidTxHash } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ txHash: string }> }) {
  const { txHash } = await params;

  if (!isValidTxHash(txHash)) {
    return NextResponse.json({ error: "invalid want id." }, { status: 400 });
  }

  try {
    const wants = await indexWantsFromChain();
    const want = wants.find((item) => item.id === txHash.toLowerCase()) || null;
    return NextResponse.json({ want });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unable to index want." },
      { status: 500 }
    );
  }
}
