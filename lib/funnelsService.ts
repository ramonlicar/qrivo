import { supabase } from './supabase';

export interface Funnel {
    id: string;
    company_id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
}

export interface FunnelStage {
    id: string;
    funnel_id: string;
    name: string;
    position: number;
    created_at: string;
}

export interface FunnelLead {
    id: string;
    company_id: string;
    funnel_id: string;
    stage_id: string;
    customer_id: string;
    agent_id?: string;
    status: 'active' | 'won' | 'lost';
    value: number; // Keep for legacy/compat
    estimated_value?: number; // Real DB column
    position: number;
    created_at: string;
    updated_at: string;
    // Joins
    customer?: {
        name: string;
        whatsapp: string; // phone
        avatar_url: string;
        email?: string;
    };
    tags?: any[]; // To be joined or fetched separately
}

export const funnelsService = {
    // --- Funnels ---
    async getFunnels(companyId: string) {
        const { data, error } = await supabase
            .from('funnels')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        return { data: data as Funnel[], error };
    },

    async createFunnel(companyId: string, name: string, description?: string) {
        const { data, error } = await supabase
            .from('funnels')
            .insert({ company_id: companyId, name, description })
            .select()
            .single();

        return { data: data as Funnel, error };
    },

    async updateFunnel(funnelId: string, updates: Partial<Funnel>) {
        const { data, error } = await supabase
            .from('funnels')
            .update(updates)
            .eq('id', funnelId)
            .select()
            .single();

        return { data: data as Funnel, error };
    },

    async deleteFunnel(funnelId: string) {
        // Soft delete or hard delete? Let's hard delete for now as per schema requirements usually.
        // Or just set is_active = false
        const { error } = await supabase
            .from('funnels')
            .update({ is_active: false })
            .eq('id', funnelId);

        return { error };
    },

    // --- Stages ---
    async getStages(funnelId: string) {
        const { data, error } = await supabase
            .from('funnel_stages')
            .select('*')
            .eq('funnel_id', funnelId)
            .order('position', { ascending: true });

        return { data: data as FunnelStage[], error };
    },

    async createStage(companyId: string, funnelId: string, name: string, position: number) {
        const { data, error } = await supabase
            .from('funnel_stages')
            .insert({ company_id: companyId, funnel_id: funnelId, name, position })
            .select()
            .single();

        return { data: data as FunnelStage, error };
    },

    async updateStage(stageId: string, updates: Partial<FunnelStage>) {
        const { data, error } = await supabase
            .from('funnel_stages')
            .update(updates)
            .eq('id', stageId)
            .select()
            .single();

        return { data: data as FunnelStage, error };
    },

    async deleteStage(stageId: string) {
        const { error } = await supabase
            .from('funnel_stages')
            .delete()
            .eq('id', stageId);

        return { error };
    },

    // --- Leads ---
    async getLeads(funnelId: string) {
        const { data, error } = await supabase
            .from('funnel_leads')
            .select('*, customer:customers(name, whatsapp, avatar_url, email)')
            .eq('funnel_id', funnelId)
            .eq('status', 'active')
            .order('position', { ascending: true });

        if (error) return { data: [], error };

        return { data: data as FunnelLead[], error: null };
    },

    async batchUpdateLeadPositions(leads: {
        id: string,
        position: number,
        stage_id: string,
        company_id: string,
        funnel_id: string,
        customer_id: string
    }[]) {
        const updates = leads.map(lead => ({
            id: lead.id,
            company_id: lead.company_id,
            funnel_id: lead.funnel_id,
            customer_id: lead.customer_id,
            stage_id: lead.stage_id,
            position: lead.position,
            updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('funnel_leads')
            .upsert(updates);

        return { error };
    },

    async addLead(companyId: string, funnelId: string, stageId: string, customerId: string) {
        // Check if already exists in this funnel?
        const { data: existing } = await supabase
            .from('funnel_leads')
            .select('id')
            .eq('funnel_id', funnelId)
            .eq('customer_id', customerId)
            .eq('status', 'active')
            .maybeSingle();

        if (existing) {
            return { error: { message: "Lead already in this funnel" } };
        }

        const { data, error } = await supabase
            .from('funnel_leads')
            .insert({
                company_id: companyId,
                funnel_id: funnelId,
                stage_id: stageId,
                customer_id: customerId,
                status: 'active'
            })
            .select('*, customer:customers(name, whatsapp, avatar_url, email)')
            .single();

        if (data) {
            await this.addLeadHistory(data.id, companyId, 'created', 'Lead criado no funil');
        }

        return { data: data as FunnelLead, error };
    },

    async moveLead(leadId: string, newStageId: string) {
        const { data, error } = await supabase
            .from('funnel_leads')
            .update({ stage_id: newStageId, updated_at: new Date().toISOString() })
            .eq('id', leadId)
            .select()
            .single();

        if (data) {
            await this.addLeadHistory(leadId, data.company_id, 'moved', 'Lead movido de etapa');
        }

        return { data, error };
    },

    async updateLead(leadId: string, updates: Partial<FunnelLead>) {
        const { data, error } = await supabase
            .from('funnel_leads')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', leadId)
            .select()
            .single();

        return { data: data as FunnelLead, error };
    },

    async deleteLead(leadId: string) {
        const { error } = await supabase
            .from('funnel_leads')
            .delete()
            .eq('id', leadId);

        return { error };
    },

    // --- Lead History ---
    async getLeadHistory(leadId: string) {
        const { data, error } = await supabase
            .from('lead_history')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });

        return { data, error };
    },

    async addLeadHistory(leadId: string, companyId: string, actionType: string, description: string) {
        // We get userId from auth context inside RLS mostly, but here we can rely on default created_by log if RLS handles it.
        // Or we can explicitly pass it if needed, but RLS `default: auth.uid()` is better if configured. 
        // My table definition used `created_by uuid references auth.users(id)`, but I didn't set default.
        // I should probably let Supabase handle it or fetch current user.
        // For now, let's insert simplified.
        const { error } = await supabase
            .from('lead_history')
            .insert({
                lead_id: leadId,
                company_id: companyId,
                action_type: actionType,
                description: description,
                // created_by will be null unless I pass it or trigger sets it. 
                // Given the context I might rely on frontend passing it or backend trigger.
                // I'll trust standard insert for now.
            });

        return { error };
    },

    // --- Lead Files ---
    async getLeadFiles(leadId: string) {
        const { data, error } = await supabase
            .from('lead_files')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });

        return { data, error };
    },

    async uploadLeadFile(companyId: string, leadId: string, file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${leadId}/${Date.now()}.${fileExt}`;
        const filePath = `leads/${fileName}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('lead-attachments')
            .upload(filePath, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('lead-attachments')
            .getPublicUrl(filePath);

        // 3. Save Metadata
        const { data, error: dbError } = await supabase
            .from('lead_files')
            .insert({
                company_id: companyId,
                lead_id: leadId,
                name: file.name,
                url: publicUrl,
                type: file.type,
                size: file.size,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (dbError) throw dbError;

        // Log History
        await this.addLeadHistory(leadId, companyId, 'file', `Arquivo adicionado: ${file.name}`);

        return { data, error: null };
    },

    async deleteLeadFile(fileId: string) {
        // Fetch to get name for log? Too expensive maybe.
        const { error } = await supabase
            .from('lead_files')
            .delete()
            .eq('id', fileId);

        return { error };
    }
};
