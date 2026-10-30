import FormPengaturanToko from "@/components/FormPengaturanToko";
import NavAdmin from "@/components/NavAdmin";
import { ambilPengaturanToko } from "@/lib/toko-public";

export default async function HalamanPengaturanToko() {
  return <div className="py-8"><NavAdmin /><div className="mt-6"><FormPengaturanToko toko={await ambilPengaturanToko()} /></div></div>;
}
