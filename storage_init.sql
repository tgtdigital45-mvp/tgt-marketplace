-- Create Storage Buckets
-- Ideally run this in Supabase SQL Editor as 'postgres' or via Dashboard

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false) -- Private docs
on conflict (id) do nothing;

-- Storage Policies

-- Logos: Anyone can view, Auth users can upload
create policy "Public Access Logos"
  on storage.objects for select
  using ( bucket_id = 'logos' );

create policy "Auth Upload Logos"
  on storage.objects for insert
  with check ( bucket_id = 'logos' and auth.role() = 'authenticated' );

-- Covers: Anyone can view, Auth users can upload
create policy "Public Access Covers"
  on storage.objects for select
  using ( bucket_id = 'covers' );

create policy "Auth Upload Covers"
  on storage.objects for insert
  with check ( bucket_id = 'covers' and auth.role() = 'authenticated' );

-- Documents: Only owner can view/upload (Auth)
create policy "Private Access Documents"
  on storage.objects for select
  using ( bucket_id = 'documents' and auth.uid() = owner );

create policy "Auth Upload Documents"
  on storage.objects for insert
  with check ( bucket_id = 'documents' and auth.role() = 'authenticated' );
