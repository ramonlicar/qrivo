-- 1. Habilitar a extensão pgvector para suporte a vetores
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Criar tabela para armazenar os embeddings dos produtos
CREATE TABLE IF NOT EXISTS product_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content TEXT NOT NULL, 
  embedding vector(1536), 
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT product_embeddings_product_id_key UNIQUE (product_id)
);

-- 3. Criar um índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_product_embeddings_v_cosine ON product_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. Habilitar RLS e Políticas
-- Permitir que usuários autenticados gerenciem os embeddings de sua empresa
ALTER TABLE product_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company embeddings" ON product_embeddings
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM memberships WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- 5. Função para busca semântica (RPC)
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_company_id UUID
)
RETURNS TABLE (
  id UUID,
  product_id UUID,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.id,
    pe.product_id,
    pe.content,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM product_embeddings pe
  WHERE pe.company_id = p_company_id
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

COMMENT ON TABLE product_embeddings IS 'Armazena vetores de busca semântica para recomendação de produtos via IA.';
