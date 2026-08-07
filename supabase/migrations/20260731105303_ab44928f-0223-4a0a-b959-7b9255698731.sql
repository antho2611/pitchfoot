DROP POLICY "Ebooks publiés visibles par tous" ON public.ebooks;
CREATE POLICY "Ebooks publiés visibles par tous" ON public.ebooks
  FOR SELECT USING (is_published);
CREATE POLICY "Admins voient tous les ebooks" ON public.ebooks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));