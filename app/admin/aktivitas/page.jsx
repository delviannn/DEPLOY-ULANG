import Link from "next/link";
import NavAdmin from "@/components/NavAdmin";
import { buatSupabaseSesi } from "@/lib/supabase";

export default async function HalamanAktivitasAdmin() {
  const supabase = await buatSupabaseSesi();
  const { data, error } = await supabase.from("log_admin").select("id,aksi,entitas,entitas_id,created_at").order("created_at", { ascending: false }).limit(50);
  return <div className="py-8"><NavAdmin /><h1 className="mt-6 text-2xl font-extrabold">Aktivitas admin</h1>
    {error ? <p role="alert" className="mt-4 text-sm text-red-700">Tidak dapat memuat log. Jalankan migration terbaru.</p> : data?.length ? <ul className="mt-4 divide-y divide-garis rounded-xl border border-garis">{data.map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-2 p-3 text-sm"><span><strong>{item.aksi}</strong> {item.entitas}{item.entitas_id ? ` #${item.entitas_id}` : ""}</span><time className="text-teks-lembut" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</time></li>)}</ul> : <p className="mt-4 text-sm text-teks-lembut">Belum ada aktivitas yang tercatat.</p>}
  </div>;
}
