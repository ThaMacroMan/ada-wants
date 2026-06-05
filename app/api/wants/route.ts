import { NextResponse } from "next/server";
import { indexWantsFromChain } from "@/lib/indexer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const wants = await indexWantsFromChain();
    return NextResponse.json({ wants });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unable to index wants." },
      { status: 500 }
    );
  }
}
