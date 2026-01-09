-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  owner_user_id uuid NOT NULL,
  business_area text,
  business_description text,
  onboarding_revenue text,
  onboarding_objective text,
  onboarding_origin text,
  onboarding_tech_level text,
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id)
);
