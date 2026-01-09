-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.customer_tag_assignments (
  customer_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  CONSTRAINT customer_tag_assignments_pkey PRIMARY KEY (customer_id, tag_id),
  CONSTRAINT customer_tag_assignments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT customer_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.customer_tags(id)
);
