-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.agent_whatsapp_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL UNIQUE,
  company_id uuid NOT NULL,
  phone_number text,
  status USER-DEFINED DEFAULT 'disconnected'::whatsapp_status,
  session_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agent_whatsapp_integrations_pkey PRIMARY KEY (id),
  CONSTRAINT agent_whatsapp_integrations_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id),
  CONSTRAINT agent_whatsapp_integrations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
