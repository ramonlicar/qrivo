
export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  quantity: number;
  name_snapshot: string;
  price_snapshot: number;
  image_snapshot?: string;
  category_snapshot?: string;
}

export interface Order {
  id: string;
  company_id: string;
  agent_id: string;
  conversation_id: string;
  code: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_id?: string;
  responsible_id?: string;
  total: number;
  subtotal: number;
  shipping_fee: number;
  payment_status: 'PAGO' | 'PENDENTE' | 'CANCELADO' | 'REEMBOLSADO' | 'paid' | 'pending' | 'refunded' | 'canceled';
  order_status: 'NOVO' | 'PREPARANDO' | 'ENVIADO' | 'ENTREGUE' | 'CANCELADO' | 'ARQUIVADO' | 'new' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'archived';
  created_at: string;
  updated_at?: string;
  shipping_address?: string;
  delivery_estimate?: string;
  time_preference?: string;
  observations?: string;
  receipt_url?: string;
  payment_method?: string;
  order_summary?: string;
  delivery_area_id?: string;
  delivery_area?: { name: string };
  items?: OrderItem[];
}

export interface DeliveryArea {
  id: string;
  company_id: string;
  name: string;
  fee: number;
  estimated_time?: string;
  covered_regions?: string;
  is_active: boolean;
  created_at: string;
}

export interface OrderActivity {
  id: string;
  order_id: string;
  company_id: string;
  action_type: string;
  description: string;
  created_at: string;
  created_by?: string;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  price: number;
  availability: 'ATIVO' | 'INATIVO';
  image: string;
  shortDescription?: string;
  longDescription?: string;
  lastModified?: string;
  parentId?: string; // ID do produto pai, se for uma variação
  variantAttributes?: ProductAttribute[]; // Atributos que definem esta variação
  variantCount?: number;
  ref?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  isAiEnabled?: boolean;
  tags?: KanbanTag[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  job_title?: string;
  created_at: string;
  last_active_at?: string;
  whatsapp?: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  business_area?: string;
  business_description?: string;
  avatar_url?: string;
  owner_user_id: string;
  created_at: string;
}

export interface UserCompanyMembership {
  id: string;
  user_id: string;
  company_id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'revoked';
  created_at: string;
}

export interface TeamInvitation {
  id: string;
  company_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'accepted' | 'expired';
  invited_by: string;
  token: string;
  accepted_at?: string;
  expires_at: string;
  created_at: string;
}

export interface TeamMember {
  id: string; // This is the user_id
  membership_id: string;
  company_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'revoked';
  created_at: string;
}

export interface KanbanNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface KanbanTag {
  text: string;
  color: string; // Ex: 'bg-primary-500'
}

export interface KanbanFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
}

export interface KanbanCard {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAvatar: string;
  lastInteraction: string;
  value: number;
  totalOrders: number;
  tags?: KanbanTag[];
  agent_id?: string;
  agentName?: string;
  isAiEnabled?: boolean;
  notes?: KanbanNote[];
  files?: KanbanFile[];
  createdAt?: string;
  overdueTasksCount?: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface Stats {
  totalOrders: number;
  newOrders: number;
  paidOrders: number;
  averageTicket: number;
  totalRevenue: number;
}

export type NavItem = {
  label: string;
  icon: string;
  path: string;
  active?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export interface CartItem {
  id: string;
  company_id: string;
  customer_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  price: number;
  created_at: string;
}
