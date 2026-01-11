-- Add delivery_area_id to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_area_id UUID REFERENCES public.delivery_areas(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_area_id ON public.orders(delivery_area_id);
