/*
  # Add Subscription Support

  1. New Tables
    - `subscriptions` table to mirror Stripe subscription state
    
  2. Profile Changes
    - Add `plan_type` (enum: 'free', 'pro_monthly', 'pro_annual')
    - Add `subscription_status` (enum: 'active', 'trialing', 'past_due', 'canceled', 'incomplete')
    - Add `trial_expiry` (timestamptz)
    - Add `stripe_customer_id` (text)

  3. Security
    - Enable RLS on subscriptions table
    - Add policies for subscription management
    - Ensure users can only see their own subscription data

  4. Default Values
    - New users default to 'free' plan with 24h trial
    - Trial expiry set to 24 hours from signup
*/

-- Create plan type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
    CREATE TYPE plan_type AS ENUM ('free', 'pro_monthly', 'pro_annual');
  END IF;
END $$;

-- Create subscription status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'incomplete');
  END IF;
END $$;

-- Add subscription fields to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN plan_type plan_type NOT NULL DEFAULT 'free';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_status subscription_status NOT NULL DEFAULT 'trialing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_expiry'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_expiry timestamptz DEFAULT (now() + interval '24 hours');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

-- Create subscriptions table to mirror Stripe subscription data
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  status subscription_status NOT NULL,
  plan_type plan_type NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Only backend can insert subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (false); -- Only allow via service role

CREATE POLICY "Only backend can update subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (false); -- Only allow via service role

-- Update existing users to have trial expiry set
UPDATE profiles 
SET trial_expiry = created_at + interval '24 hours'
WHERE trial_expiry IS NULL;

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  profile_record profiles%ROWTYPE;
BEGIN
  SELECT * INTO profile_record FROM profiles WHERE id = user_id_param;
  
  -- If user doesn't exist, return false
  IF profile_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if subscription is active
  IF profile_record.subscription_status = 'active' THEN
    RETURN true;
  END IF;
  
  -- Check if still in trial period
  IF profile_record.subscription_status = 'trialing' AND 
     profile_record.trial_expiry > now() THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to premium features
CREATE OR REPLACE FUNCTION has_premium_access(user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  profile_record profiles%ROWTYPE;
BEGIN
  SELECT * INTO profile_record FROM profiles WHERE id = user_id_param;
  
  -- If user doesn't exist, return false
  IF profile_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has paid plan
  IF profile_record.plan_type IN ('pro_monthly', 'pro_annual') AND
     profile_record.subscription_status = 'active' THEN
    RETURN true;
  END IF;
  
  -- Check if still in trial period (trial users get premium access)
  IF profile_record.subscription_status = 'trialing' AND 
     profile_record.trial_expiry > now() THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the user creation function to set trial expiry
CREATE OR REPLACE FUNCTION create_user_company_and_profile()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id uuid;
  company_name text;
  user_role user_role := 'employee';
BEGIN
  -- Generate company name from email domain or use default
  company_name := COALESCE(
    split_part(NEW.email, '@', 2) || ' Company',
    'My Company'
  );
  
  -- Create a new company for the user
  INSERT INTO companies (name)
  VALUES (company_name)
  RETURNING id INTO new_company_id;
  
  -- Set role to 'admin' since this is the first user of the company
  user_role := 'admin';
  
  -- Create or update the user profile with the company and trial
  INSERT INTO profiles (
    id, 
    full_name, 
    company_id, 
    role, 
    plan_type, 
    subscription_status, 
    trial_expiry
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_company_id,
    user_role,
    'free',
    'trialing',
    now() + interval '24 hours'
  )
  ON CONFLICT (id) DO UPDATE SET
    company_id = new_company_id,
    role = user_role,
    plan_type = 'free',
    subscription_status = 'trialing',
    trial_expiry = now() + interval '24 hours',
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;