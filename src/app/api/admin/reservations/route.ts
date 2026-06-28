import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["pending", "confirmed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_QUERY_LEN = 80;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Whitelist of sortable columns. Mapping (not raw passthrough) so a crafted
// `sort` value can never inject an arbitrary column/expression into order().
const SORT_FIELDS = {
  created_at: "created_at",
  start_date: "start_date",
  total_price: "total_price",
  client_name: "client_name",
} as const;
type SortField = keyof typeof SORT_FIELDS;

/**
 * Sanitize free-text before embedding it in a PostgREST `.or()` expression.
 * Commas/parens are grammar characters there, and %/_/* are LIKE wildcards —
 * stripping them means user input can only ever be a literal search term, never
 * alter the filter structure. We add our own %…% wildcards afterwards.
 */
function sanitizeSearch(value: string): string {
  return value.replace(/[,()%_*\\]/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = new URL(req.url).searchParams;

  // ── Parse + validate every input ────────────────────────────────────────
  const statusParam = sp.get("status") ?? "all";
  const status: Status | "all" = (STATUSES as readonly string[]).includes(
    statusParam,
  )
    ? (statusParam as Status)
    : "all";

  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(sp.get("pageSize")) || DEFAULT_PAGE_SIZE),
  );

  const search = sanitizeSearch((sp.get("q") ?? "").slice(0, MAX_QUERY_LEN));

  const fromParam = sp.get("from");
  const toParam = sp.get("to");
  const dateFrom = fromParam && DATE_RE.test(fromParam) ? fromParam : null;
  const dateTo = toParam && DATE_RE.test(toParam) ? toParam : null;

  const sortParam = sp.get("sort") ?? "created_at";
  const sortField: SortField =
    sortParam in SORT_FIELDS ? (sortParam as SortField) : "created_at";
  const ascending = sp.get("dir") === "asc";

  const includeCounts = sp.get("includeCounts") === "1";

  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  const supabase = getSupabaseAdmin();

  // Search (customer name/phone/email) + rental-period overlap, applied to the
  // list AND the tab counts so counts reflect the active search/date context.
  // Structural generic (self-returning filter methods) so we can share this
  // across the data query and the count queries without importing Supabase's
  // deep builder types.
  function applyShared<
    B extends {
      or(filter: string): B;
      gte(column: string, value: string): B;
      lte(column: string, value: string): B;
    },
  >(qb: B): B {
    let out = qb;
    if (search) {
      out = out.or(
        `client_name.ilike.%${search}%,client_phone.ilike.%${search}%,client_email.ilike.%${search}%`,
      );
    }
    // Overlap test: a reservation intersects [from, to] when it ends on/after
    // `from` and starts on/before `to`.
    if (dateFrom) out = out.gte("end_date", dateFrom);
    if (dateTo) out = out.lte("start_date", dateTo);
    return out;
  }

  // ── Data page (filters BEFORE order/range, as PostgREST requires) ─────────
  const baseQuery = applyShared(
    supabase.from("reservations").select("*, car:cars(id, brand, name, images)"),
  );
  const scopedQuery =
    status !== "all" ? baseQuery.eq("status", status) : baseQuery;
  const listPromise = scopedQuery
    .order(SORT_FIELDS[sortField], { ascending })
    // Stable tiebreaker so pagination is deterministic when sort keys collide.
    .order("id", { ascending: true })
    .range(rangeFrom, rangeTo);

  const countFor = (s?: Status) => {
    const cq = applyShared(
      supabase.from("reservations").select("id", { count: "exact", head: true }),
    );
    return s ? cq.eq("status", s) : cq;
  };

  // ── Execute. Tab counts are 4 extra count queries, so only run them when the
  //    client asks (filters changed) — not on simple page navigation. ─────────
  if (includeCounts) {
    const [listRes, allC, pendC, confC, cancC] = await Promise.all([
      listPromise,
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
    const total = status === "all" ? counts.all : counts[status];

    return NextResponse.json({
      reservations: listRes.data ?? [],
      total,
      counts,
      page,
      pageSize,
    });
  }

  // Page navigation only: 1 count (for pagination) instead of 5 round-trips.
  const [listRes, totalC] = await Promise.all([
    listPromise,
    countFor(status === "all" ? undefined : status),
  ]);

  if (listRes.error) {
    return NextResponse.json(
      { error: "Failed to load reservations." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    reservations: listRes.data ?? [],
    total: totalC.count ?? 0,
    counts: null, // client keeps the counts it already has
    page,
    pageSize,
  });
}
