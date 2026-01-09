-- Create Customer Cart Items Table
CREATE TABLE IF NOT EXISTS public.customer_cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  product_id uuid, -- Optional, could be a manual item
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customer_cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT customer_cart_items_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT customer_cart_items_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE,
  CONSTRAINT customer_cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.customer_cart_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view cart items of their company" ON public.customer_cart_items
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert cart items for their company" ON public.customer_cart_items
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cart items of their company" ON public.customer_cart_items
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cart items of their company" ON public.customer_cart_items
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_cart_items_customer_id ON public.customer_cart_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_cart_items_company_id ON public.customer_cart_items(company_id);
