-- Create partner-assets storage bucket (public so images are viewable without auth)
insert into storage.buckets (id, name, public)
values ('partner-assets', 'partner-assets', true)
on conflict (id) do nothing;

-- Allow authenticated users (admins) to upload to partner-assets
create policy "Authenticated users can upload partner assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'partner-assets');

-- Allow authenticated users to update/replace their uploads
create policy "Authenticated users can update partner assets"
on storage.objects for update
to authenticated
using (bucket_id = 'partner-assets');

-- Allow authenticated users to delete partner assets
create policy "Authenticated users can delete partner assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'partner-assets');

-- Allow public read access (bucket is public, but policy makes it explicit)
create policy "Public can view partner assets"
on storage.objects for select
to public
using (bucket_id = 'partner-assets');
