-- Adiciona suporte a código de referência (SKU) na tabela de produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;

-- Comentário para documentação
COMMENT ON COLUMN products.sku IS 'Código de referência do produto (opcional)';
