-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.team_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  email text NOT NULL,
  role USER-DEFINED DEFAULT 'agent'::team_role,
  invited_by uuid,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT team_invitations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT team_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id)
);
