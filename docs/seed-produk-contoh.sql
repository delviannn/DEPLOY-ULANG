-- Data contoh katalog. Jalankan setelah schema.sql dan migration-fitur-katalog.sql.
-- Aman dijalankan ulang: produk dengan nama yang sama tidak akan digandakan.

insert into public.produk
  (nama, harga, deskripsi, foto_url, kategori, stok, aktif, urutan)
select *
from (values
  (
    'Kopi Bubuk Robusta 250 g',
    45000,
    'Biji robusta disangrai sedang lalu digiling halus. Cocok untuk kopi tubruk dan kopi susu.',
    '/produk/kopi.svg',
    'Minuman',
    20,
    true,
    1
  ),
  (
    'Keripik Singkong Balado',
    15000,
    'Singkong iris tipis, digoreng renyah, dibalut bumbu balado pedas manis.',
    '/produk/keripik.svg',
    'Camilan',
    35,
    true,
    2
  ),
  (
    'Sambal Bawang Botol 150 ml',
    25000,
    'Cabai rawit dan bawang putih goreng dengan minyak, tahan hingga 2 bulan.',
    '/produk/sambal.svg',
    'Bumbu',
    18,
    true,
    3
  ),
  (
    'Kue Nastar Toples 500 g',
    85000,
    'Nastar lembut dengan selai nanas buatan sendiri. Dikemas dalam toples kedap udara.',
    '/produk/nastar.svg',
    'Kue kering',
    12,
    true,
    4
  ),
  (
    'Tas Anyaman Pandan',
    120000,
    'Dianyam tangan dari daun pandan kering dan dilapisi kain di bagian dalam.',
    '/produk/tas.svg',
    'Kerajinan',
    8,
    true,
    5
  ),
  (
    'Kain Batik Cap 2 m',
    175000,
    'Batik cap motif parang di atas kain katun primisima, panjang 2 meter.',
    '/produk/batik.svg',
    'Kain',
    6,
    true,
    6
  )
) as contoh(nama, harga, deskripsi, foto_url, kategori, stok, aktif, urutan)
where not exists (
  select 1
  from public.produk p
  where p.nama = contoh.nama
);
