-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  whatsapp text NOT NULL,
  email text,
  avatar_url text,
  active boolean DEFAULT true,
  total_spent numeric DEFAULT 0.00,
  total_orders integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
