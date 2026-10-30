"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { buatSupabaseSesi } from "@/lib/supabase";
import { batasiPermintaan } from "@/lib/rate-limit";

function authAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Konfigurasi Supabase tidak lengkap.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function cekAdmin() {
  const sesi = await buatSupabaseSesi();
  const { data: { user } } = await sesi.auth.getUser();
  return user?.app_metadata?.role === "admin" ? user : null;
}

export async function undangAdmin(_state, formData) {
  const user = await cekAdmin();
  if (!user) return { error: "Sesi admin habis." };
  const email = formData.get("email")?.toString().trim().toLowerCase() || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) return { error: "Alamat email tidak valid." };
  if (!(await batasiPermintaan("invite_admin", 5, 3600, user.id))) return { error: "Batas undangan tercapai. Coba lagi nanti." };
  const admin = authAdmin();
  const { data: invitation, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${process.env.SITE_URL || "https://deploy-ulang.vercel.app"}/admin/login` });
  if (error || !invitation.user) return { error: "Undangan gagal dikirim. Email mungkin sudah memiliki akun." };
  const { error: roleError } = await admin.auth.admin.updateUserById(invitation.user.id, { app_metadata: { ...invitation.user.app_metadata, role: "admin" } });
  if (roleError) return { error: "Undangan terkirim, tetapi role admin gagal diberikan. Periksa akun dari Supabase Auth." };
  await admin.from("log_admin").insert({ admin_id: user.id, aksi: "undang", entitas: "admin", entitas_id: invitation.user.id });
  revalidatePath("/admin/akun");
  return { sukses: `Undangan admin dikirim ke ${email}.` };
}

export async function cabutAdmin(idRaw) {
  const user = await cekAdmin();
  if (!user) return { error: "Sesi admin habis." };
  const id = String(idRaw || "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || id === user.id) return { error: "Akun ini tidak dapat dicabut dari sesi saat ini." };
  const admin = authAdmin();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return { error: "Daftar akun admin gagal dimuat." };
  const target = data.users.find((entry) => entry.id === id && entry.app_metadata?.role === "admin");
  const jumlahAdmin = data.users.filter((entry) => entry.app_metadata?.role === "admin").length;
  if (!target) return { error: "Akun admin tidak ditemukan." };
  if (jumlahAdmin <= 1) return { error: "Admin terakhir tidak dapat dicabut." };
  const { error: updateError } = await admin.auth.admin.updateUserById(id, { app_metadata: { ...target.app_metadata, role: "user" } });
  if (updateError) return { error: "Role admin gagal dicabut." };
  await admin.from("log_admin").insert({ admin_id: user.id, aksi: "cabut_role", entitas: "admin", entitas_id: id });
  revalidatePath("/admin/akun");
  return { sukses: true };
}
