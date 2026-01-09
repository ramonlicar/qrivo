-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.customer_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  author_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customer_notes_pkey PRIMARY KEY (id),
  CONSTRAINT customer_notes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT customer_notes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT customer_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
);
