import { NextResponse } from "next/server";
import { destroySession, requireApiAuth } from "@/lib/auth";

export async function POST() {
  if (!(await requireApiAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await destroySession();
  return NextResponse.json({ ok: true });
}
