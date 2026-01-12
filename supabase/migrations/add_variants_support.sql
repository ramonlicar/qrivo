-- Adiciona suporte a variações na tabela de produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_attributes JSONB DEFAULT '[]'::jsonb;

-- Índice para busca rápida de variações de um produto
CREATE INDEX IF NOT EXISTS idx_products_parent_id ON products(parent_id);

-- Comentários para documentação
COMMENT ON COLUMN products.parent_id IS 'ID do produto pai para variações';
COMMENT ON COLUMN products.variant_attributes IS 'Lista de atributos (nome/valor) que definem esta variação';
