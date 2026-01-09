
import { NavSection, Order, Product, Customer, KanbanColumn } from './types';

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: 'CADASTROS',
    items: [
      { label: 'Pedidos', icon: 'ph-shopping-cart', path: '/', active: true },
      { label: 'Produtos', icon: 'ph-package', path: '/produtos' },
    ],
  },
  {
    title: 'AGENTES',
    items: [
      { label: 'Vendedor IA', icon: 'ph-robot', path: '/vendedor-ia' },
      { label: 'Funil de Vendas', icon: 'ph-funnel', path: '/funil-vendas' },
    ],
  },
  {
    title: 'CRM',
    items: [
      { label: 'Clientes', icon: 'ph-users', path: '/clientes' },
      { label: 'KanBan', icon: 'ph-kanban', path: '/kanban' },
    ],
  },
  {
    title: 'PLATAFORMA',
    items: [
      { label: 'Ajuda', icon: 'ph-sparkle', path: '/chat-ia' },
      { label: 'Configuração', icon: 'ph-gear', path: '/ajustes' },
    ],
  },
];

const MOCK_IMAGES = {
  watch: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop',
  sneaker: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop',
  bottle: 'https://images.unsplash.com/photo-1602143307185-83088f005297?q=80&w=400&auto=format&fit=crop',
  headphones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop',
  furniture: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=400&auto=format&fit=crop'
};

const DEFAULT_ADDRESS = {
  street: 'Rua das Flores',
  number: '101',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '10510-110'
};

export const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    code: '#DAS-41684',
    customerName: 'João Souza',
    customerPhone: '5511912341001',
    customerEmail: 'joao.souza@email.com',
    total: 4824.00,
    subtotal: 4824.00,
    shippingFee: 0,
    paymentMethod: 'Pix',
    paymentStatus: 'PAGO',
    receiptUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: '21/07/2025 11:02',
    status: 'NOVO',
    address: DEFAULT_ADDRESS,
    deliveryEstimate: '22/07/2025 • Entrega Expressa (Centro)',
    timePreference: 'Tarde',
    observations: 'Favor deixar na portaria do prédio B.',
    items: [
      {
        id: 'it1',
        name: 'Samsung Galaxy Watch Ultra Smartwatch 47mm Lte',
        price: 2599.00,
        quantity: 1,
        image: MOCK_IMAGES.watch
      },
      {
        id: 'it2',
        name: 'Tênis Running Performance Red',
        price: 425.00,
        quantity: 1,
        image: MOCK_IMAGES.sneaker
      },
      {
        id: 'it3',
        name: 'Garrafa Térmica Minimalist Black',
        price: 175.00,
        quantity: 1,
        image: MOCK_IMAGES.bottle
      },
      {
        id: 'it4',
        name: 'Headset Wireless Noise Cancelling',
        price: 1200.00,
        quantity: 1,
        image: MOCK_IMAGES.headphones
      },
      {
        id: 'it5',
        name: 'Acessório de Proteção Premium para Smartwatch',
        price: 425.00,
        quantity: 1,
        image: MOCK_IMAGES.watch
      }
    ]
  },
  {
    id: '2',
    code: '#DAS-02138',
    customerName: 'Alice Medeiros',
    customerPhone: '5511998765432',
    total: 850.00,
    subtotal: 850.00,
    shippingFee: 0,
    paymentMethod: 'Cartão de Crédito',
    paymentStatus: 'PENDENTE',
    createdAt: '15/10/2025 00:42',
    status: 'NOVO',
    address: DEFAULT_ADDRESS,
    deliveryEstimate: '16/10/2025 • Entrega Padrão',
    timePreference: 'Manhã',
    items: [
      {
        id: 'it2',
        name: 'Tênis Running Performance Red',
        price: 425.00,
        quantity: 2,
        image: MOCK_IMAGES.sneaker
      }
    ]
  },
  {
    id: '3',
    code: '#DAS-36489',
    customerName: 'Bruno Costa',
    customerPhone: '5521987654321',
    total: 350.00,
    subtotal: 350.00,
    shippingFee: 0,
    paymentMethod: 'Cartão de Crédito',
    paymentStatus: 'PAGO',
    receiptUrl: 'https://example.com/receipt.pdf',
    createdAt: '10/10/2025 22:27',
    status: 'NOVO',
    address: DEFAULT_ADDRESS,
    deliveryEstimate: '11/10/2025 • Entrega Expressa',
    timePreference: 'Qualquer horário',
    observations: 'O cliente solicitou embalagem para presente.',
    items: [
      {
        id: 'it3',
        name: 'Garrafa Térmica Minimalist Black',
        price: 175.00,
        quantity: 2,
        image: MOCK_IMAGES.bottle
      }
    ]
  },
  {
    id: '4',
    code: '#DAS-61574',
    customerName: 'Carla Souza',
    customerPhone: '5531976543210',
    total: 1200.00,
    subtotal: 1200.00,
    shippingFee: 0,
    paymentMethod: 'Dinheiro',
    paymentStatus: 'PENDENTE',
    createdAt: '10/10/2025 22:06',
    status: 'NOVO',
    address: DEFAULT_ADDRESS,
    items: [
      {
        id: 'it4',
        name: 'Headset Wireless Noise Cancelling',
        price: 1200.00,
        quantity: 1,
        image: MOCK_IMAGES.headphones
      }
    ]
  },
  {
    id: '5',
    code: '#DAS-50412',
    customerName: 'Diego Lima',
    customerPhone: '5541965432109',
    total: 85.00,
    subtotal: 75.00,
    shippingFee: 10.00,
    paymentMethod: 'Pix',
    paymentStatus: 'PAGO',
    receiptUrl: 'https://example.com/pix_receipt.jpg',
    createdAt: '10/10/2025 21:25',
    status: 'ENTREGUE',
    address: DEFAULT_ADDRESS,
    items: [
      {
        id: 'it3',
        name: 'Garrafa Térmica Minimalist Black',
        price: 75.00,
        quantity: 1,
        image: MOCK_IMAGES.bottle
      }
    ]
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'APARADOR MESA 90 CM X 45 CM SKAND',
    category: 'Escrivaninhas',
    price: 1199.00,
    availability: 'ATIVO',
    image: MOCK_IMAGES.furniture,
    shortDescription: 'Assinada pela equipe T S Design, o aparador/mesa Skand é peça-chave na decoração e pode ser uma ótima escolha para compor diversos espaços, sejam eles residenciais ou institucionais.',
    longDescription: 'Aparador/mesa em madeira maciça (Cajueiro Japonês) torneada e tingida com aplicação de verniz poliuretano.\n\nCarga máxima suportável: 40kg; distribuídos uniformemente. Pode haver variação de tonalidades e veios.\n\nAltura 77.00CM\nLargura 90.00CM\nProfundidade 45.00CM\nPeso 15.29KG',
    lastModified: '14/10/2025 às 23:21'
  },
  {
    id: 'p1v1',
    parentId: 'p1',
    name: 'APARADOR MESA SKAND - MADEIRA NATURAL',
    category: 'Escrivaninhas',
    price: 1199.00,
    availability: 'ATIVO',
    image: MOCK_IMAGES.furniture,
    variantAttributes: [{ name: 'Acabamento', value: 'Natural' }]
  },
  {
    id: 'p1v2',
    parentId: 'p1',
    name: 'APARADOR MESA SKAND - MADEIRA ESCURA',
    category: 'Escrivaninhas',
    price: 1299.00,
    availability: 'ATIVO',
    image: MOCK_IMAGES.furniture,
    variantAttributes: [{ name: 'Acabamento', value: 'Tabaco' }]
  },
  {
    id: 'p2',
    name: 'CADEIRA COM PALHINHA ARES',
    category: 'Cadeiras',
    price: 1149.00,
    availability: 'ATIVO',
    image: MOCK_IMAGES.furniture,
    shortDescription: 'Cadeira elegante com encosto em palhinha natural e estrutura em madeira maciça.',
    longDescription: 'Design atemporal que une o clássico da palhinha com o conforto ergonômico moderno.',
    lastModified: '12/10/2025 às 10:15'
  },
  {
    id: 'p3',
    name: 'CADEIRA EASY WOOD',
    category: 'Cadeiras',
    price: 179.90,
    availability: 'ATIVO',
    image: MOCK_IMAGES.furniture,
    shortDescription: 'Minimalismo e praticidade para seu ambiente de trabalho ou jantar.',
    longDescription: 'Feita em polipropileno de alta resistência com pés em madeira tratada.',
    lastModified: '11/10/2025 às 15:30'
  },
  {
    id: 'p4',
    name: 'CADEIRA GIRATÓRIA DANDY',
    category: 'Cadeiras',
    price: 1049.00,
    availability: 'ATIVO',
    image: MOCK_IMAGES.furniture,
    shortDescription: 'Cadeira de escritório ergonômica com design sofisticado e ajustes de altura.',
    longDescription: 'Estofada em tecido premium com base giratória em aço carbono.',
    lastModified: '10/10/2025 às 09:45'
  },
  {
    id: 'p5',
    name: 'CADEIRA GIRATÓRIA KLOE',
    category: 'Cadeiras',
    price: 1649.00,
    availability: 'ATIVO',
    image: MOCK_IMAGES.furniture,
    shortDescription: 'A união perfeita entre luxo e ergonomia para quem passa horas no escritório.',
    longDescription: 'Mecanismo sincronizado e encosto em tela mesh de alta performance.',
    lastModified: '09/10/2025 às 11:20'
  },
  {
    id: 'p6',
    name: 'CADEIRA PROSA',
    category: 'Cadeiras',
    price: 449.90,
    availability: 'ATIVO',
    image: MOCK_IMAGES.furniture,
    shortDescription: 'Ideal para ambientes externos e varandas gourmet.',
    longDescription: 'Resistente a intempéries com acabamento em pintura eletrostática.',
    lastModified: '14/10/2025 às 14:10'
  },
  {
    id: 'p7',
    name: 'CÔMODA 4 GAVETAS 87 CM X 43 CM TIMBER',
    category: 'Cômodas',
    price: 1149.00,
    availability: 'ATIVO',
    image: MOCK_IMAGES.furniture,
    shortDescription: 'Espaço e estilo rústico para organizar seu quarto com elegância.',
    longDescription: 'Gavetas com corrediças telescópicas e puxadores em metal envelhecido.',
    lastModified: '07/10/2025 às 16:55'
  },
  {
    id: 'p8',
    name: 'CÔMODA 4 GAVETAS 90 CM X 40 CM LIN',
    category: 'Cômodas',
    price: 919.90,
    availability: 'ATIVO',
    image: MOCK_IMAGES.furniture,
    shortDescription: 'Linhas retas e design escandinavo para ambientes modernos.',
    longDescription: 'Pés palito em madeira e estrutura em MDF de alta densidade.',
    lastModified: '06/10/2025 às 13:40'
  },
  {
    id: 'p9',
    name: 'CRISTALEIRA STREET',
    category: 'Estantes e Cristaleiras',
    price: 2849.00,
    availability: 'ATIVO',
    image: MOCK_IMAGES.furniture,
    shortDescription: 'Estilo industrial com portas em vidro tempoerado e iluminação LED interna.',
    longDescription: 'Estrutura robusta em metal e madeira maciça de reflorestamento.',
    lastModified: '05/10/2025 às 10:00'
  },
  {
    id: 'p10',
    name: 'CRISTALEIRA TIMBER',
    category: 'Estantes e Cristaleiras',
    price: 2449.00,
    availability: 'ATIVO',
    image: MOCK_IMAGES.furniture,
    shortDescription: 'Exiba suas louças e coleções com o charme da madeira natural.',
    longDescription: 'Quatro prateleiras reguláveis e fechadura clássica.',
    lastModified: '04/10/2025 às 18:30'
  },
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Ramon Silva',
    phone: '5511988554422',
    email: 'ramon.silva@qrivo.ia',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop',
    createdAt: '14/10/2025 23:21',
    totalOrders: 12,
    totalSpent: 4250.80
  },
  {
    id: 'c2',
    name: 'Alice Medeiros',
    phone: '5511998765432',
    email: 'alice.medeiros@email.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    createdAt: '15/10/2025 00:42',
    totalOrders: 5,
    totalSpent: 850.00
  },
  {
    id: 'c3',
    name: 'João Souza',
    phone: '5511912341001',
    email: 'joao.souza@email.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    createdAt: '21/07/2025 11:02',
    totalOrders: 24,
    totalSpent: 12840.50
  },
  {
    id: 'c4',
    name: 'Beatriz Oliveira',
    phone: '5521987651234',
    email: 'beatriz.oli@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop',
    createdAt: '10/10/2025 14:15',
    totalOrders: 2,
    totalSpent: 299.90
  },
  {
    id: 'c5',
    name: 'Carlos Alberto',
    phone: '5531988887777',
    email: 'carlos.alberto@outlook.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
    createdAt: '08/09/2025 09:30',
    totalOrders: 8,
    totalSpent: 1540.00
  }
];

export const MOCK_KANBAN_DATA: KanbanColumn[] = [
  {
    id: 'k1',
    title: 'Boas-vindas e Qualificação',
    cards: [
      {
        id: 'kc1',
        customerId: 'c1',
        customerName: 'Ramon Silva',
        customerPhone: '5511988554422',
        customerAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop',
        lastInteraction: 'Há 5 minutos',
        value: 4250.80,
        totalOrders: 12,
        tags: [{ text: 'Lead Quente', color: 'bg-system-error-500' }],
        agentName: 'Vendedor IA'
      },
      {
        id: 'kc2',
        customerId: 'c4',
        customerName: 'Beatriz Oliveira',
        customerPhone: '5521987651234',
        customerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop',
        lastInteraction: 'Há 2 horas',
        value: 299.90,
        totalOrders: 2,
        tags: [{ text: 'Lead Morno', color: 'bg-system-warning-500' }],
        agentName: 'Funil de Vendas'
      }
    ]
  },
  {
    id: 'k2',
    title: 'Apresentação de Benefícios',
    cards: [
      {
        id: 'kc3',
        customerId: 'c2',
        customerName: 'Alice Medeiros',
        customerPhone: '5511998765432',
        customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
        lastInteraction: 'Há 1 dia',
        value: 850.00,
        totalOrders: 5,
        tags: [{ text: 'Lead Quente', color: 'bg-system-error-500' }],
        agentName: 'Vendedor IA'
      }
    ]
  },
  {
    id: 'k3',
    title: 'Fechamento de Venda',
    cards: [
      {
        id: 'kc4',
        customerId: 'c3',
        customerName: 'João Souza',
        customerPhone: '5511912341001',
        customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        lastInteraction: 'Há 10 minutos',
        value: 12840.50,
        totalOrders: 24,
        tags: [{ text: 'Lead Quente', color: 'bg-system-error-500' }],
        agentName: 'Funil de Vendas'
      },
      {
        id: 'kc5',
        customerId: 'c5',
        customerName: 'Carlos Alberto',
        customerPhone: '5531988887777',
        customerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
        lastInteraction: 'Há 4 horas',
        value: 1540.00,
        totalOrders: 8,
        tags: [{ text: 'Lead Frio', color: 'bg-system-info-500' }],
        agentName: 'Vendedor IA'
      }
    ]
  }
];
