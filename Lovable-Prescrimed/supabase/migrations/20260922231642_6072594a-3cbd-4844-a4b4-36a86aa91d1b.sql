CREATE POLICY "Users read own document pdfs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documentos-pdf' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own document pdfs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos-pdf' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own document pdfs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documentos-pdf' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'documentos-pdf' AND (storage.foldername(name))[1] = auth.uid()::text);