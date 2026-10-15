-- Tes struktural keamanan (security-checklist B1, B8, B11). Jalankan: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select is(
  (select array_agg(tablename::text order by tablename)
     from pg_tables where schemaname = 'public' and not rowsecurity),
  null::text[],
  'RLS aktif di semua tabel public');

select is(
  (select array_agg(c.relname::text order by c.relname)
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and not exists (select 1 from pg_policy p where p.polrelid = c.oid)),
  null::text[],
  'setiap tabel public punya kebijakan RLS');

select is(
  (select array_agg(p.proname::text order by p.proname)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and not coalesce(p.proconfig @> array['search_path=""'], false)),
  null::text[],
  'setiap fungsi SECURITY DEFINER memakai search_path kosong');

select is(
  (select array_agg(p.proname::text order by p.proname)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prorettype <> 'trigger'::regtype
      and has_function_privilege('anon', p.oid, 'execute')),
  null::text[],
  'anon tidak bisa menjalankan fungsi apa pun di public');

select * from finish();
rollback;
