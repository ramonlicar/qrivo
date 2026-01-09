/*
  Criação da tabela de Clientes e inserção de dados de exemplo.
  Este script assume que a tabela 'companies' já existe.
*/

-- 1. Criação da Tabela (se não existir)
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS (Segurança)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Acesso (Exemplo simples: usuários autenticados podem ver e criar)
-- Ajuste conforme a necessidade real de segurança do seu app (ex: checar membership da company)
CREATE POLICY "Users can view clients of their company" ON clients
  FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM memberships WHERE company_id = clients.company_id
  ));

CREATE POLICY "Users can insert clients for their company" ON clients
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM memberships WHERE company_id = clients.company_id
  ));
  
CREATE POLICY "Users can update clients of their company" ON clients
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM memberships WHERE company_id = clients.company_id
  ));

-- 4. Inserção de Dados de Exemplo (Seed)
-- ATENÇÃO: Pegaremos a primeira empresa encontrada no banco para associar os clientes.
-- Se quiser uma empresa específica, substitua o subselect (SELECT id FROM companies LIMIT 1) pelo UUID da empresa.

DO $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Tenta pegar uma empresa existente
  SELECT id INTO v_company_id FROM companies LIMIT 1;

  IF v_company_id IS NOT NULL THEN
    INSERT INTO clients (company_id, full_name, phone, email, status)
    VALUES
      (v_company_id, 'Ana Silva', '11999991111', 'ana.silva@email.com', 'active'),
      (v_company_id, 'Bruno Souza', '21988882222', 'bruno.souza@email.com', 'active'),
      (v_company_id, 'Carlos Pereira', '31977773333', 'carlos.pereira@email.com', 'inactive'),
      (v_company_id, 'Fernanda Costa', '41966664444', 'fernanda.costa@email.com', 'active'),
      (v_company_id, 'João Oliveira', '51955555555', 'joao.oliveira@email.com', 'negotiation');
      
    RAISE NOTICE 'Clientes de exemplo inseridos com sucesso para a empresa ID: %', v_company_id;
  ELSE
    RAISE NOTICE 'Nenhuma empresa encontrada na tabela companies. Crie uma empresa antes de rodar este seed.';
  END IF;
END $$;
