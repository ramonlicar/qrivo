-- Enable replication for orders table
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Check if publication exists and add table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    ELSE
        CREATE PUBLICATION supabase_realtime FOR TABLE public.orders;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;
