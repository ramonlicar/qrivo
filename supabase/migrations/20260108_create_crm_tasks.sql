-- Create CRM Tasks Table
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_date timestamp with time zone,
  is_completed boolean DEFAULT false,
  assignee_id uuid, -- Optional: link to a team member
  created_by uuid, -- Optional: link to creator
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT crm_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT crm_tasks_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT crm_tasks_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE
);

-- RLS Policies
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks of their company" ON public.crm_tasks
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks for their company" ON public.crm_tasks
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks of their company" ON public.crm_tasks
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks of their company" ON public.crm_tasks
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_tasks_company_id ON public.crm_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_customer_id ON public.crm_tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due_date ON public.crm_tasks(due_date);
