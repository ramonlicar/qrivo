-- Create Funnels Table
CREATE TABLE IF NOT EXISTS public.funnels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT funnels_pkey PRIMARY KEY (id),
  CONSTRAINT funnels_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);

-- Create Funnel Stages Table
CREATE TABLE IF NOT EXISTS public.funnel_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL,
  company_id uuid NOT NULL,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT funnel_stages_pkey PRIMARY KEY (id),
  CONSTRAINT funnel_stages_funnel_id_fkey FOREIGN KEY (funnel_id) REFERENCES public.funnels(id) ON DELETE CASCADE,
  CONSTRAINT funnel_stages_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);

-- Create Funnel Leads Table (Intermediary to link Customers to Stages)
-- NOTE: If we want to move leads between funnels easily, we might just need one active stage per customer per funnel?
-- For now, a simple linkage.
CREATE TABLE IF NOT EXISTS public.funnel_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  funnel_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  agent_id uuid, -- Optional assignment
  status text DEFAULT 'active', -- active, won, lost
  value numeric DEFAULT 0.00,
  position integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT funnel_leads_pkey PRIMARY KEY (id),
  CONSTRAINT funnel_leads_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT funnel_leads_funnel_id_fkey FOREIGN KEY (funnel_id) REFERENCES public.funnels(id) ON DELETE CASCADE,
  CONSTRAINT funnel_leads_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.funnel_stages(id) ON DELETE CASCADE,
  CONSTRAINT funnel_leads_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE
);

-- RLS Policies

-- Funnels
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view funnels of their company" ON public.funnels
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert funnels for their company" ON public.funnels
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update funnels of their company" ON public.funnels
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete funnels of their company" ON public.funnels
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- Funnel Stages
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stages of their company" ON public.funnel_stages
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stages for their company" ON public.funnel_stages
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stages of their company" ON public.funnel_stages
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stages of their company" ON public.funnel_stages
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- Funnel Leads
ALTER TABLE public.funnel_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads of their company" ON public.funnel_leads
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert leads for their company" ON public.funnel_leads
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update leads of their company" ON public.funnel_leads
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete leads of their company" ON public.funnel_leads
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_funnels_company_id ON public.funnels(company_id);
CREATE INDEX IF NOT EXISTS idx_funnel_stages_funnel_id ON public.funnel_stages(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_leads_stage_id ON public.funnel_leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_funnel_leads_customer_id ON public.funnel_leads(customer_id);
