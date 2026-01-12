CREATE OR REPLACE VIEW public.customers_with_stats AS
SELECT
  c.id,
  c.company_id,
  c.name,
  c.whatsapp,
  c.email,
  c.avatar_url,
  c.active,
  c.created_at,
  c.updated_at,
  COALESCE(SUM(o.total), 0.00) AS total_spent,
  COUNT(o.id) AS total_orders
FROM public.customers c
LEFT JOIN public.orders o ON c.whatsapp = o.customer_phone AND c.company_id = o.company_id
GROUP BY c.id;
