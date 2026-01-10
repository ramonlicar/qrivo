/*
  Seed de Categorias e Criação de Tabela
  
  Objetivos:
  1. Cria a tabela 'categories' se não existir.
  2. Habilita RLS e Policies.
  3. Insere categorias padrão para a primeira empresa encontrada.
*/

-- 1. Criação da Tabela (DDL)
CREATE TABLE IF NOT EXISTS categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_company_id_slug_key UNIQUE (company_id, slug)
);

-- 2. Segurança (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE tablename = 'categories' AND policyname = 'Users can view categories of their company'
    ) THEN
        CREATE POLICY "Users can view categories of their company" ON categories
          FOR SELECT
          USING (auth.uid() IN (
            SELECT user_id FROM memberships WHERE company_id = categories.company_id
          ));
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE tablename = 'categories' AND policyname = 'Users can manage categories of their company'
    ) THEN
        CREATE POLICY "Users can manage categories of their company" ON categories
          FOR ALL
          USING (auth.uid() IN (
            SELECT user_id FROM memberships WHERE company_id = categories.company_id
          ));
    END IF;
END $$;


-- 3. Seed de Dados
DO $$
DECLARE
  v_company_id UUID;
  v_count INTEGER;
BEGIN
  -- Pega a primeira empresa
  SELECT id INTO v_company_id FROM companies LIMIT 1;

  IF v_company_id IS NOT NULL THEN
    
    -- Categorias padrão para e-commerce
    INSERT INTO categories (company_id, name, slug)
    SELECT v_company_id, name, slug
    FROM (VALUES 
      ('Eletrônicos', 'eletronicos'), 
      ('Móveis', 'moveis'), 
      ('Calçados', 'calcados'), 
      ('Eletrodomésticos', 'eletrodomesticos'), 
      ('Acessórios', 'acessorios'),
      ('Roupas', 'roupas'),
      ('Esportes', 'esportes'),
      ('Beleza', 'beleza')
    ) AS t(name, slug)
    WHERE NOT EXISTS (
      SELECT 1 FROM categories WHERE company_id = v_company_id AND (name = t.name OR slug = t.slug)
    );

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Categorias inseridas: % para a empresa %', v_count, v_company_id;

  ELSE
    RAISE NOTICE 'Nenhuma empresa encontrada para criar categorias.';
  END IF;
END $$;
