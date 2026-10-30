import { NextResponse } from "next/server";
import { buatSupabaseSesi } from "@/lib/supabase";

function csvCell(value) {
  let text = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const supabase = await buatSupabaseSesi();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }
  const fields = ["id", "nama", "kategori", "harga", "harga_coret", "stok", "aktif", "urutan", "deskripsi", "foto_url", "foto_lainnya", "varian", "created_at"];
  const rows = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await supabase.from("produk").select(fields.join(",")).order("id").range(from, from + 499);
    if (error) return NextResponse.json({ error: "Ekspor produk gagal." }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
    rows.push(...(data || []));
    if (!data || data.length < 500) break;
  }
  const csv = [fields, ...rows.map((row) => fields.map((field) => row[field]))]
    .map((row) => row.map((value, index) => csvCell(fields[index] === "foto_lainnya" && Array.isArray(value) ? value.join("\n") : value)).join(",")).join("\r\n");
  return new NextResponse(`\uFEFF${csv}`, { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="produk-toko-delviann.csv"',
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
