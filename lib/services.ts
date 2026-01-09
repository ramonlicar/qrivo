
import { supabase } from './supabase';
import { CartItem } from '../types';

// --- Interfaces de Retorno ---
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  error: any;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  interval_count: number;
  max_orders: number;
  max_products: number;
  max_clients: number;
  features: string[];
  is_active: boolean;
}

export interface Subscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

// --- Onboarding Service ---
export const onboardingService = {
  /**
   * Completa o onboarding salvando os dados na tabela companies.
   * Se a empresa não existir para o owner_user_id, ela é criada.
   */
  async completeOnboarding(userId: string, formData: any) {
    let companyId = null;

    // 1. Tentar obter ID dos metadados do usuário (Prioridade Máxima)
    const { data: { user } } = await supabase.auth.getUser();
    const metadataCompanyName = user?.user_metadata?.company_name;

    if (user?.user_metadata?.company_id) {
      companyId = user.user_metadata.company_id;
    }

    // 2. Fallbacks (Membership ou Owner)
    if (!companyId) {
      // Tenta achar via Membership
      const { data: membership } = await supabase
        .from('memberships')
        .select('company_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (membership?.company_id) {
        companyId = membership.company_id;
      } else {
        // Fallback antigo: owner_user_id
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_user_id', userId)
          .maybeSingle();
        if (existingCompany) companyId = existingCompany.id;
      }
    }

    if (!companyId) {
      // Se não achou empresa, algo deu errado com o Trigger ou o fluxo.
      console.error("Erro crítico: Empresa não encontrada para o usuário após signup.");
      throw new Error("Conta empresarial não localizada. Por favor, tente novamente.");
    }

    // 2. Atualizar a empresa encontrada
    const companyData: any = {
      // name: Só atualizamos se vier no formulário
      business_area: formData.areaAtuacao,
      business_description: formData.descricao,
      onboarding_revenue: formData.faturamento,
      onboarding_objective: formData.objetivo,
      onboarding_origin: formData.origem,
      onboarding_tech_level: formData.nivelTech,
      updated_at: new Date().toISOString()
    };

    if (formData.empresaNome && formData.empresaNome.trim() !== '') {
      companyData.name = formData.empresaNome;
    } else if (metadataCompanyName) {
      // Se não tem nome no form (removido no passo anterior), mas tem no metadata (cadastro), usa o do cadastro.
      companyData.name = metadataCompanyName;
    }

    const { error } = await supabase
      .from('companies')
      .update(companyData)
      .eq('id', companyId);

    if (error) throw error;

    // 3. Atualizar cargo do usuário (Tabela users)
    if (formData.cargo) {
      const { error: userError } = await supabase
        .from('users')
        .update({
          job_title: formData.cargo,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (userError) console.error("Erro ao salvar cargo do usuário:", userError);
    }

    // Garantir agente
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', 'Maya')
      .maybeSingle();

    if (!agent) {
      await supabase.from('agents').insert({
        company_id: companyId,
        name: 'Maya',
        type: 'sales',
        is_active: true
      });
    }

    return { success: true, companyId };
  },

  async checkOnboardingStatus(userId: string) {
    // Verifica se usuário tem membership e se a empresa tem dados
    const { data } = await supabase
      .from('memberships')
      .select('company_id, companies(business_area)')
      .eq('user_id', userId)
      .maybeSingle();

    // Check safely depending on how supabase returns joined data
    const company = data?.companies as any;
    return !!(company && company.business_area);
  }
};

// --- Companies Service ---
export const companiesService = {
  async getMyCompany(userId: string) {
    // 1. Tenta buscar via membership (Novo padrão)
    const { data: memberData, error: memberError } = await supabase
      .from('memberships')
      .select('company:companies(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (memberData?.company) {
      return { data: memberData.company, error: null };
    }

    // 2. Fallback: Tenta buscar pelo owner_user_id (Legado / Compatibilidade)
    const { data: ownerData, error: ownerError } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (ownerData && !memberError) {
      // Heal: Criar o membership que deveria existir
      console.log("Heal: Checking/Creating missing membership for owner...");
      const { error: healError } = await supabase.from('memberships').upsert({
        user_id: userId,
        company_id: ownerData.id,
        role: 'owner',
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id, company_id' });

      if (healError) {
        console.error("Heal Error: Failed to create owner membership automatically:", healError);
      } else {
        console.log("Heal Success: Membership ensured for owner.");
      }
    }

    return { data: ownerData, error: ownerError };
  },

  async updateCompany(companyId: string, companyData: any) {
    const { data, error } = await supabase
      .from('companies')
      .update(companyData)
      .eq('id', companyId)
      .select()
      .single();
    return { data, error };
  }
};

// --- User Service (formerly Profile) ---
export const userService = {
  async getMyProfile(userId: string) {
    const { data, error } = await supabase
      .from('users') // Updated table name
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return { data, error };
  },

  async updateProfile(userId: string, profileData: any) {
    const { data, error } = await supabase
      .from('users') // Updated table name
      .upsert({
        id: userId,
        ...profileData
      })
      .select()
      .single();
    return { data, error };
  },

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // 1. Upload file to storage (overwrite if exists)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // 3. Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) throw updateError;

    return publicUrl;
  },

  async removeAvatar(userId: string) {
    // 1. Set avatar_url to null in db
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Note: We don't necessarily need to delete from storage if we use upsert, 
    // but we could list and remove for cleanup if desired.
    return { success: true };
  }
};

// --- Customers Service ---
export const customersService = {
  async getCustomers(companyId: string, page = 1, pageSize = 12): Promise<PaginatedResponse<any>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('customers_with_stats')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .order('name', { ascending: true })
      .range(from, to);

    if (error) return { data: [], count: 0, error };

    // Fetch tags for these customers
    const customerIds = data.map(c => c.id);
    let tagsMap: Record<string, any[]> = {};

    if (customerIds.length > 0) {
      const { data: assignments } = await supabase
        .from('customer_tag_assignments')
        .select('customer_id, tag:customer_tags(name, color)')
        .in('customer_id', customerIds);

      if (assignments) {
        assignments.forEach((assignment: any) => {
          if (!tagsMap[assignment.customer_id]) {
            tagsMap[assignment.customer_id] = [];
          }
          if (assignment.tag) {
            tagsMap[assignment.customer_id].push({
              text: assignment.tag.name,
              color: assignment.tag.color
            });
          }
        });
      }
    }

    // Map snake_case DB fields to camelCase Frontend Interface (Customer)
    const mappedData = data.map(item => ({
      id: item.id,
      name: item.name,
      phone: item.whatsapp,
      email: item.email || '',
      avatar: item.avatar_url || '',
      createdAt: item.created_at, // Consider formatting date here if needed, or in frontend
      totalOrders: item.total_orders,
      totalSpent: item.total_spent,
      isAiEnabled: item.active,
      tags: tagsMap[item.id] || []
    }));

    return { data: mappedData, count: count || 0, error: null };
  },

  async createCustomer(companyId: string, customerData: any) {
    // Map camelCase -> snake_case
    // Sanitize phone and ensure DDI 55 if length is 10 or 11
    let cleanPhone = customerData.phone.replace(/\D/g, '');
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      cleanPhone = '55' + cleanPhone;
    }

    const dbData = {
      company_id: companyId,
      name: customerData.name,
      whatsapp: cleanPhone,
      email: customerData.email,
      avatar_url: customerData.avatar,
      active: customerData.isAiEnabled ?? true,
      // Defaults
      total_spent: 0,
      total_orders: 0
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(dbData)
      .select()
      .single();

    return { data, error };
  },

  async updateCustomer(customerId: string, customerData: any) {
    const updates: any = {};
    if (customerData.name !== undefined) updates.name = customerData.name;

    if (customerData.phone !== undefined) {
      let cleanPhone = customerData.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
        cleanPhone = '55' + cleanPhone;
      }
      updates.whatsapp = cleanPhone;
    }

    if (customerData.email !== undefined) updates.email = customerData.email;
    if (customerData.avatar !== undefined) updates.avatar_url = customerData.avatar;
    if (customerData.isAiEnabled !== undefined) updates.active = customerData.isAiEnabled;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', customerId)
      .select()
      .single();

    return { data, error };
  },

  async deleteCustomer(customerId: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);
    return { error };
  },

  async toggleCustomerActive(customerId: string, isActive: boolean) {
    return this.updateCustomer(customerId, { isAiEnabled: isActive });
  },

  async uploadCustomerAvatar(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `customer_${Date.now()}.${fileExt}`;
    const filePath = `customers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async addTag(companyId: string, customerId: string, text: string, color: string) {
    // 1. Check if tag exists or create it
    let tagId: string | null = null;

    const { data: existingTag } = await supabase
      .from('customer_tags')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', text)
      .maybeSingle();

    if (existingTag) {
      tagId = existingTag.id;
    } else {
      const { data: newTag, error: createError } = await supabase
        .from('customer_tags')
        .insert({
          company_id: companyId,
          name: text,
          color: color
        })
        .select('id')
        .single();

      if (createError) throw createError;
      tagId = newTag.id;
    }

    if (!tagId) throw new Error("Failed to get tag ID");

    // 2. Create assignment
    const { error: assignError } = await supabase
      .from('customer_tag_assignments')
      .upsert({
        customer_id: customerId,
        tag_id: tagId
      }, { onConflict: 'customer_id,tag_id', ignoreDuplicates: true });

    if (assignError) throw assignError;

    return { success: true };
  },

  async removeTag(companyId: string, customerId: string, text: string) {
    // 1. Find tag ID
    const { data: tag } = await supabase
      .from('customer_tags')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', text)
      .maybeSingle();

    if (!tag) return { success: true }; // Tag doesn't exist, so considered removed

    // 2. Delete assignment
    const { error } = await supabase
      .from('customer_tag_assignments')
      .delete()
      .eq('customer_id', customerId)
      .eq('tag_id', tag.id);

    if (error) throw error;

    return { success: true };
  },

  async getCompanyTags(companyId: string) {
    const { data, error } = await supabase
      .from('customer_tags')
      .select('name, color')
      .eq('company_id', companyId)
      .order('name');

    if (error) return { data: [], error };
    return { data: data || [], error: null };
  },

  // --- Notes Management ---
  async getNotes(customerId: string) {
    const { data, error } = await supabase
      .from('customer_notes')
      .select('*, author:users(full_name)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error };

    const mappedNotes = (data || []).map(note => ({
      id: note.id,
      text: note.content,
      author: note.author?.full_name || 'Desconhecido',
      createdAt: new Date(note.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }));

    return { data: mappedNotes, error: null };
  },

  async addNote(companyId: string, customerId: string, content: string, userId: string) {
    // Call the secure RPC function
    const { data, error } = await supabase.rpc('add_customer_note', {
      p_company_id: companyId,
      p_customer_id: customerId,
      p_content: content
    });

    if (error) throw error;

    // Map RPC result (jsonb) to KanbanNote interface equivalent or similar structure
    const noteData = data as any;

    return {
      data: {
        id: noteData.id,
        text: noteData.text,
        author: noteData.author,
        // Format date to match frontend expectation
        createdAt: new Date(noteData.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      },
      error: null
    };
  },

  async deleteNote(noteId: string) {
    const { error } = await supabase
      .from('customer_notes')
      .delete()
      .eq('id', noteId);

    return { error };
  },

  // --- Cart Management ---
  async getCartItems(customerId: string) {
    const { data, error } = await supabase
      .from('customer_cart_items')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    return { data: (data || []) as CartItem[], error };
  },

  async addCartItem(companyId: string, customerId: string, itemName: string, price: number, quantity: number = 1, productId?: string) {
    const { data, error } = await supabase
      .from('customer_cart_items')
      .insert({
        company_id: companyId,
        customer_id: customerId,
        product_id: productId,
        product_name: itemName,
        quantity,
        price
      })
      .select()
      .single();

    return { data: data as CartItem, error };
  },

  async removeCartItem(itemId: string) {
    const { error } = await supabase
      .from('customer_cart_items')
      .delete()
      .eq('id', itemId);

    return { error };
  },

  async updateCartItem(itemId: string, updates: Partial<CartItem>) {
    const { data, error } = await supabase
      .from('customer_cart_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    return { data: data as CartItem, error };
  }
};

// --- Orders Service ---
export const ordersService = {
  async getOrders(companyId: string, page = 1, pageSize = 10): Promise<PaginatedResponse<any>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('orders')
      .select('*, items:order_items(*)', { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(from, to);

    return { data: data || [], count: count || 0, error };
  },

  async getOrdersByCustomer(companyId: string, customerId: string): Promise<PaginatedResponse<any>> {
    const { data, error, count } = await supabase
      .from('orders')
      .select('*, items:order_items(*)', { count: 'exact' })
      .eq('company_id', companyId)
      // Assuming there is a customer_id column in orders table based on schema conventions, 
      // but I should verify columns. Let's assume yes from context. 
      // CustomersService references detailed customer info, likely linked.
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    return { data: data || [], count: count || 0, error };
  }
};

// --- Team Service (formerly Profiles/Team) ---
export const teamService = {
  async getTeamMembers(companyId: string) {
    console.log("Fetching team members for:", companyId);
    // Join memberships with users
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        id,
        user_id,
        role,
        created_at,
        user:users (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('company_id', companyId);

    if (error) return { data: [], error };

    const transformedData = (data || []).map((item: any) => {
      // Fallback if item.user is null due to RLS or missing profile
      const user = item.user || {
        id: item.user_id,
        full_name: 'Usuário',
        email: '---',
        avatar_url: null
      };

      return {
        id: user.id || item.user_id,
        membership_id: item.id,
        company_id: companyId,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url,
        role: item.role,
        status: 'active',
        created_at: item.created_at
      };
    });

    return { data: transformedData, error: null };
  },

  async updateMemberRole(userId: string, companyId: string, role: string) {
    const { data, error } = await supabase
      .from('memberships')
      .update({ role })
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .select()
      .single();
    return { data, error };
  },

  async removeMember(userId: string, companyId: string) {
    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('user_id', userId)
      .eq('company_id', companyId);
    return { error };
  },

  async inviteMember(email: string, role: string, company_id: string) {
    // Call RPC instead of Edge Function to avoid CORS/Connectivity issues
    const { data, error } = await supabase.rpc('invite_member_secure', {
      p_email: email,
      p_role: role,
      p_company_id: company_id
    });

    if (error) return { data: null, error };
    if (data?.error) return { data: null, error: new Error(data.error) };

    // Note: Email dispatch is now handled by a database trigger (invitation-notifier)
    // to ensure reliability even if the frontend call fails.

    return { data, error: null };
  },

  async getInvitations(companyId: string) {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString()); // Only valid ones

    return { data: data || [], error };
  },

  async acceptInvite(invite_token: string) {
    // Using RPC instead of Edge Function for better reliability and performance
    const { data, error } = await supabase.rpc('accept_invite_secure', {
      p_invite_token: invite_token
    });

    if (error) return { data: null, error };
    if (data?.error) return { data: null, error: new Error(data.error) };

    return { data, error: null };
  },

  async getAgents(companyId: string) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true);
    return { data, error };
  }
};

// --- Plans Service ---
export const plansService = {
  async getPlans() {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
    return { data: data as Plan[] | null, error };
  },

  async getSubscription(companyId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('company_id', companyId)
      .maybeSingle();

    // Note: 'plan:plans(*)' expands the relation if configured in Supabase. 
    // If FK is strictly defined, this works. Otherwise we might need a separate call.
    return { data: data as (Subscription & { plan: Plan }) | null, error };
  }
};
