-- Migration: Add status to memberships table
-- 1. Create membership_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('active', 'pending', 'revoked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add status column to memberships
ALTER TABLE public.memberships 
ADD COLUMN IF NOT EXISTS status membership_status DEFAULT 'active';

-- 3. Update RLS policies to handle status if necessary
-- (Assuming standard RLS for now, but adding the column is the priority)
