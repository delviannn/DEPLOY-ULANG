import { NextResponse } from "next/server";
import { buatSupabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const ids = [...new Set((new URL(request.url).searchParams.get("ids") || "")
    .split(",").filter((id) => /^\d{1,15}$/.test(id)).map(Number).filter(Number.isSafeInteger))].slice(0, 12);
  if (!ids.length) return NextResponse.json({ produk: [] }, { headers: { "Cache-Control": "no-store" } });
  const supabase = buatSupabaseServer();
  const { data, error } = await supabase.from("produk")
    .select("id,nama,harga,harga_coret,stok,deskripsi,foto_url,kategori,created_at,varian")
    .in("id", ids).eq("aktif", true);
  if (error) return NextResponse.json({ error: "Produk tidak dapat dimuat." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const posisi = new Map(ids.map((id, index) => [id, index]));
  data.sort((a, b) => posisi.get(a.id) - posisi.get(b.id));
  return NextResponse.json({ produk: data }, { headers: { "Cache-Control": "no-store" } });
}
