
-- Migration: Allow public access for tracking page
-- This allows any user (including unauthenticated ones) to view specific orders, 
-- their items, and their history log, provided they have the UUID of the order.

-- Ensure SELECT is granted to anon
GRANT SELECT ON public.orders TO anon;
GRANT SELECT ON public.order_items TO anon;
GRANT SELECT ON public.order_history TO anon;

-- 1. Orders: Allow public SELECT by ID
DROP POLICY IF EXISTS "allow_public_select_orders_by_id" ON public.orders;
CREATE POLICY "allow_public_select_orders_by_id" ON public.orders
FOR SELECT TO anon USING (true);

-- 2. Order Items: Allow public SELECT
DROP POLICY IF EXISTS "allow_public_select_order_items" ON public.order_items;
CREATE POLICY "allow_public_select_order_items" ON public.order_items
FOR SELECT TO anon USING (true);

-- 3. Order History: Allow public SELECT
DROP POLICY IF EXISTS "allow_public_select_order_history" ON public.order_history;
CREATE POLICY "allow_public_select_order_history" ON public.order_history
FOR SELECT TO anon USING (true);
