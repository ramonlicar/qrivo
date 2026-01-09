-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0.00,
  currency text DEFAULT 'BRL'::text,
  interval USER-DEFINED DEFAULT 'month'::billing_interval,
  external_plan_id text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  max_orders integer DEFAULT '-1'::integer,
  max_products integer DEFAULT '-1'::integer,
  max_clients integer DEFAULT '-1'::integer,
  features jsonb DEFAULT '[]'::jsonb,
  interval_count integer DEFAULT 1,
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);
