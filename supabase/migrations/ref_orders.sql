-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  agent_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  code text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  subtotal numeric NOT NULL DEFAULT 0.00,
  shipping_fee numeric DEFAULT 0.00,
  total numeric NOT NULL DEFAULT 0.00,
  payment_status USER-DEFINED DEFAULT 'pending'::payment_status,
  order_status USER-DEFINED DEFAULT 'new'::order_status,
  shipping_address jsonb DEFAULT '{}'::jsonb,
  observations text,
  receipt_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT orders_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id),
  CONSTRAINT orders_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
);
