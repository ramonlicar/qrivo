-- Add operating mode and hours to agent_configs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'operating_mode') THEN
        ALTER TABLE public.agent_configs ADD COLUMN operating_mode text DEFAULT 'Sempre';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'working_hours_start') THEN
        ALTER TABLE public.agent_configs ADD COLUMN working_hours_start text DEFAULT '08:00';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'working_hours_end') THEN
        ALTER TABLE public.agent_configs ADD COLUMN working_hours_end text DEFAULT '18:00';
    END IF;
END $$;
