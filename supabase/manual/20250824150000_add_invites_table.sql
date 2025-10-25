/*
  # Add Invites System

  1. New Table
    - `invites` table to store pending invitations
      - `id` (uuid, primary key)
      - `email` (text, email address of invitee)
      - `company_id` (uuid, references companies.id)
      - `invited_by_user_id` (uuid, references profiles.id)
      - `role` (user_role, default 'employee')
      - `status` (text, enum: 'pending', 'accepted', 'revoked')
      - `expires_at` (timestamptz, expiration date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on invites table
    - Add policies for company admins to manage invites
    - Add index on email for efficient lookup during signup
*/

-- Create invite status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status') THEN
    CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'revoked');
  END IF;
END $$;

-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  invited_by_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  status invite_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint to prevent duplicate pending invites
CREATE UNIQUE INDEX IF NOT EXISTS invites_email_company_pending_unique 
ON invites (email, company_id) 
WHERE status = 'pending';

-- Add index for efficient email lookup during signup
CREATE INDEX IF NOT EXISTS invites_email_status_idx ON invites (email, status);

-- Enable Row Level Security
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Invites policies - Company admins can manage invites for their company
CREATE POLICY "Company admins can view company invites"
  ON invites
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
      AND admin_profile.company_id = invites.company_id
    )
  );

CREATE POLICY "Company admins can create invites"
  ON invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
      AND admin_profile.company_id = invites.company_id
    )
    AND invited_by_user_id = auth.uid()
  );

CREATE POLICY "Company admins can update company invites"
  ON invites
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
      AND admin_profile.company_id = invites.company_id
    )
  );

-- Add updated_at trigger
CREATE TRIGGER handle_invites_updated_at
  BEFORE UPDATE ON invites
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Function to check for pending invites during user signup
CREATE OR REPLACE FUNCTION check_pending_invite(user_email text)
RETURNS TABLE (
  invite_id uuid,
  company_id uuid,
  role user_role,
  invited_by_user_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.company_id,
    i.role,
    i.invited_by_user_id
  FROM invites i
  WHERE i.email = user_email
    AND i.status = 'pending'
    AND i.expires_at > now()
  ORDER BY i.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the user creation function to handle invites
CREATE OR REPLACE FUNCTION create_user_company_and_profile()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id uuid;
  company_name text;
  user_role user_role := 'employee';
  pending_invite RECORD;
BEGIN
  -- Check for pending invite first
  SELECT * INTO pending_invite 
  FROM check_pending_invite(NEW.email);
  
  IF pending_invite.invite_id IS NOT NULL THEN
    -- User has a pending invite - add them to the inviting company
    new_company_id := pending_invite.company_id;
    user_role := pending_invite.role;
    
    -- Mark invite as accepted
    UPDATE invites 
    SET status = 'accepted', updated_at = now()
    WHERE id = pending_invite.invite_id;
    
  ELSE
    -- No pending invite - create new company (original behavior)
    company_name := COALESCE(
      split_part(NEW.email, '@', 2) || ' Company',
      'My Company'
    );
    
    INSERT INTO companies (name)
    VALUES (company_name)
    RETURNING id INTO new_company_id;
    
    -- Set role to 'admin' since this is the first user of the company
    user_role := 'admin';
  END IF;
  
  -- Create or update the user profile with the company
  INSERT INTO profiles (id, full_name, company_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_company_id,
    user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    company_id = new_company_id,
    role = user_role,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;