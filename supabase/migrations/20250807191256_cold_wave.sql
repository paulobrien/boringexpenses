/*
  # Fix Storage Bucket RLS Policies

  1. Storage Configuration
    - Ensure the 'images' bucket exists with proper settings
    - Enable RLS on storage.objects table
  
  2. Security Policies
    - Allow authenticated users to upload images to their own folders
    - Allow users to read, update, and delete their own images
    - Restrict access to user-specific folders only
*/

-- Ensure the images bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload images to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Create policy for uploading images (INSERT)
CREATE POLICY "Users can upload images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for viewing images (SELECT)  
CREATE POLICY "Users can view own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for updating images (UPDATE)
CREATE POLICY "Users can update own images" 
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for deleting images (DELETE)
CREATE POLICY "Users can delete own images"
ON storage.objects  
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);