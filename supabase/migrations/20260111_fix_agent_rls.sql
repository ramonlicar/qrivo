-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;

-- Agents Policies
-- Drop existing policies if they exist to avoid conflicts (though newly created tables shouldn't have them, best practice)
DROP POLICY IF EXISTS "Users can view agents of their company" ON public.agents;
DROP POLICY IF EXISTS "Users can insert agents for their company" ON public.agents;
DROP POLICY IF EXISTS "Users can update agents of their company" ON public.agents;
DROP POLICY IF EXISTS "Users can delete agents of their company" ON public.agents;

CREATE POLICY "Users can view agents of their company" ON public.agents
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
    OR company_id = auth.uid()
  );

CREATE POLICY "Users can insert agents for their company" ON public.agents
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
    OR company_id = auth.uid()
  );

CREATE POLICY "Users can update agents of their company" ON public.agents
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
    OR company_id = auth.uid()
  );

CREATE POLICY "Users can delete agents of their company" ON public.agents
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
    OR company_id = auth.uid()
  );

-- Agent Configs Policies
DROP POLICY IF EXISTS "Users can view agent configs of their company" ON public.agent_configs;
DROP POLICY IF EXISTS "Users can insert agent configs for their company" ON public.agent_configs;
DROP POLICY IF EXISTS "Users can update agent configs of their company" ON public.agent_configs;
DROP POLICY IF EXISTS "Users can delete agent configs of their company" ON public.agent_configs;

CREATE POLICY "Users can view agent configs of their company" ON public.agent_configs
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
    OR company_id = auth.uid()
  );

CREATE POLICY "Users can insert agent configs for their company" ON public.agent_configs
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
    OR company_id = auth.uid()
  );

CREATE POLICY "Users can update agent configs of their company" ON public.agent_configs
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
    OR company_id = auth.uid()
  );

CREATE POLICY "Users can delete agent configs of their company" ON public.agent_configs
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
    OR company_id = auth.uid()
  );
