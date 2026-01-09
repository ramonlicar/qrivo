-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.agent_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL UNIQUE,
  company_id uuid NOT NULL,
  company_display_name text NOT NULL,
  business_area text,
  business_description text,
  communication_style text DEFAULT 'Amigável'::text,
  verbosity USER-DEFINED DEFAULT 'normal'::response_verbosity,
  prohibited_words text,
  allowed_emojis text,
  welcome_message text,
  order_confirmation_message text,
  human_handoff_message text,
  follow_up_enabled boolean DEFAULT true,
  follow_up_settings jsonb DEFAULT '{"delay_unit": "hours", "delay_amount": 24, "max_attempts": 3}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agent_configs_pkey PRIMARY KEY (id),
  CONSTRAINT agent_configs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id),
  CONSTRAINT agent_configs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
