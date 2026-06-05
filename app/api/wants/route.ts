import { NextResponse } from "next/server";
import { indexWantsFromChain } from "@/lib/indexer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const wants = await indexWantsFromChain();
    return NextResponse.json({ wants });
  } catch {
    return NextResponse.json({ error: "unable to index wants" }, { status: 500 });
  }
}
