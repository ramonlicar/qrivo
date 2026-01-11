-- Create order_history table
CREATE TABLE IF NOT EXISTS public.order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- e.g., 'status_change', 'payment_update', 'customer_linked'
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON public.order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_company_id ON public.order_history(company_id);

-- Enable RLS
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Enable read access for authenticated users in the same company" 
ON public.order_history FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE memberships.user_id = auth.uid() 
        AND memberships.company_id = order_history.company_id
    )
);

CREATE POLICY "Enable insert for authenticated users in the same company" 
ON public.order_history FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE memberships.user_id = auth.uid() 
        AND memberships.company_id = order_history.company_id
    )
);
