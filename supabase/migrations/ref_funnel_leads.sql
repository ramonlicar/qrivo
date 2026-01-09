-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.funnel_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  funnel_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  agent_id uuid,
  title text,
  estimated_value numeric DEFAULT 0.00,
  status text DEFAULT 'active'::text,
  last_interaction_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT funnel_leads_pkey PRIMARY KEY (id),
  CONSTRAINT funnel_leads_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT funnel_leads_funnel_id_fkey FOREIGN KEY (funnel_id) REFERENCES public.funnels(id),
  CONSTRAINT funnel_leads_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.funnel_stages(id),
  CONSTRAINT funnel_leads_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT funnel_leads_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id)
);
