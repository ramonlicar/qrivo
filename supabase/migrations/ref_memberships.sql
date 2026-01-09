-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role USER-DEFINED DEFAULT 'member'::membership_role,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT memberships_pkey PRIMARY KEY (id),
  CONSTRAINT memberships_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
