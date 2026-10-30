-- Jalankan satu kali di Supabase SQL Editor setelah mencadangkan database.
-- Perluasan skema US-15 sampai US-50. Tabel produk yang ada tetap dipakai.
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.produk
  add column if not exists stok integer not null default 0 check (stok >= 0),
  add column if not exists aktif boolean not null default true,
  add column if not exists urutan integer not null default 0,
  add column if not exists harga_coret integer check (harga_coret is null or harga_coret >= harga),
  add column if not exists foto_lainnya text[] not null default '{}',
  add column if not exists varian jsonb not null default '[]',
  add column if not exists dilihat integer not null default 0,
  add column if not exists diperbarui_at timestamptz not null default now();

create table if not exists public.kategori (
  id bigint generated always as identity primary key,
  nama text not null unique,
  slug text not null unique,
  urutan integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.pengaturan_toko (
  id boolean primary key default true check (id), nama text not null,
  tagline text not null default '', nomor_whatsapp text not null,
  alamat text not null default '', jam_buka text not null default '',
  banner_judul text, banner_deskripsi text, banner_foto text, banner_tautan text,
  banner_aktif boolean not null default false,
  diperbarui_at timestamptz not null default now()
);
alter table public.pengaturan_toko add column if not exists banner_aktif boolean not null default false;
alter table public.pengaturan_toko add column if not exists banner_tautan text;

-- Varian produk disimpan per baris; kolom JSON lama disinkronkan agar impor/ekspor tetap kompatibel.
create table if not exists public.varian_produk (
  id bigint generated always as identity primary key,
  produk_id bigint not null references public.produk(id) on delete cascade,
  nama text not null check (char_length(trim(nama)) between 1 and 80),
  harga bigint not null check (harga between 0 and 1000000000),
  urutan integer not null default 0,
  created_at timestamptz not null default now(),
  unique (produk_id, nama)
);
grant select, insert, update, delete on public.varian_produk to authenticated, service_role;
grant usage, select on sequence public.varian_produk_id_seq to authenticated, service_role;

create or replace function public.sinkronkan_varian_produk()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.varian_produk where produk_id = new.id;
  if jsonb_typeof(new.varian) = 'array' then
    insert into public.varian_produk (produk_id, nama, harga, urutan)
    select new.id, v.nama, v.harga, v.urutan
    from (
      select trim(item.value ->> 'nama') as nama,
        case when coalesce(item.value ->> 'harga', '') ~ '^[0-9]{1,10}$'
          then (item.value ->> 'harga')::bigint else new.harga end as harga,
        (item.ordinality - 1)::integer as urutan,
        row_number() over (partition by trim(item.value ->> 'nama') order by item.ordinality) as duplikat
      from jsonb_array_elements(new.varian) with ordinality as item(value, ordinality)
      where jsonb_typeof(item.value) = 'object'
        and nullif(trim(item.value ->> 'nama'), '') is not null
        and char_length(trim(item.value ->> 'nama')) <= 80
    ) as v
    where v.duplikat = 1
    on conflict (produk_id, nama) do update set harga = excluded.harga, urutan = excluded.urutan;
  end if;
  return new;
end;
$$;
revoke all on function public.sinkronkan_varian_produk() from public, anon, authenticated;
drop trigger if exists produk_sinkronkan_varian on public.produk;
drop trigger if exists produk_sinkronkan_varian_update on public.produk;
create trigger produk_sinkronkan_varian
after insert on public.produk
for each row execute function public.sinkronkan_varian_produk();
create trigger produk_sinkronkan_varian_update
after update of varian, harga on public.produk
for each row execute function public.sinkronkan_varian_produk();
with kandidat as (
  select p.id as produk_id, trim(item.value ->> 'nama') as nama,
    case when coalesce(item.value ->> 'harga', '') ~ '^[0-9]{1,10}$'
      then (item.value ->> 'harga')::bigint else p.harga end as harga,
    (item.ordinality - 1)::integer as urutan,
    row_number() over (partition by p.id, trim(item.value ->> 'nama') order by item.ordinality) as duplikat
  from public.produk p
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(p.varian) = 'array' then p.varian else '[]'::jsonb end
  ) with ordinality as item(value, ordinality)
  where jsonb_typeof(item.value) = 'object'
    and nullif(trim(item.value ->> 'nama'), '') is not null
    and char_length(trim(item.value ->> 'nama')) <= 80
)
insert into public.varian_produk (produk_id, nama, harga, urutan)
select produk_id, nama, harga, urutan from kandidat where duplikat = 1
on conflict (produk_id, nama) do update set harga = excluded.harga, urutan = excluded.urutan;
create table if not exists public.ulasan (
  id bigint generated always as identity primary key,
  produk_id bigint not null references public.produk(id) on delete cascade,
  nama text not null check (char_length(nama) between 2 and 80),
  rating smallint not null check (rating between 1 and 5),
  isi text not null check (char_length(isi) between 5 and 1200),
  status text not null default 'menunggu' check (status in ('menunggu','disetujui','ditolak')),
  created_at timestamptz not null default now()
);
create table if not exists public.klik_whatsapp (
  id bigint generated always as identity primary key,
  produk_id bigint references public.produk(id) on delete set null,
  jumlah integer not null default 1 check (jumlah between 1 and 1000),
  created_at timestamptz not null default now()
);
create or replace view public.ringkasan_klik_produk with (security_invoker = true) as
select produk_id, count(*)::bigint as jumlah_klik
from public.klik_whatsapp
where produk_id is not null
group by produk_id;
revoke all on public.ringkasan_klik_produk from public, anon, authenticated;
revoke all on public.ringkasan_klik_produk from public, anon, authenticated;
grant select on public.ringkasan_klik_produk to service_role;
create table if not exists public.log_admin (
  id bigint generated always as identity primary key,
  admin_id uuid not null, aksi text not null, entitas text not null,
  entitas_id text, created_at timestamptz not null default now()
);
create table if not exists public.rate_limit_bucket (
  bucket_key text primary key,
  window_started_at timestamptz not null default now(),
  hits integer not null default 0
);
alter table public.rate_limit_bucket enable row level security;

create or replace function public.rate_limit_consume(bucket_key text, request_limit integer, window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare current_hits integer;
begin
  if $2 < 1 or $3 < 1 or $3 > 86400
    or $1 !~ '^[0-9a-f]{64}$' then
    return false;
  end if;
  insert into public.rate_limit_bucket as bucket (bucket_key, window_started_at, hits)
  values ($1, now(), 1)
  on conflict on constraint rate_limit_bucket_pkey do update set
    hits = case when bucket.window_started_at < now() - make_interval(secs => $3)
      then 1 else bucket.hits + 1 end,
    window_started_at = case when bucket.window_started_at < now() - make_interval(secs => $3)
      then now() else bucket.window_started_at end
  returning hits into current_hits;
  if random() < 0.01 then
    delete from public.rate_limit_bucket
    where window_started_at < now() - interval '1 day';
  end if;
  return current_hits <= $2;
end;
$$;
revoke all on function public.rate_limit_consume(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_consume(text, integer, integer) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];
drop policy if exists product_images_admin_upload on storage.objects;
create policy product_images_admin_upload on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and public.is_admin());
create index if not exists produk_kategori_idx on public.produk(kategori);
create index if not exists produk_aktif_urutan_idx on public.produk(aktif, urutan, id);
create index if not exists varian_produk_produk_urutan_idx on public.varian_produk(produk_id, urutan, id);
create index if not exists ulasan_produk_status_idx on public.ulasan(produk_id, status);

create or replace function public.move_product_order(p_product_id bigint, p_direction integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare ordered_ids bigint[]; current_position integer; next_position integer; temporary_id bigint; i integer;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_direction is null or p_direction not in (-1, 1) then return false; end if;
  select array_agg(id order by urutan asc, id asc) into ordered_ids from public.produk;
  current_position := array_position(ordered_ids, p_product_id);
  if current_position is null then return false; end if;
  next_position := current_position + p_direction;
  if next_position < 1 or next_position > coalesce(array_length(ordered_ids, 1), 0) then return false; end if;
  temporary_id := ordered_ids[current_position];
  ordered_ids[current_position] := ordered_ids[next_position];
  ordered_ids[next_position] := temporary_id;
  for i in 1..array_length(ordered_ids, 1) loop
    update public.produk set urutan = (i - 1) * 10 where id = ordered_ids[i];
  end loop;
  return true;
end;
$$;
revoke all on function public.move_product_order(bigint, integer) from public, anon;
grant execute on function public.move_product_order(bigint, integer) to authenticated;

insert into public.kategori (nama, slug)
select distinct p.kategori,
  trim(both '-' from regexp_replace(lower(p.kategori), '[^a-z0-9]+', '-', 'g'))
from public.produk p
where nullif(trim(p.kategori), '') is not null
on conflict (nama) do nothing;

alter table public.kategori enable row level security;
alter table public.varian_produk enable row level security;
alter table public.pengaturan_toko enable row level security;
alter table public.ulasan enable row level security;
alter table public.klik_whatsapp enable row level security;
alter table public.log_admin enable row level security;

drop policy if exists kategori_baca_admin on public.kategori;
create policy kategori_baca_admin on public.kategori for select to authenticated using (public.is_admin());
drop policy if exists kategori_kelola_admin on public.kategori;
create policy kategori_kelola_admin on public.kategori for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists varian_baca_admin on public.varian_produk;
create policy varian_baca_admin on public.varian_produk for select to authenticated using (public.is_admin());
drop policy if exists varian_kelola_admin on public.varian_produk;
create policy varian_kelola_admin on public.varian_produk for all to authenticated using (public.is_admin()) with check (public.is_admin());
create or replace function public.rename_category(p_id bigint, p_nama text, p_slug text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare old_name text;
begin
  select nama into old_name from public.kategori where id = p_id for update;
  if not found then return false; end if;
  update public.kategori set nama = p_nama, slug = p_slug where id = p_id;
  update public.produk set kategori = p_nama where kategori = old_name;
  return true;
end;
$$;
revoke all on function public.rename_category(bigint, text, text) from public, anon;
grant execute on function public.rename_category(bigint, text, text) to authenticated;
drop policy if exists toko_baca_admin on public.pengaturan_toko;
create policy toko_baca_admin on public.pengaturan_toko for select to authenticated using (public.is_admin());
drop policy if exists toko_ubah_admin on public.pengaturan_toko;
create policy toko_ubah_admin on public.pengaturan_toko for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists ulasan_baca_publik on public.ulasan;
create policy ulasan_baca_publik on public.ulasan for select to anon, authenticated using (status = 'disetujui');
drop policy if exists ulasan_kelola_admin on public.ulasan;
create policy ulasan_kelola_admin on public.ulasan for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists klik_baca_admin on public.klik_whatsapp;
create policy klik_baca_admin on public.klik_whatsapp for select to authenticated using (public.is_admin());
drop policy if exists log_baca_admin on public.log_admin;
create policy log_baca_admin on public.log_admin for select to authenticated using (public.is_admin());
drop policy if exists log_tambah_admin on public.log_admin;
create policy log_tambah_admin on public.log_admin for insert to authenticated with check (public.is_admin() and admin_id = auth.uid());

drop policy if exists admin_baca_produk on public.produk;
create policy admin_baca_produk on public.produk for select to authenticated using (public.is_admin());
drop policy if exists admin_tambah_produk on public.produk;
create policy admin_tambah_produk on public.produk for insert to authenticated with check (public.is_admin());
drop policy if exists admin_ubah_produk on public.produk;
create policy admin_ubah_produk on public.produk for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_hapus_produk on public.produk;
create policy admin_hapus_produk on public.produk for delete to authenticated using (public.is_admin());

-- Penulisan analytics dan ulasan publik dilakukan hanya melalui server route,
-- menggunakan secret key yang tidak pernah dikirim ke browser.
