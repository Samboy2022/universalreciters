
-- Create streams table for user-uploaded recitation videos
CREATE TABLE public.streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'recitation',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view public streams
CREATE POLICY "Anyone can view public streams"
ON public.streams FOR SELECT
TO authenticated
USING (is_public = true);

-- Users can view their own streams
CREATE POLICY "Users can view own streams"
ON public.streams FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own streams
CREATE POLICY "Users can create own streams"
ON public.streams FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own streams
CREATE POLICY "Users can update own streams"
ON public.streams FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own streams
CREATE POLICY "Users can delete own streams"
ON public.streams FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admins can manage all streams
CREATE POLICY "Admins can manage all streams"
ON public.streams FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create stream_likes table
CREATE TABLE public.stream_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(stream_id, user_id)
);

ALTER TABLE public.stream_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes"
ON public.stream_likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can like streams"
ON public.stream_likes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike streams"
ON public.stream_likes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create storage bucket for user stream recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('streams', 'streams', true);

-- Storage policies
CREATE POLICY "Anyone can view stream files"
ON storage.objects FOR SELECT
USING (bucket_id = 'streams');

CREATE POLICY "Authenticated users can upload stream files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'streams');

CREATE POLICY "Users can update own stream files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'streams' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own stream files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'streams' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Enable realtime for streams
ALTER PUBLICATION supabase_realtime ADD TABLE public.streams;
