-- Create a new private bucket called 'avatars'
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up access controls for storage
-- Using specific names to avoid conflicts with existing policies
drop policy if exists "Public Access Avatars" on storage.objects;
create policy "Public Access Avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

drop policy if exists "Authenticated users can update avatars" on storage.objects;
create policy "Authenticated users can update avatars"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

drop policy if exists "Authenticated users can delete avatars" on storage.objects;
create policy "Authenticated users can delete avatars"
  on storage.objects for delete
  using ( bucket_id = 'avatars' and auth.role() = 'authenticated' );
