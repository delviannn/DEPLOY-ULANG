"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cabutAdmin, undangAdmin } from "@/app/admin/akun/actions";

function Cabut({ user }) {
  const [pending, start] = useTransition(); const router = useRouter();
  return <button type="button" disabled={pending} onClick={() => {
    if (confirm(`Cabut role admin ${user.email}?`)) start(async () => {
      const result = await cabutAdmin(user.id);
      if (result?.error) alert(result.error); else router.refresh();
    });
  }} className="text-sm text-bahaya underline disabled:opacity-50">{pending ? "Memproses…" : "Cabut admin"}</button>;
}

export default function KelolaAkunAdmin({ users }) {
  const [state, action, pending] = useActionState(undangAdmin, null);
  return <><form action={action} className="mt-5 flex max-w-xl flex-wrap items-end gap-3 rounded-xl border border-garis p-4"><label className="flex min-w-56 flex-1 flex-col gap-1 text-sm font-semibold">Email admin baru<input type="email" name="email" required className="rounded-lg border border-garis bg-latar px-3 py-2 font-normal" /></label><button disabled={pending} className="rounded-lg bg-utama px-4 py-2 font-semibold text-white">{pending ? "Mengirim…" : "Undang admin"}</button>{state?.error && <p role="alert" className="w-full text-sm text-red-700">{state.error}</p>}{state?.sukses && <p role="status" className="w-full text-sm text-emerald-700">{state.sukses}</p>}</form>
    <h2 className="mt-7 font-bold">Akun admin</h2><ul className="mt-3 divide-y divide-garis rounded-xl border border-garis">{users.map((user) => <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 p-4"><div><p className="font-semibold">{user.email || "Email belum tersedia"}</p><p className="text-xs text-teks-lembut">{user.id}{user.last_sign_in_at ? ` · Login terakhir ${new Date(user.last_sign_in_at).toLocaleDateString("id-ID")}` : " · Belum pernah login"}</p></div><Cabut user={user} /></li>)}</ul>
  </>;
}
