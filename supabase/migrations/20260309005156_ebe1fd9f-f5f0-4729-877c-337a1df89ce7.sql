
-- Create CMS assets storage bucket for logo and media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-assets', 'cms-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to cms-assets
CREATE POLICY "Public can view cms assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'cms-assets');

-- Only admins can upload/update/delete cms assets
CREATE POLICY "Admins can upload cms assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cms-assets' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update cms assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cms-assets' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete cms assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'cms-assets' AND public.has_role(auth.uid(), 'admin'::app_role));
