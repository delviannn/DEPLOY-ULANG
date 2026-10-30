"use server";

import { batasiPermintaan } from "@/lib/rate-limit";
import { buatSupabaseServer } from "@/lib/supabase";
import { buatSupabaseSesi } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function kirimUlasan(_state, formData) {
  const produkId = Number(formData.get("produk_id"));
  const nama = formData.get("nama")?.toString().trim() || "";
  const rating = Number(formData.get("rating"));
  const isi = formData.get("isi")?.toString().trim() || "";
  const honeypot = formData.get("website")?.toString() || "";
  if (honeypot) return { sukses: "Ulasan dikirim untuk ditinjau." };
  if (!Number.isSafeInteger(produkId) || produkId < 1) return { error: "Produk tidak valid." };
  const fieldErrors = {};
  if (nama.length < 2 || nama.length > 80) fieldErrors.nama = "Nama harus terdiri dari 2 sampai 80 karakter.";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fieldErrors.rating = "Pilih rating dari 1 sampai 5.";
  if (isi.length < 5 || isi.length > 1200) fieldErrors.isi = "Ulasan harus terdiri dari 5 sampai 1.200 karakter.";
  if (Object.keys(fieldErrors).length) return { error: "Periksa isian ulasan.", fieldErrors };
  if (!(await batasiPermintaan("review", 3, 3600))) return { error: "Terlalu banyak ulasan dikirim. Coba lagi nanti." };
  const supabase = buatSupabaseServer();
  const { data: produk } = await supabase.from("produk").select("id").eq("id", produkId).eq("aktif", true).maybeSingle();
  if (!produk) return { error: "Produk tidak ditemukan." };
  const { error } = await supabase.from("ulasan").insert({ produk_id: produkId, nama, rating, isi, status: "menunggu" });
  if (error) return { error: "Ulasan gagal dikirim. Coba lagi nanti." };
  revalidatePath(`/produk/${produkId}`);
  return { sukses: "Terima kasih! Ulasan akan tampil setelah ditinjau." };
}

export async function moderasiUlasan(idRaw, aksi) {
  const sesi = await buatSupabaseSesi();
  const { data: { user } } = await sesi.auth.getUser();
  if (user?.app_metadata?.role !== "admin") return { error: "Sesi admin habis." };
  const id = Number(idRaw);
  if (!Number.isSafeInteger(id) || id < 1 || !["setujui", "tolak", "hapus"].includes(aksi)) return { error: "Permintaan moderasi tidak valid." };
  const supabase = buatSupabaseServer();
  const { error } = aksi === "hapus"
    ? await supabase.from("ulasan").delete().eq("id", id)
    : await supabase.from("ulasan").update({ status: aksi === "setujui" ? "disetujui" : "ditolak" }).eq("id", id);
  if (error) return { error: "Ulasan gagal diperbarui." };
  await supabase.from("log_admin").insert({ admin_id: user.id, aksi, entitas: "ulasan", entitas_id: String(id) });
  revalidatePath("/admin/ulasan");
  revalidatePath("/");
  return { sukses: true };
}
