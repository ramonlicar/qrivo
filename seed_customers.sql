/*
  Seed de Clientes (Customers) e Consolidação.
  
  Objetivos:
  1. Remover a tabela antiga 'clients' se existir (para evitar duplicidade).
  2. Garantir que a tabela 'customers' exista (usada pelo restante do sistema).
  3. Inserir dados de exemplo na tabela 'customers'.
*/

-- 1. Remoção da tabela antiga (Limpeza)
DROP TABLE IF EXISTS clients;

-- 2. Criação da Tabela customers (se não existir, baseado no schema identificado)
CREATE TABLE IF NOT EXISTS customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  name text NOT NULL,
  whatsapp text NOT NULL,
  email text,
  avatar_url text,
  active boolean DEFAULT true,
  total_spent numeric DEFAULT 0.00,
  total_orders integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Habilitar RLS para customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acesso (Exemplo básico)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE tablename = 'customers' AND policyname = 'Users can view customers of their company'
    ) THEN
        CREATE POLICY "Users can view customers of their company" ON customers
          FOR SELECT
          USING (auth.uid() IN (
            SELECT user_id FROM memberships WHERE company_id = customers.company_id
          ));
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE tablename = 'customers' AND policyname = 'Users can insert customers for their company'
    ) THEN
        CREATE POLICY "Users can insert customers for their company" ON customers
          FOR INSERT
          WITH CHECK (auth.uid() IN (
            SELECT user_id FROM memberships WHERE company_id = customers.company_id
          ));
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE tablename = 'customers' AND policyname = 'Users can update customers of their company'
    ) THEN
        CREATE POLICY "Users can update customers of their company" ON customers
          FOR UPDATE
          USING (auth.uid() IN (
            SELECT user_id FROM memberships WHERE company_id = customers.company_id
          ));
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE tablename = 'customers' AND policyname = 'Users can delete customers of their company'
    ) THEN
        CREATE POLICY "Users can delete customers of their company" ON customers
          FOR DELETE
          USING (auth.uid() IN (
            SELECT user_id FROM memberships WHERE company_id = customers.company_id
          ));
    END IF;
END $$;


-- 5. Inserção de Dados de Exemplo (Seed)
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Tenta pegar uma empresa existente para vincular os clientes de teste
  SELECT id INTO v_company_id FROM companies LIMIT 1;

  IF v_company_id IS NOT NULL THEN
    -- Inserindo clientes de exemplo compatíveis com o schema 'customers'
    INSERT INTO customers (company_id, name, whatsapp, email, total_spent, total_orders, active)
    VALUES
      (v_company_id, 'Ana Silva', '11999991111', 'ana.silva@email.com', 150.00, 2, true),
      (v_company_id, 'Bruno Souza', '21988882222', 'bruno.souza@email.com', 0.00, 0, true),
      (v_company_id, 'Carlos Pereira', '31977773333', 'carlos.pereira@email.com', 1200.50, 15, false),
      (v_company_id, 'Fernanda Costa', '41966664444', 'fernanda.costa@email.com', 50.00, 1, true),
      (v_company_id, 'João Oliveira', '51955555555', 'joao.oliveira@email.com', 0.00, 0, true);
      
    RAISE NOTICE 'Dados de customers inseridos com sucesso para a empresa ID: %', v_company_id;
  ELSE
    RAISE NOTICE 'Nenhuma empresa encontrada. Crie uma empresa antes de rodar este seed.';
  END IF;
END $$;
