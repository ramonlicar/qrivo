-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  category_id uuid,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0.00,
  status USER-DEFINED DEFAULT 'active'::product_status,
  image_url text,
  short_description text,
  long_description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
