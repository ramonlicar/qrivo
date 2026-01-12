-- Create agent_whatsapp_integrations table
CREATE TYPE whatsapp_status AS ENUM ('connected', 'disconnected', 'connecting', 'qr_code_ready');

CREATE TABLE IF NOT EXISTS public.agent_whatsapp_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL UNIQUE,
  company_id uuid NOT NULL,
  phone_number text,
  status whatsapp_status DEFAULT 'disconnected'::whatsapp_status,
  session_id text,
  qr_code text, -- Store base64 QR code temporarily if needed, though usually ephemeral
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agent_whatsapp_integrations_pkey PRIMARY KEY (id),
  CONSTRAINT agent_whatsapp_integrations_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE,
  CONSTRAINT agent_whatsapp_integrations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);

-- RLS Policies
ALTER TABLE public.agent_whatsapp_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view whatsapp integrations for their company"
    ON public.agent_whatsapp_integrations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = agent_whatsapp_integrations.company_id
            AND (
                c.owner_user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.company_id = c.id
                    AND m.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can manage whatsapp integrations for their company"
    ON public.agent_whatsapp_integrations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = agent_whatsapp_integrations.company_id
            AND (
                c.owner_user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.company_id = c.id
                    AND m.user_id = auth.uid()
                    AND m.role IN ('admin')
                )
            )
        )
    );
