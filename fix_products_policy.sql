/*
  Correção de Policies e RLS para a tabela de Products
  Objetivo: Garantir que os usuários possam visualizar e gerenciar produtos da sua empresa.
*/

-- 1. Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Criar Policies
DO $$
BEGIN
    -- SELECT
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE tablename = 'products' AND policyname = 'Users can view products of their company'
    ) THEN
        CREATE POLICY "Users can view products of their company" ON products
          FOR SELECT
          USING (auth.uid() IN (
            SELECT user_id FROM memberships WHERE company_id = products.company_id
          ));
    END IF;

    -- INSERT
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE tablename = 'products' AND policyname = 'Users can insert products for their company'
    ) THEN
        CREATE POLICY "Users can insert products for their company" ON products
          FOR INSERT
          WITH CHECK (auth.uid() IN (
            SELECT user_id FROM memberships WHERE company_id = products.company_id
          ));
    END IF;
    
    -- UPDATE
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE tablename = 'products' AND policyname = 'Users can update products of their company'
    ) THEN
        CREATE POLICY "Users can update products of their company" ON products
          FOR UPDATE
          USING (auth.uid() IN (
            SELECT user_id FROM memberships WHERE company_id = products.company_id
          ));
    END IF;

    -- DELETE
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE tablename = 'products' AND policyname = 'Users can delete products of their company'
    ) THEN
        CREATE POLICY "Users can delete products of their company" ON products
          FOR DELETE
          USING (auth.uid() IN (
            SELECT user_id FROM memberships WHERE company_id = products.company_id
          ));
    END IF;
END $$;
