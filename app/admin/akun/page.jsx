import { createClient } from "@supabase/supabase-js";
import NavAdmin from "@/components/NavAdmin";
import KelolaAkunAdmin from "@/components/KelolaAkunAdmin";

export default async function HalamanAkunAdmin() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const admins = (data?.users || []).filter((user) => user.app_metadata?.role === "admin");
  return <div className="py-8"><NavAdmin /><h1 className="mt-6 text-2xl font-extrabold">Kelola akun admin</h1><p className="mt-1 text-sm text-teks-lembut">Undangan dikirim melalui Supabase Auth. Admin yang sedang digunakan tidak dapat mencabut rolenya sendiri.</p><KelolaAkunAdmin users={admins} /></div>;
}
