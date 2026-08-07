ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS content_path text;

CREATE POLICY "ebooks_private_admin_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ebooks-private' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ebooks_private_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ebooks-private' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'ebooks-private' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ebooks_private_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ebooks-private' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ebooks_private_admin_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ebooks-private' AND public.has_role(auth.uid(), 'admin'));