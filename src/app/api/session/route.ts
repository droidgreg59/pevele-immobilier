import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getMostRecentSavedSearchSummary } from "@/lib/saved-searches";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null, project: null });
  }

  const project = await getMostRecentSavedSearchSummary(session.userId);
  return NextResponse.json({
    user: { nom: session.nom, type: session.type, email: session.email },
    project,
  });
}
