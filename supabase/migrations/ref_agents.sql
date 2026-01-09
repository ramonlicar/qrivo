-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  type USER-DEFINED NOT NULL DEFAULT 'sales'::agent_type,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{"language": "pt-BR", "temperature": 0.7, "system_instruction": ""}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agents_pkey PRIMARY KEY (id),
  CONSTRAINT agents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
