-- Add profile_picture_url column to customers table
ALTER TABLE public.customers ADD COLUMN profile_picture_url text;

-- Create customer-avatars storage bucket (public so avatars are viewable)
insert into storage.buckets (id, name, public)
values ('customer-avatars', 'customer-avatars', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to customer-avatars
create policy "Authenticated users can upload customer avatars"
on storage.objects for insert
to authenticated
with check (bucket_id = 'customer-avatars');

-- Allow authenticated users to update/replace their uploads
create policy "Authenticated users can update customer avatars"
on storage.objects for update
to authenticated
using (bucket_id = 'customer-avatars');

-- Allow authenticated users to delete customer avatars
create policy "Authenticated users can delete customer avatars"
on storage.objects for delete
to authenticated
using (bucket_id = 'customer-avatars');

-- Allow public read access
create policy "Public can view customer avatars"
on storage.objects for select
to public
using (bucket_id = 'customer-avatars');
