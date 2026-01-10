import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

serve(async (req) => {
    try {
        const payload = await req.json()
        const { record, old_record, type, table, schema } = payload

        // Criar cliente admin do supabase (Service Role)
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // Se for DELETE, o ON DELETE CASCADE no banco já cuida disso, 
        // mas poderíamos fazer algo extra aqui se necessário.
        if (type === 'DELETE') {
            return new Response(JSON.stringify({ message: 'Delete handled by CASCADE' }), { status: 200 })
        }

        // Montar string de contexto para o produto
        // Buscamos o nome da categoria se necessário (o webhook envia apenas a linha da tabela)
        let categoryName = "Sem Categoria";
        if (record.category_id) {
            const { data: cat } = await supabase.from('categories').select('name').eq('id', record.category_id).single();
            if (cat) categoryName = cat.name;
        }

        const context = `
      Produto: ${record.name}
      Categoria: ${categoryName}
      Preço: R$ ${record.price}
      Ref/SKU: ${record.sku || 'N/A'}
      Desc Curta: ${record.short_description || ''}
      Desc Longa: ${record.long_description || record.description || ''}
    `.trim().replace(/\s+/g, ' ');

        console.log(`Vetorizando produto: ${record.name}`);

        // Chamada para OpenAI gerar Embedding
        const response = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                input: context,
                model: "text-embedding-3-small"
            })
        });

        const embeddingData = await response.json();
        if (embeddingData.error) throw embeddingData.error;

        const embedding = embeddingData.data[0].embedding;

        // Salvar ou atualizar na tabela de embeddings
        const { error: upsertError } = await supabase
            .from('product_embeddings')
            .upsert({
                product_id: record.id,
                company_id: record.company_id,
                content: context,
                embedding: embedding,
                updated_at: new Date().toISOString()
            }, { onConflict: 'product_id' });

        if (upsertError) throw upsertError;

        return new Response(JSON.stringify({ success: true }), { status: 200 })

    } catch (error) {
        console.error("Erro na Edge Function:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
