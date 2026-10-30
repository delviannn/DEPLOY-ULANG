import NavAdmin from "@/components/NavAdmin";
import FormImporCSV from "@/components/FormImporCSV";

export default function HalamanImporProduk() {
  return <div className="flex flex-col gap-5 py-8"><NavAdmin /><div><h1 className="text-2xl font-extrabold">Impor produk CSV</h1><p className="mt-1 text-sm text-teks-lembut">Maksimal 500 produk, ukuran file 5 MB. Wajib ada kolom nama dan harga.</p></div><FormImporCSV /></div>;
}
