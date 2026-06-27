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

/**
 * Verify the real file type from its magic bytes rather than trusting the
 * client-supplied `file.type` header (which is trivially forged). Returns the
 * canonical MIME if the signature matches an allowed image format, else null.
 * This prevents an authenticated admin from uploading a disguised payload
 * (e.g. an HTML/SVG/script file renamed to .png) into a public bucket.
 */
function sniffImageMime(bytes: Uint8Array): string | null {
  const b = bytes;
  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return "image/png";
  }
  // RIFF....WEBP  (52 49 46 46 ?? ?? ?? ?? 57 45 42 50)
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return "image/webp";
  }
  // AVIF: ISO-BMFF box "ftyp" at offset 4, brand "avif"/"avis" at offset 8
  if (
    b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 &&
    b[8] === 0x61 && b[9] === 0x76 && b[10] === 0x69 &&
    (b[11] === 0x66 || b[11] === 0x73)
  ) {
    return "image/avif";
  }
  return null;
}

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
    if (file.size > MAX_BYTES) continue;

    const buffer = Buffer.from(await file.arrayBuffer());
    // Trust the bytes, not the header: derive the MIME from the file signature.
    const sniffedMime = sniffImageMime(buffer.subarray(0, 12));
    const ext = sniffedMime ? EXT_BY_MIME[sniffedMime] : undefined;
    if (!sniffedMime || !ext) continue; // not a real allowed image

    const path = `${id}/${Date.now()}-${randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: sniffedMime, upsert: false });

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
