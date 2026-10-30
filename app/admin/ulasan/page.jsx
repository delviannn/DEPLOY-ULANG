import DaftarModerasiUlasan from "@/components/DaftarModerasiUlasan";
import NavAdmin from "@/components/NavAdmin";
import { buatSupabaseSesi } from "@/lib/supabase";

export default async function HalamanUlasanAdmin() {
  const supabase = await buatSupabaseSesi();
  const { data } = await supabase.from("ulasan").select("id,produk_id,nama,rating,isi,status,created_at").order("created_at", { ascending: false }).limit(200);
  return <div className="py-8"><NavAdmin /><h1 className="mt-6 text-2xl font-extrabold">Moderasi ulasan</h1>{data?.length ? <DaftarModerasiUlasan ulasan={data} /> : <p className="mt-4 text-sm text-teks-lembut">Belum ada ulasan.</p>}</div>;
}
