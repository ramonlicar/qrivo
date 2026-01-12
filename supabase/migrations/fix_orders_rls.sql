-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Orders Policies

-- 1. View Orders (Users can view orders of their company)
DROP POLICY IF EXISTS "view_company_orders" ON public.orders;
CREATE POLICY "view_company_orders" ON public.orders
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
  )
);

-- 2. Insert Orders (Users can insert orders for their company)
DROP POLICY IF EXISTS "insert_company_orders" ON public.orders;
CREATE POLICY "insert_company_orders" ON public.orders
FOR INSERT WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
  )
);

-- 3. Update Orders
DROP POLICY IF EXISTS "update_company_orders" ON public.orders;
CREATE POLICY "update_company_orders" ON public.orders
FOR UPDATE USING (
  company_id IN (
    SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
  )
);

-- 4. Delete Orders
DROP POLICY IF EXISTS "delete_company_orders" ON public.orders;
CREATE POLICY "delete_company_orders" ON public.orders
FOR DELETE USING (
  company_id IN (
    SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
  )
);


-- Order Items Policies

-- 1. View Order Items (via Order access)
DROP POLICY IF EXISTS "view_order_items" ON public.order_items;
CREATE POLICY "view_order_items" ON public.order_items
FOR SELECT USING (
  order_id IN (
    SELECT id FROM public.orders
  )
);

-- 2. Insert Order Items
DROP POLICY IF EXISTS "insert_order_items" ON public.order_items;
CREATE POLICY "insert_order_items" ON public.order_items
FOR INSERT WITH CHECK (
  order_id IN (
    SELECT id FROM public.orders
  )
);

-- 3. Update Order Items
DROP POLICY IF EXISTS "update_order_items" ON public.order_items;
CREATE POLICY "update_order_items" ON public.order_items
FOR UPDATE USING (
  order_id IN (
    SELECT id FROM public.orders
  )
);

-- 4. Delete Order Items
DROP POLICY IF EXISTS "delete_order_items" ON public.order_items;
CREATE POLICY "delete_order_items" ON public.order_items
FOR DELETE USING (
  order_id IN (
    SELECT id FROM public.orders
  )
);
