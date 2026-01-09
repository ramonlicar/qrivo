-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  company_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  agent_id uuid,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT messages_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id)
);
