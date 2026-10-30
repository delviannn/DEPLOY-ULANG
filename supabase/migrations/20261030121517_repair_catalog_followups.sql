begin;

alter table public.pengaturan_toko
  add column if not exists banner_tautan text;

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

create index if not exists varian_produk_produk_urutan_idx on public.varian_produk(produk_id, urutan, id);
alter table public.varian_produk enable row level security;
drop policy if exists varian_baca_admin on public.varian_produk;
create policy varian_baca_admin on public.varian_produk for select to authenticated using (public.is_admin());
drop policy if exists varian_kelola_admin on public.varian_produk;
create policy varian_kelola_admin on public.varian_produk for all to authenticated using (public.is_admin()) with check (public.is_admin());

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

commit;
