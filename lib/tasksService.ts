
import { supabase } from './supabase';

export interface CrmTask {
    id: string;
    company_id: string;
    lead_id: string; // Changed from customer_id to lead_id
    title: string;
    description?: string;
    due_date?: string;
    is_completed: boolean;
    assignee_id?: string;
    created_at: string;
}

export const tasksService = {
    async getTasks(companyId: string, leadId: string) {
        const { data, error } = await supabase
            .from('lead_tasks')
            .select('*')
            .eq('company_id', companyId)
            .eq('lead_id', leadId)
            .order('due_date', { ascending: true })
            .order('created_at', { ascending: false });

        return { data: data as CrmTask[], error };
    },

    async getTasksByFunnel(companyId: string, funnelId: string) {
        const { data, error } = await supabase
            .from('lead_tasks')
            .select(`
                *,
                lead:funnel_leads!inner(
                    id,
                    funnel_id,
                    customer:customers(name, whatsapp, avatar_url)
                )
            `)
            .eq('company_id', companyId)
            .eq('lead.funnel_id', funnelId)
            .eq('is_completed', false)
            .order('due_date', { ascending: true });

        return { data: data as any[], error };
    },

    async createTask(companyId: string, leadId: string, customerId: string, title: string, dueDate?: string) {
        const { data, error } = await supabase
            .from('lead_tasks')
            .insert({
                company_id: companyId,
                lead_id: leadId,
                customer_id: customerId,
                title,
                due_date: dueDate,
                is_completed: false
            })
            .select()
            .single();

        return { data: data as CrmTask, error };
    },

    async updateTask(taskId: string, updates: Partial<CrmTask>) {
        const { data, error } = await supabase
            .from('lead_tasks')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single();

        return { data: data as CrmTask, error };
    },

    async toggleTask(taskId: string, isCompleted: boolean) {
        return this.updateTask(taskId, { is_completed: isCompleted });
    },

    async deleteTask(taskId: string) {
        const { error } = await supabase
            .from('lead_tasks')
            .delete()
            .eq('id', taskId);

        return { error };
    }
};
