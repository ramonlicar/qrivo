-- Script to create a test order for a specific company
-- This is useful for testing real-time updates in the dashboard.
DO $$
DECLARE
  v_company_id uuid;
  v_agent_id uuid;
  v_customer_id uuid;
  v_product_record record;
  v_order_id uuid;
  v_total numeric := 150.00;
BEGIN
  -- 1. Try to find the company 'Qrivo' or pick the first one available
  SELECT id INTO v_company_id FROM companies WHERE name ILIKE '%Qrivo%' LIMIT 1;
  IF v_company_id IS NULL THEN
    SELECT id INTO v_company_id FROM companies LIMIT 1;
  END IF;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'No company found in the database. Please create a company first.';
  END IF;

  -- 2. Get or create agent for this company
  SELECT id INTO v_agent_id FROM agents WHERE company_id = v_company_id LIMIT 1;
  IF v_agent_id IS NULL THEN
    INSERT INTO agents (company_id, name, type, is_active)
    VALUES (v_company_id, 'Agente de Teste', 'sales', true)
    RETURNING id INTO v_agent_id;
  END IF;

  -- 3. Ensure a test customer exists
  SELECT id INTO v_customer_id FROM customers WHERE company_id = v_company_id LIMIT 1;
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (company_id, name, whatsapp, email, active, total_spent, total_orders)
    VALUES (v_company_id, 'Cliente de Teste', '5511999999999', 'teste@qrivo.ia', true, 0, 0)
    RETURNING id INTO v_customer_id;
  END IF;

  -- 4. Get a sample product
  SELECT * INTO v_product_record FROM products WHERE company_id = v_company_id LIMIT 1;
  
  IF v_product_record.id IS NOT NULL THEN
    v_total := v_product_record.price;
  END IF;

  -- 5. Create the Order
  INSERT INTO orders (
    company_id,
    agent_id,
    customer_name,
    customer_phone,
    customer_id,
    total,
    subtotal,
    shipping_fee,
    payment_status,
    order_status,
    code,
    created_at
  )
  VALUES (
    v_company_id,
    v_agent_id,
    'Cliente de Teste',
    '5511988887777',
    v_customer_id,
    v_total,
    v_total,
    0,
    'pending',
    'new',
    'QR-TEST-' || UPPER(substr(md5(random()::text), 1, 4)),
    NOW()
  )
  RETURNING id INTO v_order_id;

  -- 6. Create Order Item if product exists
  IF v_product_record.id IS NOT NULL THEN
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price_snapshot,
      name_snapshot,
      image_snapshot
    )
    VALUES (
      v_order_id,
      v_product_record.id,
      1,
      v_product_record.price,
      v_product_record.name,
      v_product_record.image_url
    );
  END IF;

  RAISE NOTICE 'Test order created! ID: %, Code: %', v_order_id, (SELECT code FROM orders WHERE id = v_order_id);
END $$;
