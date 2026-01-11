-- Enable replication for order_history table
ALTER TABLE public.order_history REPLICA IDENTITY FULL;

-- Add order_history to the realtime publication
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_history;
    ELSE
        CREATE PUBLICATION supabase_realtime FOR TABLE public.order_history;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;
