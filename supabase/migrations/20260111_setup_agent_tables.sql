-- Create custom types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_type') THEN
        CREATE TYPE public.agent_type AS ENUM ('sales', 'support', 'manager');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'response_verbosity') THEN
        CREATE TYPE public.response_verbosity AS ENUM ('concise', 'normal', 'detailed');
    END IF;
END $$;

-- Create agents table if not exists
CREATE TABLE IF NOT EXISTS public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  type public.agent_type NOT NULL DEFAULT 'sales'::agent_type,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{"language": "pt-BR", "temperature": 0.7, "system_instruction": ""}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agents_pkey PRIMARY KEY (id),
  CONSTRAINT agents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);

-- Create agent_configs table if not exists
CREATE TABLE IF NOT EXISTS public.agent_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL UNIQUE,
  company_id uuid NOT NULL,
  company_display_name text NOT NULL,
  business_area text,
  business_description text,
  communication_style text DEFAULT 'Amigável'::text,
  verbosity public.response_verbosity DEFAULT 'normal'::response_verbosity,
  prohibited_words text,
  allowed_emojis text,
  welcome_message text,
  order_confirmation_message text,
  human_handoff_message text,
  follow_up_enabled boolean DEFAULT true,
  follow_up_settings jsonb DEFAULT '{"delay_unit": "hours", "delay_amount": 24, "max_attempts": 3}'::jsonb,
  gender text DEFAULT 'Feminino', -- Added gender column
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agent_configs_pkey PRIMARY KEY (id),
  CONSTRAINT agent_configs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id),
  CONSTRAINT agent_configs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);

-- Add gender column if it hasn't been added yet (for idempotency if table existed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'gender') THEN
        ALTER TABLE public.agent_configs ADD COLUMN gender text DEFAULT 'Feminino';
    END IF;
END $$;
