-- Migration: Auto-setup public user and company on signup
-- This trigger runs on auth.users and populates the public schema.

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
    company_id uuid;
    company_name text;
BEGIN
    -- 1.1 Sync User to public.users
    INSERT INTO public.users (id, email, full_name, whatsapp, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'whatsapp',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        whatsapp = COALESCE(EXCLUDED.whatsapp, public.users.whatsapp),
        updated_at = NOW();

    -- 1.2 Create Company if company_name exists in metadata
    company_name := NEW.raw_user_meta_data->>'company_name';
    
    IF company_name IS NOT NULL THEN
        -- Check if user already owns a company to avoid duplicates
        IF NOT EXISTS (SELECT 1 FROM public.companies WHERE owner_user_id = NEW.id) THEN
            INSERT INTO public.companies (owner_user_id, name, slug, created_at, updated_at)
            VALUES (
                NEW.id,
                company_name,
                'empresa-' || substring(NEW.id::text, 1, 8) || '-' || lower(substring(md5(random()::text), 1, 6)),
                NOW(),
                NOW()
            );
            -- Note: The 'after_company_insert' trigger on 'companies' table 
            -- will automatically handle the membership record.
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();
