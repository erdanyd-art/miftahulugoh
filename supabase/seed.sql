-- seed.sql — data FIKTIF untuk pengembangan lokal (`npx supabase db reset`).
-- JANGAN dijalankan di produksi. Tidak ada data nyata di sini.
-- Akun lokal (kata sandi sama, hanya untuk pengembangan):
--   admin@contoh.test, tutor1@contoh.test, tutor2@contoh.test  /  kata sandi: dev-lokal-123

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                        confirmation_token, email_change, email_change_token_new, recovery_token)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
       extensions.crypt('dev-lokal-123', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid, 'admin@contoh.test'),
  ('10000000-0000-0000-0000-000000000002'::uuid, 'tutor1@contoh.test'),
  ('10000000-0000-0000-0000-000000000003'::uuid, 'tutor2@contoh.test')
) as u (id, email);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email),
       'email', now(), now(), now()
from auth.users u
where u.email like '%@contoh.test';

insert into public.profiles (id, nama, peran) values
  ('10000000-0000-0000-0000-000000000001', 'Admin Contoh',  'admin'),
  ('10000000-0000-0000-0000-000000000002', 'Ustadz Fulan',  'tutor'),
  ('10000000-0000-0000-0000-000000000003', 'Ustadzah Fulanah', 'tutor');

insert into public.kelas (id, nama, keterangan) values
  ('20000000-0000-0000-0000-000000000001', 'Bahasa Arab Dasar',  'Kelas contoh'),
  ('20000000-0000-0000-0000-000000000002', 'Nahwu Shorof',       'Kelas contoh'),
  ('20000000-0000-0000-0000-000000000003', 'Bahasa Inggris',     'Kelas contoh');

insert into public.peserta (id, nama) values
  ('30000000-0000-0000-0000-000000000001', 'Peserta Satu'),
  ('30000000-0000-0000-0000-000000000002', 'Peserta Dua'),
  ('30000000-0000-0000-0000-000000000003', 'Peserta Tiga'),
  ('30000000-0000-0000-0000-000000000004', 'Peserta Empat'),
  ('30000000-0000-0000-0000-000000000005', 'Peserta Lima');

insert into public.kelas_peserta (kelas_id, peserta_id) values
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004'),
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000005');

-- Satu jadwal per hari (Senin..Ahad) agar selalu ada "jadwal hari ini" saat mencoba aplikasi.
insert into public.jadwal (kelas_id, tutor_id, hari, jam_mulai, jam_selesai, honor)
select case when h % 2 = 1 then '20000000-0000-0000-0000-000000000001'::uuid else '20000000-0000-0000-0000-000000000002'::uuid end,
       case when h % 2 = 1 then '10000000-0000-0000-0000-000000000002'::uuid else '10000000-0000-0000-0000-000000000003'::uuid end,
       h, '08:00', '09:30', 100000
from generate_series(1, 7) as h;

insert into public.jadwal (kelas_id, tutor_id, hari, jam_mulai, jam_selesai, honor)
values ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 3, '16:00', '17:00', 120000);
