import "server-only";
import { toko as defaultToko } from "@/lib/toko";
import { buatSupabaseServer } from "@/lib/supabase";

export async function ambilPengaturanToko() {
  try {
    const supabase = buatSupabaseServer();
    let { data, error } = await supabase.from("pengaturan_toko").select("nama,tagline,nomor_whatsapp,alamat,jam_buka,banner_judul,banner_deskripsi,banner_foto,banner_tautan,banner_aktif").eq("id", true).maybeSingle();
    if (error) ({ data } = await supabase.from("pengaturan_toko").select("nama,tagline,nomor_whatsapp,alamat,jam_buka,banner_judul,banner_deskripsi,banner_foto,banner_aktif").eq("id", true).maybeSingle());
    if (!data) return { ...defaultToko, bannerTautan: "", bannerAktif: false };
    return {
      nama: data.nama || defaultToko.nama,
      tagline: data.tagline || defaultToko.tagline,
      nomorWhatsApp: data.nomor_whatsapp || defaultToko.nomorWhatsApp,
      alamat: data.alamat || defaultToko.alamat,
      jamBuka: data.jam_buka || defaultToko.jamBuka,
      bannerJudul: data.banner_judul || "",
      bannerDeskripsi: data.banner_deskripsi || "",
      bannerFoto: data.banner_foto || "",
      bannerTautan: data.banner_tautan || "",
      bannerAktif: data.banner_aktif === true,
    };
  } catch {
    return { ...defaultToko, bannerTautan: "", bannerAktif: false };
  }
}
