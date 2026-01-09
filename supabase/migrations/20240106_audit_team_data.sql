-- Migration: Deep Diagnostic Audit
-- Run this in Supabase SQL Editor and check the "Results" tab.

-- 1. Check if the current user exists in public.users
SELECT id, email, full_name, company_roles 
FROM public.users 
WHERE id = auth.uid();

-- 2. Check memberships for this user
SELECT * 
FROM public.memberships 
WHERE user_id = auth.uid();

-- 3. Check companies where this user is owner
SELECT id, name, owner_user_id 
FROM public.companies 
WHERE owner_user_id = auth.uid();

-- 4. Check if the company loaded in the UI (see Diagnostic frame) exists
-- REPLACE '48859369-fb02-443c-b6f6-e33a232c99e0' with the ID from your UI
SELECT * 
FROM public.companies 
WHERE id = '48859369-fb02-443c-b6f6-e33a232c99e0';

-- 5. Check WHO is in that company's membership
SELECT * 
FROM public.memberships 
WHERE company_id = '48859369-fb02-443c-b6f6-e33a232c99e0';
