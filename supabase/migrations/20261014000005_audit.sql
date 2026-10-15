-- 0005_audit: log audit untuk tindakan penting

create table public.audit_log (
  id          bigint generated always as identity primary key,
  waktu       timestamptz not null default now(),
  pengguna_id uuid,                              -- auth.uid() pelaku; null bila lewat service role/SQL
  tabel       text not null,
  baris_id    text,
  aksi        text not null check (aksi in ('INSERT', 'UPDATE', 'DELETE')),
  sebelum     jsonb,
  sesudah     jsonb
);
create index audit_log_tabel_baris_idx on public.audit_log (tabel, baris_id);
create index audit_log_waktu_idx       on public.audit_log (waktu desc);

create function public.catat_audit()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.audit_log (pengguna_id, tabel, baris_id, aksi, sebelum, sesudah)
  values (
    auth.uid(),
    tg_table_name,
    case when tg_op = 'DELETE' then to_jsonb(old) ->> 'id' else to_jsonb(new) ->> 'id' end,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create trigger audit_profiles   after insert or update or delete on public.profiles
  for each row execute function public.catat_audit();
create trigger audit_jadwal     after insert or update or delete on public.jadwal
  for each row execute function public.catat_audit();
create trigger audit_sesi       after insert or update or delete on public.sesi
  for each row execute function public.catat_audit();
create trigger audit_kas        after insert or update or delete on public.kas
  for each row execute function public.catat_audit();
create trigger audit_pembayaran after insert or update or delete on public.pembayaran
  for each row execute function public.catat_audit();

alter table public.audit_log enable row level security;
create policy audit_log_baca on public.audit_log
  for select to authenticated using ((select public.is_admin()));

revoke all on public.audit_log from anon;
revoke insert, update, delete on public.audit_log from authenticated;
