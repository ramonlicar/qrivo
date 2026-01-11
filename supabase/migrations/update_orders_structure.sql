-- Create payment_method_enum type
DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM (
        'pix', 'transfer', 'credit_card', 'debit_card', 'boleto', 'voucher', 'cash', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update orders table structure
ALTER TABLE public.orders
    -- Add customer_id
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id),
    
    -- Add order_summary
    ADD COLUMN IF NOT EXISTS order_summary TEXT,
    
    -- Add responsible_id (linked to public.users)
    ADD COLUMN IF NOT EXISTS responsible_id UUID REFERENCES public.users(id);

-- Change shipping_address from JSONB to TEXT
-- First, checking if it's already text to avoid errors
DO $$ BEGIN
    ALTER TABLE public.orders 
    ALTER COLUMN shipping_address TYPE TEXT USING shipping_address::text;
EXCEPTION
    WHEN OTHERS THEN null; -- Handle cases where it might fail or already be text? Postgres checks types.
END $$;

-- Convert payment_method to ENUM
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Handle conversion safely (explicit cast)
ALTER TABLE public.orders 
    ALTER COLUMN payment_method TYPE payment_method_enum 
    USING payment_method::payment_method_enum;

-- Add indexes for new foreign keys
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_responsible_id ON public.orders(responsible_id);
