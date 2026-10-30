import { notFound } from "next/navigation";
import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { buatSupabaseServer, buatSupabaseSesi } from "@/lib/supabase";
import { ubahProduk } from "@/app/admin/actions";

// US-09: ubah data produk (terkunci login)
export default async function HalamanUbahProduk({ params }) {
  const { id } = await params;
  const supabase = buatSupabaseServer();

  const { data: produk, error } = await supabase
    .from("produk")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !produk) {
    notFound();
  }
  const { data: varianTabel, error: errorVarian } = await supabase.from("varian_produk").select("id,nama,harga,urutan").eq("produk_id", produk.id).order("urutan", { ascending: true });
  if (!errorVarian && varianTabel?.length) produk.varian = varianTabel;
  const sesi = await buatSupabaseSesi();
  const { data: kategori } = await sesi.from("kategori").select("nama").order("nama");

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <div>
        <h1 className="text-2xl font-extrabold text-teks">Ubah produk</h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Perbarui informasi produk {produk.nama}.
        </p>
      </div>
      <FormProduk
        action={ubahProduk}
        produk={produk}
        daftarKategori={(kategori || []).map((item) => item.nama)}
        labelTombol="Simpan perubahan"
      />
    </div>
  );
}
