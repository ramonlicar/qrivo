-- Enforce one agent of each type per company
DO $$
BEGIN
    -- Check if the constraint already exists to avoid errors
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'agents_company_id_type_key'
    ) THEN
        -- Add the unique constraint
        ALTER TABLE public.agents
        ADD CONSTRAINT agents_company_id_type_key UNIQUE (company_id, type);
    END IF;
END $$;

-- Ensure gender column exists in agent_configs (if user's schema didn't have it)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'gender') THEN
        ALTER TABLE public.agent_configs ADD COLUMN gender text DEFAULT 'Feminino';
    END IF;
END $$;
