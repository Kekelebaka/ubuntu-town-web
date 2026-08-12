insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('kasibuy','kasibuy',true,5242880,array['image/webp','image/png','image/jpeg']) on conflict (id) do update set public=true, file_size_limit=5242880, allowed_mime_types=array['image/webp','image/png','image/jpeg'];
drop policy if exists kb_storage_read on storage.objects;
create policy kb_storage_read on storage.objects for select using (bucket_id='kasibuy');
drop policy if exists kb_storage_seed on storage.objects;
create policy kb_storage_seed on storage.objects for insert to anon with check (bucket_id='kasibuy');