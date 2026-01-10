/*
  Seed de Produtos (Products) - Atualizado para Schema correto
  
  Objetivos:
  1. Inserir produtos de exemplo vinculados corretamente às categorias e empresa.
  2. Respeitar constraints (foreign kyes) e tipos (enum product_status).
*/

DO $$
DECLARE
  v_company_id UUID;
  v_products_count INTEGER;
  
  -- IDs das Categorias
  v_cat_eletronicos UUID;
  v_cat_moveis UUID;
  v_cat_calcados UUID;
  v_cat_eletro UUID;
  v_cat_acessorios UUID;
  v_cat_roupas UUID;
  v_cat_esportes UUID;
  v_cat_beleza UUID;
BEGIN
  -- 1. Obter Company ID
  SELECT id INTO v_company_id FROM companies LIMIT 1;

  IF v_company_id IS NOT NULL THEN
    
    -- 2. Obter Category IDs (baseado no seed_categories anterior)
    SELECT id INTO v_cat_eletronicos FROM categories WHERE company_id = v_company_id AND slug = 'eletronicos' LIMIT 1;
    SELECT id INTO v_cat_moveis FROM categories WHERE company_id = v_company_id AND slug = 'moveis' LIMIT 1;
    SELECT id INTO v_cat_calcados FROM categories WHERE company_id = v_company_id AND slug = 'calcados' LIMIT 1;
    SELECT id INTO v_cat_eletro FROM categories WHERE company_id = v_company_id AND slug = 'eletrodomesticos' LIMIT 1;
    SELECT id INTO v_cat_acessorios FROM categories WHERE company_id = v_company_id AND slug = 'acessorios' LIMIT 1;
    SELECT id INTO v_cat_roupas FROM categories WHERE company_id = v_company_id AND slug = 'roupas' LIMIT 1;
    SELECT id INTO v_cat_esportes FROM categories WHERE company_id = v_company_id AND slug = 'esportes' LIMIT 1;
    SELECT id INTO v_cat_beleza FROM categories WHERE company_id = v_company_id AND slug = 'beleza' LIMIT 1;

    -- 3. Verifica contagem atual
    SELECT count(*) INTO v_products_count FROM products WHERE company_id = v_company_id;
    
    IF v_products_count < 5 THEN
    
      -- 4. Inserção com relacionamentos
      INSERT INTO products (
        company_id, 
        category_id, 
        name, 
        price, 
        status, 
        image_url, 
        short_description, 
        long_description
      )
      VALUES
        (
          v_company_id, 
          v_cat_eletronicos,
          'Smartphone X Pro 256GB', 
          4599.90, 
          'active', 
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop', 
          'Smartphone de última geração com câmera profissional.', 
          'O Smartphone X Pro oferece desempenho inigualável com seu processador de última geração. Capture fotos incríveis com a câmera tripla e aproveite a tela OLED de alta resolução.'
        ),
        (
          v_company_id, 
          v_cat_moveis,
          'Cadeira Ergonômica Office', 
          899.00, 
          'active', 
          'https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?q=80&w=400&auto=format&fit=crop', 
          'Conforto máximo para seu home office.', 
          'Cadeira ergonômica com ajuste de altura, encosto reclinável e apoio lombar. Ideal para longas jornadas de trabalho.'
        ),
        (
          v_company_id, 
          v_cat_calcados,
          'Tênis Running Performance', 
          349.90, 
          'active', 
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop', 
          'Leveza e amortecimento para sua corrida.', 
          'Desenvolvido para corredores que buscam performance. Tecnologia de amortecimento avançada e tecido respirável.'
        ),
        (
          v_company_id, 
          v_cat_eletro,
          'Cafeteira Expresso Automática', 
          1250.00, 
          'inactive', 
          'https://images.unsplash.com/photo-1510526786657-3a059dc476cf?q=80&w=400&auto=format&fit=crop', 
          'Café de cafeteria na sua casa.', 
          'Prepare expressos, cappuccinos e lattes com apenas um toque. Moedor integrado para grãos frescos a cada xícara.'
        ),
        (
          v_company_id, 
          v_cat_acessorios,
          'Smartwatch Fitness Tracker', 
          299.90, 
          'active', 
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop', 
          'Monitore sua saúde e exercícios.', 
          'Acompanhe seus batimentos cardíacos, passos, qualidade do sono e notificações do celular. Bateria de longa duração.'
        ),
         (
          v_company_id, 
          v_cat_acessorios,
          'Mochila Executiva Impermeável', 
          189.90, 
          'active', 
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400&auto=format&fit=crop', 
          'Proteção e estilo para seu notebook.', 
          'Mochila resistente à água com compartimento acolchoado para notebook de até 15 polegadas. Diversos bolsos organizadores.'
        ),
        (
          v_company_id, 
          v_cat_eletronicos,
          'Fones de Ouvido Bluetooth', 
          650.00, 
          'active', 
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop', 
          'Imersão total na sua música.', 
          'Cancelamento de ruído ativo para você se concentrar no que importa. Bateria de até 30 horas e conforto premium.'
        ),
        (
          v_company_id, 
          v_cat_beleza,
          'Kit Skincare Completo', 
          180.00, 
          'active', 
          'https://images.unsplash.com/photo-1556228720-1957be979eb4?q=80&w=400&auto=format&fit=crop', 
          'Cuidados essenciais para sua pele.', 
          'Conjunto com hidratante, sabonete facial e sérum vitamina C. Produtos dermatologicamente testados.'
        );

      RAISE NOTICE 'Produtos de exemplo inseridos com sucesso para a empresa ID: %', v_company_id;
    ELSE
      RAISE NOTICE 'Empresa ID: % já possui produtos. Seed ignorado.', v_company_id;
    END IF;

  ELSE
    RAISE NOTICE 'Nenhuma empresa encontrada de id %', v_company_id;
  END IF;
END $$;
