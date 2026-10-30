"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { buatSupabaseSesi } from "@/lib/supabase";
import { batasiPermintaan } from "@/lib/rate-limit";
import { randomUUID } from "node:crypto";

async function unggahFoto(formData, supabase, fotoUrl) {
  const file = formData.get("foto_file");
  if (!(file instanceof File) || file.size === 0) return { foto_url: fotoUrl };
  const tipeDiizinkan = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!tipeDiizinkan.has(file.type) || file.size > 5 * 1024 * 1024) {
    return { error: "Foto harus berformat JPEG, PNG, atau WebP dengan ukuran maksimal 5 MB." };
  }
  const ekstensi = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
  const path = `${randomUUID()}.${ekstensi}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const signatures = {
    "image/jpeg": bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    "image/png": bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/webp": bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP",
  };
  if (!signatures[file.type]) return { error: "Isi file tidak sesuai dengan format gambar yang dipilih." };
  const { error } = await supabase.storage.from("product-images").upload(path, bytes, {
    contentType: file.type,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) return { error: "Foto gagal diunggah. Periksa konfigurasi Supabase Storage." };
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { foto_url: data.publicUrl };
}

// Helper validasi link gambar aman (mencegah javascript: atau protocol injection)
function sanitizeFotoUrl(url) {
  if (!url || typeof url !== "string") return "/produk/placeholder.svg";
  const trimmed = url.trim();
  if (trimmed.length > 500 || /[\\\u0000-\u001f]/.test(trimmed)) return "/produk/placeholder.svg";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" && parsed.username === "" && parsed.password === "") return parsed.toString();
  } catch { /* Use a safe placeholder for invalid URLs. */ }
  return "/produk/placeholder.svg";
}

function bacaDataProduk(formData) {
  const nama = formData.get("nama")?.toString().trim() || "";
  const hargaRaw = formData.get("harga")?.toString().trim() || "";
  const stokRaw = formData.get("stok")?.toString().trim() || "";
  const harga = Number(hargaRaw);
  const stok = Number(stokRaw);
  const urutanRaw = formData.get("urutan")?.toString().trim() || "0";
  const urutan = Number(urutanRaw);
  const hargaCoretRaw = formData.get("harga_coret")?.toString().trim();
  const harga_coret = hargaCoretRaw ? Number(hargaCoretRaw) : null;
  const fotoRaw = formData.get("foto_url")?.toString().trim() || "";
  const foto_url = sanitizeFotoUrl(fotoRaw);
  const fotoFile = formData.get("foto_file");
  const adaFotoUnggahan = fotoFile instanceof File && fotoFile.size > 0;
  const kategori = formData.get("kategori")?.toString().trim() || null;
  const deskripsi = formData.get("deskripsi")?.toString().trim() || null;
  const fotoLainnyaRaw = formData.get("foto_lainnya")?.toString() || "";
  if (fotoLainnyaRaw.length > 6000) return { error: "Daftar foto tambahan terlalu panjang.", fieldErrors: { foto_lainnya: "Maksimal 6.000 karakter." } };
  const foto_lainnya = fotoLainnyaRaw
    .split(/\r?\n/).map((url) => url.trim()).filter(Boolean).slice(0, 10)
    .map((url) => sanitizeFotoUrl(url)).filter((url) => url !== "/produk/placeholder.svg");
  let varian = [];
  const varianRaw = formData.get("varian")?.toString() || "[]";
  if (varianRaw.length > 20000) return { error: "Data varian terlalu panjang.", fieldErrors: { varian: "Maksimal 20.000 karakter." } };
  try {
    varian = JSON.parse(varianRaw);
  } catch {
    return { error: "Format varian harus berupa JSON yang valid.", fieldErrors: { varian: "Periksa format JSON varian." } };
  }
  if (!Array.isArray(varian) || varian.length > 20 || varian.some((item) =>
    !item || typeof item.nama !== "string" || item.nama.trim().length < 1 || item.nama.length > 80 ||
    (item.harga !== undefined && (!Number.isSafeInteger(item.harga) || item.harga < 0 || item.harga > 1000000000))
  ) || new Set(varian.map((item) => item.nama.trim().toLocaleLowerCase("id"))).size !== varian.length) return { error: "Varian harus berupa daftar nama dan harga yang unik dan valid (maksimal 20).", fieldErrors: { varian: "Nama varian tidak boleh duplikat; gunakan nama dan harga yang valid (maksimal 20 varian)." } };
  const fieldErrors = {};
  if (!nama || nama.length > 150) fieldErrors.nama = "Nama wajib diisi dan maksimal 150 karakter.";
  if (!hargaRaw || !Number.isSafeInteger(harga) || harga <= 0 || harga > 1000000000) fieldErrors.harga = "Harga harus bilangan bulat antara Rp1 dan Rp1.000.000.000.";
  if (!stokRaw || !Number.isSafeInteger(stok) || stok < 0 || stok > 1000000) fieldErrors.stok = "Stok harus bilangan bulat dari 0 sampai 1.000.000.";
  if (!Number.isSafeInteger(urutan) || urutan < 0 || urutan > 1000000) fieldErrors.urutan = "Urutan harus bilangan bulat dari 0 sampai 1.000.000.";
  if (harga_coret !== null && (!Number.isSafeInteger(harga_coret) || harga_coret <= harga || harga_coret > 1000000000)) fieldErrors.harga_coret = "Harga sebelum promo harus lebih tinggi dari harga jual.";
  if (!adaFotoUnggahan && fotoRaw && foto_url === "/produk/placeholder.svg") fieldErrors.foto_url = "Masukkan URL HTTPS atau path lokal yang aman.";
  if (Object.keys(fieldErrors).length) return { error: "Periksa kembali isian yang ditandai.", fieldErrors };
  return { data: { nama, harga, stok, urutan, harga_coret, foto_url, foto_lainnya, kategori: kategori?.slice(0, 60) || null, deskripsi: deskripsi?.slice(0, 3000) || null, aktif: formData.get("aktif") === "true", varian } };
}

async function simpanVarianRelasional(supabase, produkId, varian, hargaDasar) {
  const { error: errorHapus } = await supabase.from("varian_produk").delete().eq("produk_id", produkId);
  if (errorHapus) return "Varian gagal disimpan ke tabel varian produk.";
  if (!varian?.length) return null;
  const rows = varian.map((item, urutan) => ({
    produk_id: produkId,
    nama: item.nama.trim(),
    harga: item.harga ?? hargaDasar,
    urutan,
  }));
  const { error } = await supabase.from("varian_produk").insert(rows);
  return error ? "Varian gagal disimpan ke tabel varian produk." : null;
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted && char === '"' && text[i + 1] === '"') { field += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === ",") { row.push(field); field = ""; }
    else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field); if (row.some((cell) => cell.trim())) rows.push(row);
      row = []; field = "";
    } else field += char;
  }
  if (quoted) throw new Error("CSV memiliki tanda kutip yang belum ditutup.");
  row.push(field); if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

export async function imporProdukCSV(_prevState, formData) {
  const supabase = await sesiAdmin();
  if (!supabase) return { error: "Sesi admin habis. Silakan login kembali." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024) return { error: "Pilih file CSV berukuran maksimal 5 MB." };
  let rows;
  try { rows = parseCSV((await file.text()).replace(/^\uFEFF/, "")); }
  catch { return { error: "Format CSV tidak valid. Pastikan semua teks berkutip ditutup." }; }
  if (rows.length < 2 || rows.length > 501) return { error: "CSV harus berisi header dan maksimal 500 produk." };
  const headers = rows.shift().map((header) => header.trim().toLowerCase());
  if (!headers.includes("nama") || !headers.includes("harga")) return { error: "Header wajib: nama,harga. Header lain: kategori,deskripsi,foto_url,stok,aktif,harga_coret,urutan,varian." };
  const rowsValid = [];
  const rowsGagal = [];
  for (let index = 0; index < rows.length; index++) {
    const values = Object.fromEntries(headers.map((header, column) => [header, rows[index][column] || ""]));
    const item = new FormData();
    for (const key of ["nama", "harga", "kategori", "deskripsi", "foto_url", "foto_lainnya", "stok", "aktif", "harga_coret", "urutan", "varian"]) {
      item.set(key, values[key] || (key === "varian" ? "[]" : key === "stok" ? "0" : key === "urutan" ? "0" : key === "aktif" ? "true" : ""));
    }
    const result = bacaDataProduk(item);
    if (result.error) rowsGagal.push({ baris: index + 2, pesan: result.error });
    else rowsValid.push({ baris: index + 2, data: result.data });
  }
  let rowsSiapImpor = rowsValid;
  const productsByCategory = [...new Set(rowsValid.map(({ data }) => data.kategori).filter(Boolean))];
  if (productsByCategory.length) {
    const categories = productsByCategory.map((nama) => ({ nama, slug: nama.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }));
    const { error: categoryError } = await supabase.from("kategori").upsert(categories, { onConflict: "nama", ignoreDuplicates: true });
    if (categoryError) {
      const categorySet = new Set(productsByCategory);
      for (const row of rowsValid) if (row.data.kategori && categorySet.has(row.data.kategori)) rowsGagal.push({ baris: row.baris, pesan: "Kategori gagal disimpan." });
      rowsSiapImpor = rowsValid.filter(({ data }) => !data.kategori);
    }
  }
  let jumlahBerhasil = 0;
  if (rowsSiapImpor.length) {
    const { error } = await supabase.from("produk").insert(rowsSiapImpor.map(({ data }) => data));
    if (error) {
      for (const row of rowsSiapImpor) rowsGagal.push({ baris: row.baris, pesan: "Produk gagal disimpan ke database." });
    } else {
      jumlahBerhasil = rowsSiapImpor.length;
      await catatAksiAdmin(supabase, "impor", "produk", jumlahBerhasil);
      revalidatePath("/admin"); revalidatePath("/");
    }
  }
  const ringkasan = { berhasil: jumlahBerhasil, gagal: rowsGagal.length, barisGagal: rowsGagal };
  return {
    ...(jumlahBerhasil ? { sukses: `${jumlahBerhasil} produk berhasil diimpor.` } : {}),
    ...(jumlahBerhasil === 0 && rowsGagal.length ? { error: "Tidak ada produk yang berhasil diimpor." } : {}),
    ringkasan,
  };
}

// US-04: login admin dengan email dan password.
export async function login(_prevState, formData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  // Validasi format email dasar
  if (!email.includes("@") || email.length > 255) {
    return { error: "Format email tidak valid." };
  }
  if (!(await batasiPermintaan("login", 10, 900, email))) {
    return { error: "Terlalu banyak percobaan. Tunggu 15 menit sebelum mencoba lagi." };
  }

  const supabase = await buatSupabaseSesi();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || data?.user?.app_metadata?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "Email atau password salah." };
  }

  redirect("/admin");
}

// US-04: keluar (logout) admin.
export async function keluar() {
  const supabase = await buatSupabaseSesi();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

async function sesiAdmin() {
  const supabase = await buatSupabaseSesi();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.app_metadata?.role === "admin" ? supabase : null;
}

async function catatAksiAdmin(supabase, aksi, entitas, entitasId = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("log_admin").insert({ admin_id: user.id, aksi, entitas, entitas_id: entitasId === null ? null : String(entitasId) });
}

export async function tambahKategori(_prevState, formData) {
  const supabase = await sesiAdmin();
  if (!supabase) return { error: "Sesi admin habis. Silakan login kembali." };
  const nama = formData.get("nama")?.toString().trim() || "";
  if (!nama || nama.length > 60) return { error: "Nama kategori wajib diisi (maksimal 60 karakter)." };
  const slug = nama.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) return { error: "Nama kategori tidak menghasilkan slug yang valid." };
  const { error } = await supabase.from("kategori").insert({ nama, slug });
  if (error) return { error: "Kategori gagal ditambahkan. Pastikan nama belum digunakan." };
  await catatAksiAdmin(supabase, "tambah", "kategori", nama);
  revalidatePath("/admin/kategori");
  revalidatePath("/");
  return { sukses: "Kategori ditambahkan." };
}

export async function ubahKategori(_prevState, formData) {
  const supabase = await sesiAdmin();
  if (!supabase) return { error: "Sesi admin habis. Silakan login kembali." };
  const id = Number(formData.get("id"));
  const nama = formData.get("nama")?.toString().trim() || "";
  if (!Number.isSafeInteger(id) || id < 1 || !nama || nama.length > 60) return { error: "Data kategori tidak valid." };
  const slug = nama.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) return { error: "Nama kategori tidak menghasilkan slug yang valid." };
  const { data: renamed, error } = await supabase.rpc("rename_category", { p_id: id, p_nama: nama, p_slug: slug });
  if (error || !renamed) return { error: "Kategori tidak dapat diubah. Pastikan nama belum digunakan." };
  await catatAksiAdmin(supabase, "ubah", "kategori", id);
  revalidatePath("/admin/kategori"); revalidatePath("/admin"); revalidatePath("/");
  return { sukses: "Kategori dan produk terkait berhasil diperbarui." };
}

export async function hapusKategori(idRaw) {
  const supabase = await sesiAdmin();
  if (!supabase) return { error: "Sesi admin habis. Silakan login kembali." };
  const id = Number(idRaw);
  if (!Number.isSafeInteger(id) || id < 1) return { error: "ID kategori tidak valid." };
  const { data: category } = await supabase.from("kategori").select("nama").eq("id", id).maybeSingle();
  if (!category) return { error: "Kategori tidak ditemukan." };
  const { count, error: countError } = await supabase.from("produk").select("id", { count: "exact", head: true }).eq("kategori", category.nama);
  if (countError) return { error: "Produk terkait tidak dapat diperiksa." };
  if (count) return { error: "Kategori masih dipakai produk. Ubah kategori produk terlebih dahulu." };
  const { error } = await supabase.from("kategori").delete().eq("id", id);
  if (error) return { error: "Kategori gagal dihapus." };
  await catatAksiAdmin(supabase, "hapus", "kategori", id);
  revalidatePath("/admin/kategori"); revalidatePath("/");
  return { sukses: "Kategori dihapus." };
}

export async function ubahStatusProduk(idRaw, aktif) {
  const supabase = await sesiAdmin();
  if (!supabase) return { error: "Sesi admin habis. Silakan login kembali." };
  const id = Number(idRaw);
  if (!Number.isSafeInteger(id) || id < 1 || typeof aktif !== "boolean") return { error: "Data status produk tidak valid." };
  const { error } = await supabase.from("produk").update({ aktif, diperbarui_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: "Status produk gagal diubah." };
  await catatAksiAdmin(supabase, aktif ? "aktifkan" : "nonaktifkan", "produk", id);
  revalidatePath("/admin"); revalidatePath("/"); revalidatePath(`/produk/${id}`);
  return { sukses: true };
}

export async function geserUrutanProduk(idRaw, arah) {
  const supabase = await sesiAdmin();
  if (!supabase) return { error: "Sesi admin habis. Silakan login kembali." };
  const id = Number(idRaw);
  if (!Number.isSafeInteger(id) || id < 1 || ![-1, 1].includes(arah)) return { error: "Data urutan produk tidak valid." };
  const { data, error } = await supabase.rpc("move_product_order", { p_product_id: id, p_direction: arah });
  if (error) return { error: "Urutan produk gagal diubah. Pastikan migrasi terbaru sudah dijalankan." };
  if (!data) return { error: arah < 0 ? "Produk sudah berada di urutan pertama." : "Produk sudah berada di urutan terakhir." };
  await catatAksiAdmin(supabase, arah < 0 ? "naikkan_urutan" : "turunkan_urutan", "produk", id);
  revalidatePath("/admin");
  revalidatePath("/");
  return { sukses: true };
}

export async function simpanPengaturanToko(_prevState, formData) {
  const supabase = await sesiAdmin();
  if (!supabase) return { error: "Sesi admin habis. Silakan login kembali." };
  const nama = formData.get("nama")?.toString().trim() || "";
  const tagline = formData.get("tagline")?.toString().trim() || "";
  const nomor = formData.get("nomor_whatsapp")?.toString().trim() || "";
  const alamat = formData.get("alamat")?.toString().trim() || "";
  const jam = formData.get("jam_buka")?.toString().trim() || "";
  const bannerJudul = formData.get("banner_judul")?.toString().trim() || "";
  const bannerDeskripsi = formData.get("banner_deskripsi")?.toString().trim() || "";
  const bannerFotoRaw = formData.get("banner_foto")?.toString().trim() || "";
  const bannerTautanRaw = formData.get("banner_tautan")?.toString().trim() || "";
  const bannerAktif = formData.get("banner_aktif") === "true";
  if (!nama || nama.length > 100 || !tagline || tagline.length > 240 || !/^62\d{8,13}$/.test(nomor) || alamat.length > 300 || jam.length > 120 || bannerJudul.length > 120 || bannerDeskripsi.length > 500) {
    return { error: "Periksa nama, tagline, nomor WhatsApp (format 62...), dan batas panjang isian." };
  }
  const bannerFoto = bannerFotoRaw ? sanitizeFotoUrl(bannerFotoRaw) : null;
  if (bannerFotoRaw && bannerFoto === "/produk/placeholder.svg") return { error: "URL foto banner harus berupa HTTPS atau path lokal yang aman." };
  let bannerTautan = null;
  if (bannerTautanRaw) {
    if (bannerTautanRaw.length > 500 || /[\\\u0000-\u001f]/.test(bannerTautanRaw)) return { error: "Tautan banner tidak valid." };
    if (bannerTautanRaw.startsWith("/") && !bannerTautanRaw.startsWith("//")) bannerTautan = bannerTautanRaw;
    else {
      try {
        const url = new URL(bannerTautanRaw);
        if (url.protocol !== "https:" || url.username || url.password) return { error: "Tautan banner harus berupa URL HTTPS atau path lokal." };
        bannerTautan = url.toString();
      } catch { return { error: "Tautan banner harus berupa URL HTTPS atau path lokal." }; }
    }
  }
  if (bannerAktif && !bannerJudul) return { error: "Judul wajib diisi untuk mengaktifkan banner." };
  const { error } = await supabase.from("pengaturan_toko").upsert({ id: true, nama, tagline, nomor_whatsapp: nomor, alamat, jam_buka: jam, banner_judul: bannerJudul || null, banner_deskripsi: bannerDeskripsi || null, banner_foto: bannerFoto, banner_tautan: bannerTautan, banner_aktif: bannerAktif, diperbarui_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) return { error: "Pengaturan toko gagal disimpan." };
  await catatAksiAdmin(supabase, "ubah", "pengaturan_toko");
  revalidatePath("/"); revalidatePath("/kontak"); revalidatePath("/tentang");
  return { sukses: "Pengaturan toko berhasil disimpan." };
}

// US-05: ganti password admin yang sedang login.
export async function gantiPassword(_prevState, formData) {
  const passwordBaru = formData.get("password_baru")?.toString();
  const konfirmasi = formData.get("konfirmasi_password")?.toString();

  if (!passwordBaru || !konfirmasi) {
    return { error: "Semua field wajib diisi." };
  }

  if (passwordBaru.length < 8) {
    return { error: "Password baru minimal 8 karakter." };
  }

  if (passwordBaru.length > 72) {
    return { error: "Password terlalu panjang (maksimal 72 karakter)." };
  }

  if (passwordBaru !== konfirmasi) {
    return { error: "Password baru dan konfirmasi tidak sama." };
  }

  const supabase = await buatSupabaseSesi();

  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "admin") {
    return { error: "Sesi habis, silakan login kembali." };
  }

  const { error } = await supabase.auth.updateUser({
    password: passwordBaru,
  });

  if (error) {
    return { error: "Gagal mengganti password. Pastikan password memenuhi ketentuan, lalu coba lagi." };
  }

  await catatAksiAdmin(supabase, "ubah_password", "admin");

  return { sukses: "Password berhasil diganti." };
}

// US-08: tambah produk baru (terproteksi login & validasi input ketat)
export async function tambahProduk(_prevState, formData) {
  const supabase = await buatSupabaseSesi();

  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "admin") {
    return { error: "Sesi habis, silakan login kembali." };
  }

  const parsed = bacaDataProduk(formData);
  if (parsed.error) return { error: parsed.error, fieldErrors: parsed.fieldErrors || {} };
  const foto = await unggahFoto(formData, supabase, parsed.data.foto_url);
  if (foto.error) return { error: foto.error };

  const { data: produkBaru, error } = await supabase.from("produk").insert({
    ...parsed.data,
    foto_url: foto.foto_url,
  }).select("id").single();

  if (error) {
    return { error: "Gagal menyimpan produk. Periksa data dan coba lagi." };
  }
  const errorVarian = await simpanVarianRelasional(supabase, produkBaru.id, parsed.data.varian, parsed.data.harga);
  if (errorVarian) return { error: errorVarian };
  await catatAksiAdmin(supabase, "tambah", "produk");

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

// US-09: ubah produk yang ada (terproteksi login & validasi input ketat)
export async function ubahProduk(_prevState, formData) {
  const supabase = await buatSupabaseSesi();

  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "admin") {
    return { error: "Sesi habis, silakan login kembali." };
  }

  const idRaw = formData.get("id");
  const idText = idRaw?.toString() || "";
  const id = /^\d{1,15}$/.test(idText) ? Number(idText) : NaN;
  if (!Number.isSafeInteger(id) || id < 1) {
    return { error: "ID produk tidak valid." };
  }

  const parsed = bacaDataProduk(formData);
  if (parsed.error) return { error: parsed.error, fieldErrors: parsed.fieldErrors || {} };
  const foto = await unggahFoto(formData, supabase, parsed.data.foto_url);
  if (foto.error) return { error: foto.error };

  const { error } = await supabase
    .from("produk")
    .update({
      ...parsed.data,
      foto_url: foto.foto_url,
      diperbarui_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: "Gagal memperbarui produk. Periksa data dan coba lagi." };
  }
  const errorVarian = await simpanVarianRelasional(supabase, id, parsed.data.varian, parsed.data.harga);
  if (errorVarian) return { error: errorVarian };
  await catatAksiAdmin(supabase, "ubah", "produk", id);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/produk/${id}`);
  redirect("/admin");
}

// US-10: hapus produk (terproteksi login & type validation)
export async function hapusProduk(idRaw) {
  const supabase = await buatSupabaseSesi();

  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "admin") {
    return { error: "Sesi habis, silakan login kembali." };
  }

  const idText = idRaw?.toString() || "";
  const id = /^\d{1,15}$/.test(idText) ? Number(idText) : NaN;
  if (!Number.isSafeInteger(id) || id < 1) {
    return { error: "ID produk tidak valid." };
  }

  const { error } = await supabase.from("produk").delete().eq("id", id);

  if (error) {
    return { error: "Gagal menghapus produk. Silakan coba lagi." };
  }
  await catatAksiAdmin(supabase, "hapus", "produk", id);

  revalidatePath("/admin");
  revalidatePath("/");
  return { sukses: true };
}

// US-14: Generate product descriptions using a configured AI provider.
export async function buatDeskripsiAI(input) {
  const supabase = await buatSupabaseSesi();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "admin") {
    return { error: "Sesi habis, silakan login kembali." };
  }

  if (!input || typeof input !== "object") {
    return { error: "Data deskripsi tidak valid." };
  }
  const nama = typeof input.nama === "string" ? input.nama : "";
  const kategori = typeof input.kategori === "string" ? input.kategori : "";
  const fitur = typeof input.fitur === "string" ? input.fitur : "";
  const target_user = typeof input.target_user === "string" ? input.target_user : "";
  if (!nama.trim()) {
    return { error: "Nama produk wajib diisi sebelum membuat deskripsi dengan AI." };
  }
  if (!(await batasiPermintaan("ai_description", 10, 3600, user.id))) {
    return { error: "Batas penggunaan deskripsi AI tercapai. Coba lagi nanti." };
  }

  const cleanNama = nama.trim().slice(0, 120);
  const cleanKategori = (kategori || "").trim().slice(0, 60);
  const cleanFitur = (fitur || "").trim().slice(0, 200);
  const cleanTarget = (target_user || "").trim().slice(0, 200);

  const prompt = `Buat deskripsi produk e-commerce dalam Bahasa Indonesia yang persuasif dengan panjang 120-200 kata berdasarkan data berikut:
Nama Produk: ${cleanNama}
Kategori: ${cleanKategori || "Umum"}
Fitur Utama: ${cleanFitur || "Kualitas terjamin, bahan pilihan"}
Target Pengguna: ${cleanTarget || "Semua kalangan"}

Tulis dengan format:
- Ringkasan produk
- Keunggulan utama
- Manfaat bagi pengguna
- Call to action`;

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        signal: AbortSignal.timeout(15000),
        redirect: "error",
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Kamu adalah copywriter profesional e-commerce UMKM Indonesia.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 700,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) console.error("[deskripsi-ai] OpenAI menolak permintaan", { status: res.status, code: data?.error?.code || null, type: data?.error?.type || null });
      const hasil = data?.choices?.[0]?.message?.content;
      if (typeof hasil === "string" && hasil.trim()) {
        return { hasil: hasil.trim().slice(0, 3000) };
      }
      if (res.ok) console.error("[deskripsi-ai] OpenAI tidak mengembalikan teks");
    } catch (error) { console.error("[deskripsi-ai] Koneksi OpenAI gagal", { name: error?.name || "Error" }); }
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    for (const model of ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 700, thinkingConfig: { thinkingLevel: "minimal" } },
          }),
          signal: AbortSignal.timeout(10000),
          redirect: "error",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          console.error("[deskripsi-ai] Gemini menolak permintaan", { model, status: res.status, code: data?.error?.status || null });
          if (res.status === 429 || res.status >= 500) continue;
          break;
        }
        const hasil = data?.candidates?.[0]?.content?.parts?.find((part) => part.text && part.thought !== true)?.text;
        if (typeof hasil === "string" && hasil.trim()) return { hasil: hasil.trim().slice(0, 3000) };
        console.error("[deskripsi-ai] Gemini tidak mengembalikan teks", { model, finishReason: data?.candidates?.[0]?.finishReason || null, promptFeedback: data?.promptFeedback?.blockReason || null });
      } catch (error) {
        console.error("[deskripsi-ai] Koneksi Gemini gagal", { model, name: error?.name || "Error" });
      }
    }
  }

  if (!openaiKey && !geminiKey) return { error: "Layanan AI belum dikonfigurasi. Atur OPENAI_API_KEY atau GEMINI_API_KEY di environment server." };
  return { error: "Layanan AI sedang sibuk atau kunci API tidak dapat digunakan. Coba lagi, atau periksa kuota dan akses Gemini API di Vercel." };
}
