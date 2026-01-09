-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.plan_quotas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL UNIQUE,
  max_agents integer DEFAULT 1,
  max_orders_per_month integer DEFAULT 50,
  max_products integer DEFAULT 100,
  custom_funnels_enabled boolean DEFAULT false,
  analytics_advanced boolean DEFAULT false,
  CONSTRAINT plan_quotas_pkey PRIMARY KEY (id),
  CONSTRAINT plan_quotas_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);
