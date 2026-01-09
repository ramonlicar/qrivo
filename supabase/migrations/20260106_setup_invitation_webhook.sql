
-- Migration: Setup Invitation Webhook
-- Objective: Automatically trigger the invitation-notifier Edge Function when a new invitation is created.

-- 1. Enable pg_net extension (required for http requests from SQL)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION public.on_team_invitation_created()
RETURNS trigger AS $$
DECLARE
  v_project_url text;
  v_service_key text;
BEGIN
  -- NOTE: You MUST set these secrets in your database or replace them here.
  -- For Supabase, the best way is to use the Dashboard Webhook UI, 
  -- but this SQL provides a robust alternative using the internal vault or hardcoded values.
  
  -- Attempt to get the project URL (fallback to a placeholder)
  v_project_url := 'https://jrejnhnrenzqfotuzktr.supabase.co';
  
  -- We use the service_role key to authorize the Edge Function call.
  -- WARNING: It is safer to manage this via Supabase Dashboard > Database > Webhooks.
  -- If you prefer using SQL, ensure you have the correct service_role key.
  
  PERFORM
    net.http_post(
      url := v_project_url || '/functions/v1/invitation-notifier',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS tr_on_team_invitation_created ON public.team_invitations;
CREATE TRIGGER tr_on_team_invitation_created
AFTER INSERT ON public.team_invitations
FOR EACH ROW
EXECUTE FUNCTION public.on_team_invitation_created();

COMMENT ON FUNCTION public.on_team_invitation_created() IS 'Triggers the invitation-notifier Edge Function via pg_net when a new record is inserted.';
