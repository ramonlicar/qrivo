-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  company_id uuid NOT NULL,
  category text DEFAULT 'Geral'::text,
  question text NOT NULL,
  answer text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT faqs_pkey PRIMARY KEY (id),
  CONSTRAINT faqs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id),
  CONSTRAINT faqs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
