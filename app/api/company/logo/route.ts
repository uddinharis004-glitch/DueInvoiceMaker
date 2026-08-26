import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await requireApiAuth())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({error:"File required"},{status:400});
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({error:"Logo too large"},{status:400});
  if (!["image/png","image/jpeg","image/webp"].includes(file.type)) return NextResponse.json({error:"Unsupported image"},{status:400});

  const buffer = Buffer.from(await file.arrayBuffer());
  const data = `data:${file.type};base64,${buffer.toString("base64")}`;

  await query("UPDATE company SET logo_data=$1, updated_at=NOW() WHERE id=1", [data]);
  return NextResponse.json({ok:true});
}
