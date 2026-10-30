import KelolaKategori from "@/components/KelolaKategori";
import NavAdmin from "@/components/NavAdmin";
import { buatSupabaseSesi } from "@/lib/supabase";

export default async function HalamanKelolaKategori() {
  const supabase = await buatSupabaseSesi();
  const { data } = await supabase.from("kategori").select("id,nama,slug").order("nama");
  return <div><NavAdmin /><KelolaKategori kategori={data || []} /></div>;
}
