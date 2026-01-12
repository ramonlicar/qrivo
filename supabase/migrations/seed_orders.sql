-- Function to seed sample orders for ALL companies
DO $$
DECLARE
  r_company RECORD;
  v_agent_id uuid;
  v_product_1_record record;
  v_order_id uuid;
  v_total numeric := 0;
BEGIN
  -- Iterate through all companies
  FOR r_company IN SELECT id FROM companies LOOP
    
    -- 1. Get or create agent for this company
    SELECT id INTO v_agent_id FROM agents WHERE company_id = r_company.id LIMIT 1;
    IF v_agent_id IS NULL THEN
      INSERT INTO agents (company_id, name, type, is_active)
      VALUES (r_company.id, 'Agente Padrão', 'sales', true)
      RETURNING id INTO v_agent_id;
    END IF;

    -- 2. Ensure customer exists
    PERFORM id FROM customers WHERE company_id = r_company.id LIMIT 1;
    IF NOT FOUND THEN
      INSERT INTO customers (company_id, name, whatsapp, email, active, total_spent, total_orders)
      VALUES (r_company.id, 'Cliente Exemplo', '5511999999999', 'cliente@exemplo.com', true, 0, 0);
    END IF;

    -- 3. Get products
    SELECT * INTO v_product_1_record FROM products WHERE company_id = r_company.id LIMIT 1;

    IF v_product_1_record.id IS NOT NULL THEN
      v_total := v_product_1_record.price;

      -- 4. Create Order
      INSERT INTO orders (
        company_id,
        agent_id,
        customer_name,
        customer_phone,
        total,
        subtotal,
        shipping_fee,
        payment_status,
        order_status,
        code,
        created_at,
        conversation_id
      )
      VALUES (
        r_company.id,
        v_agent_id,
        'Cliente Exemplo',
        '5511999999999',
        v_total,
        v_total,
        0,
        'paid',
        'new',
        'ORD-' || floor(random() * 100000)::text,
        NOW(),
        NULL
      )
      RETURNING id INTO v_order_id;

      -- 5. Create Order Items
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
        v_product_1_record.id,
        1,
        v_product_1_record.price,
        v_product_1_record.name,
        v_product_1_record.image_url
      );

      RAISE NOTICE 'Sample order created for Company %: ID %', r_company.id, v_order_id;
    ELSE
      RAISE NOTICE 'No products found for Company %. Skipping.', r_company.id;
    END IF;

  END LOOP;
END $$;
