import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { tambahProduk } from "@/app/admin/actions";
import { buatSupabaseSesi } from "@/lib/supabase";

// US-08: tambah produk baru (terkunci login)
export default async function HalamanTambahProduk() {
  const supabase = await buatSupabaseSesi();
  const { data } = await supabase.from("kategori").select("nama").order("nama");
  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <div>
        <h1 className="text-2xl font-extrabold text-teks">Tambah produk</h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Tambahkan produk baru ke dalam database katalog toko.
        </p>
      </div>
      <FormProduk action={tambahProduk} daftarKategori={(data || []).map((item) => item.nama)} labelTombol="Simpan produk" />
    </div>
  );
}
