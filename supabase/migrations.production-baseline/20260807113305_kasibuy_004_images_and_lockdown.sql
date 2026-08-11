update kb_products set image_url = 'https://afiokbhuxfdacbsipoqk.supabase.co/storage/v1/object/public/kasibuy/products/' || code || '.webp';
-- revoke the one-off seed upload permission: storage is now read-only to the public
drop policy if exists kb_storage_seed on storage.objects;