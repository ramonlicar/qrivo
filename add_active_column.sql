/*
  Adiciona a coluna 'active' na tabela customers.
  Default: true (agente ativo para o cliente)
*/

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'active'
    ) THEN
        ALTER TABLE customers ADD COLUMN active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Coluna active adicionada na tabela customers.';
    ELSE
        RAISE NOTICE 'A coluna active já existe na tabela customers.';
    END IF;
END $$;
