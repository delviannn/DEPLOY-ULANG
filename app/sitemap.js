import { buatSupabaseServer } from "@/lib/supabase";

const siteUrl = process.env.SITE_URL || "https://deploy-ulang.vercel.app";

export default async function sitemap() {
  const fixed = ["", "/tentang", "/kontak"].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "weekly",
    priority: path ? 0.6 : 1,
  }));

  try {
    const supabase = buatSupabaseServer();
    const [{ data }, { data: kategori }] = await Promise.all([
      supabase.from("produk").select("id, diperbarui_at, created_at").eq("aktif", true),
      supabase.from("kategori").select("slug"),
    ]);
    const products = (data || []).map((product) => ({
      url: `${siteUrl}/produk/${product.id}`,
      lastModified: product.diperbarui_at || product.created_at,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    const categories = (kategori || []).map((item) => ({ url: `${siteUrl}/kategori/${item.slug}`, changeFrequency: "weekly", priority: 0.65 }));
    return [...fixed, ...categories, ...products];
  } catch {
    return fixed;
  }
}
