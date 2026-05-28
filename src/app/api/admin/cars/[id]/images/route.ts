import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { isAdminRequest } from "@/lib/admin-guard";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const BUCKET = "car-images";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }
  if (files.length > 10) {
    return NextResponse.json({ error: "Too many files (max 10)." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: car, error: carError } = await supabase
    .from("cars")
    .select("images")
    .eq("id", id)
    .single();

  if (carError || !car) {
    return NextResponse.json({ error: "Car not found." }, { status: 404 });
  }

  const urls: string[] = [...(car.images ?? [])];

  for (const file of files) {
    const ext = EXT_BY_MIME[file.type];
    if (!ext) continue; // reject non-image / disallowed types
    if (file.size > MAX_BYTES) continue;

    const path = `${id}/${Date.now()}-${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (!uploadError) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
  }

  const { error: updateError } = await supabase
    .from("cars")
    .update({ images: urls })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to save images." }, { status: 500 });
  }

  return NextResponse.json({ images: urls });
}

export async function DELETE(req: Request, { params }: Params) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.url) {
    return NextResponse.json({ error: "Missing url." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: car, error: carError } = await supabase
    .from("cars")
    .select("images")
    .eq("id", id)
    .single();

  if (carError || !car) {
    return NextResponse.json({ error: "Car not found." }, { status: 404 });
  }

  const updated = (car.images ?? []).filter((u: string) => u !== body.url);

  // Best-effort removal from storage (derive path after the bucket segment).
  const marker = `/${BUCKET}/`;
  const idx = body.url.indexOf(marker);
  if (idx !== -1) {
    const storagePath = body.url.slice(idx + marker.length);
    await supabase.storage.from(BUCKET).remove([storagePath]);
  }

  const { error: updateError } = await supabase
    .from("cars")
    .update({ images: updated })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update images." }, { status: 500 });
  }

  return NextResponse.json({ images: updated });
}
