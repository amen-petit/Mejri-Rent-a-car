import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const STATUSES = ["pending", "confirmed", "cancelled"] as const;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "all";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(url.searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE),
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = getSupabaseAdmin();
  const isStatusFilter = (STATUSES as readonly string[]).includes(status);

  // Page of rows (only the car columns the UI actually renders).
  let dataQuery = supabase
    .from("reservations")
    .select("*, car:cars(id, brand, name, images)")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (isStatusFilter) dataQuery = dataQuery.eq("status", status);

  // Lightweight head counts for the filter tabs.
  const countFor = (s?: string) => {
    let q = supabase
      .from("reservations")
      .select("id", { count: "exact", head: true });
    if (s) q = q.eq("status", s);
    return q;
  };

  const [listRes, allC, pendC, confC, cancC] = await Promise.all([
    dataQuery,
    countFor(),
    countFor("pending"),
    countFor("confirmed"),
    countFor("cancelled"),
  ]);

  if (listRes.error) {
    return NextResponse.json(
      { error: "Failed to load reservations." },
      { status: 500 },
    );
  }

  const counts = {
    all: allC.count ?? 0,
    pending: pendC.count ?? 0,
    confirmed: confC.count ?? 0,
    cancelled: cancC.count ?? 0,
  };
  const total = isStatusFilter
    ? counts[status as (typeof STATUSES)[number]]
    : counts.all;

  return NextResponse.json({
    reservations: listRes.data ?? [],
    total,
    counts,
    page,
    pageSize,
  });
}
