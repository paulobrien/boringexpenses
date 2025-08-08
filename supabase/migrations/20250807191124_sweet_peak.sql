/*
  # Setup Storage RLS Policies for Images

  1. Security Policies
    - Enable RLS on storage.objects table
    - Allow authenticated users to upload images to their own folder
    - Allow authenticated users to read their own images
    - Allow authenticated users to delete their own images
    - Allow authenticated users to update their own image metadata

  2. Bucket Configuration
    - Policies scoped to 'images' bucket
    - User folder isolation using auth.uid()
*/

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for uploading images (INSERT)
CREATE POLICY "Users can upload images to own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for viewing images (SELECT)
CREATE POLICY "Users can read own images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for deleting images (DELETE)
CREATE POLICY "Users can delete own images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for updating image metadata (UPDATE)
CREATE POLICY "Users can update own images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );