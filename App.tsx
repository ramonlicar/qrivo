
import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { GuideTourModal } from './components/GuideTourModal';
import { Order, Product } from './types';
import { supabase } from './lib/supabase';
import { userService, companiesService, plansService, ordersService } from './lib/services';
import { getUserCompanyId } from './lib/supabase';

// Lazy loaded components para melhor performance de carregamento inicial
const Home = lazy(() => import('./components/Home').then(m => ({ default: m.Home })));
const OrderDetails = lazy(() => import('./components/OrderDetails').then(m => ({ default: m.OrderDetails })));
const SupportPage = lazy(() => import('./components/SupportPage').then(m => ({ default: m.SupportPage })));
const Products = lazy(() => import('./components/Products').then(m => ({ default: m.Products })));
const ProductFormPage = lazy(() => import('./components/ProductFormPage').then(m => ({ default: m.ProductFormPage })));
const ProductDetails = lazy(() => import('./components/ProductDetails').then(m => ({ default: m.ProductDetails })));
const AccountSettings = lazy(() => import('./components/AccountSettings').then(m => ({ default: m.AccountSettings })));
const VendedorIA = lazy(() => import('./components/VendedorIA').then(m => ({ default: m.VendedorIA })));
const FunilVendas = lazy(() => import('./components/FunilVendas').then(m => ({ default: m.FunilVendas })));
const Customers = lazy(() => import('./components/Customers').then(m => ({ default: m.Customers })));
const Kanban = lazy(() => import('./components/Kanban').then(m => ({ default: m.Kanban })));
const UnderConstruction = lazy(() => import('./components/UnderConstruction').then(m => ({ default: m.UnderConstruction })));
const AuthPage = lazy(() => import('./components/AuthPage').then(m => ({ default: m.AuthPage })));
const OnboardingPage = lazy(() => import('./components/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const AcceptInvitePage = lazy(() => import('./components/AcceptInvitePage').then(m => ({ default: m.AcceptInvitePage })));
const ResetPasswordPage = lazy(() => import('./components/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const DesignSystemPage = lazy(() => import('./components/DesignSystemPage').then(m => ({ default: m.default })));
const OrderTracking = lazy(() => import('./components/OrderTracking'));
const NewOrder = lazy(() => import('./components/NewOrder').then(m => ({ default: m.NewOrder })));

const LoadingState = () => (
  <div className="min-h-screen w-full bg-neutral-25 flex flex-col items-center justify-center p-6 gap-4">
    <i className="ph ph-circle-notch animate-spin text-4xl text-primary-500"></i>
    <span className="text-tag font-bold text-neutral-400 uppercase tracking-widest">Carregando seção...</span>
  </div>
);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(false);
  const [forceShowAuth, setForceShowAuth] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1200);
  const [userProfile, setUserProfile] = useState({ name: '', avatar_url: '' });
  const [userStats, setUserStats] = useState({ plan: '...', used: 0, total: 0 });
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  // Debug: Log quando o componente é montado
  useEffect(() => {
    console.log('App component mounted');
    // Check URL for invite token
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite_token');
    if (token) {
      setInviteToken(token);
      // Clear URL to prevent re-processing on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Responsive Sidebar Logic
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setIsSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedProductForView, setSelectedProductForView] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [settingsInitialTab, setSettingsInitialTab] = useState<any>(undefined);

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Inicialização: Verifica Sessão
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Erro ao buscar sessão:", error);
          if (mounted) setIsLoadingAuth(false);
          return;
        }

        if (mounted) {
          setSession(session);
          if (session?.user) {
            setIsOnboardingComplete(true);
          }
        }
      } catch (err) {
        console.error("Erro na inicialização:", err);
      } finally {
        if (mounted) setIsLoadingAuth(false);
      }
    };

    initializeAuth();

    // Listeners do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (mounted) {
        setSession(session);
        if (event === 'PASSWORD_RECOVERY') {
          setIsResetPasswordMode(true);
        }
      }
    });

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Carregar dados do usuário e plano
  useEffect(() => {
    const loadUserData = async () => {
      if (!session?.user?.id) return;

      try {
        const { data: profile } = await userService.getMyProfile(session.user.id);
        if (profile) {
          setUserProfile({
            name: profile.full_name || session.user.user_metadata?.full_name || 'Usuário',
            avatar_url: profile.avatar_url || session.user.user_metadata?.avatar_url || ''
          });
        }

        const { data: company, error: companyError } = await companiesService.getMyCompany(session.user.id);
        if (company) {
          const { data: subscription } = await plansService.getSubscription(company.id);
          if (subscription && subscription.plan) {
            setUserStats(prev => ({ ...prev, plan: subscription.plan.name }));
          } else {
            setUserStats(prev => ({ ...prev, plan: 'Trial' }));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do sidebar:', error);
      }
    };

    loadUserData();
  }, [session]);

  // Carregar e monitorar contagem de novos pedidos
  useEffect(() => {
    let channel: any = null;

    const setupOrderCount = async () => {
      if (!session?.user?.id) return;

      try {
        const companyId = await getUserCompanyId();
        if (!companyId) {
          console.warn('[App] Company ID not found for badges');
          return;
        }

        console.log('[App] Setting up order count for company:', companyId);

        // Fetch inicial
        const { count, error: fetchError } = await ordersService.getNewOrdersCount(companyId);
        if (fetchError) {
          console.error('[App] Error fetching new orders count:', fetchError);
        } else {
          console.log('[App] New orders count fetched:', count);
          setNewOrdersCount(count || 0);
        }

        // Inscrição em tempo real
        channel = supabase
          .channel(`sidebar-orders-count-${companyId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `company_id=eq.${companyId}`,
            },
            async (payload) => {
              console.log('[App] Realtime event received:', payload);

              // Tocar som se for um novo pedido (INSERT)
              if (payload.eventType === 'INSERT') {
                console.log('[App] Valid INSERT event detected. Attempting to play sound...');
                try {
                  const audio = new Audio('/sounds/notification.wav');
                  audio.volume = 1.0;
                  console.log('[App] Audio object created:', audio);

                  const playPromise = audio.play();
                  if (playPromise !== undefined) {
                    playPromise
                      .then(() => console.log('[App] Sound played successfully.'))
                      .catch((error) => console.error('[App] Error playing sound (Autoplay blocked?):', error));
                  }
                } catch (e) {
                  console.error('[App] Critical error initializing audio:', e);
                }
              } else {
                console.log('[App] Event type is not INSERT:', payload.eventType);
              }

              const { count: updatedCount } = await ordersService.getNewOrdersCount(companyId);
              setNewOrdersCount(updatedCount || 0);
            }
          )
          .subscribe((status) => {
            console.log('[App] Sidebar real-time status:', status);
          });
      } catch (err) {
        console.error('Erro ao gerenciar contagem de pedidos:', err);
      }
    };

    setupOrderCount();

    // Debug helper
    (window as any).testSound = () => {
      console.log('[App] Manual sound test triggered');
      const audio = new Audio('/sounds/notification.wav');
      audio.play().catch(e => console.error('[App] Manual test error:', e));
    };

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      delete (window as any).testSound;
    };
  }, [session]);

  const refreshProfile = async () => {
    if (!session?.user?.id) return;
    try {
      const { data: profile } = await userService.getMyProfile(session.user.id);
      if (profile) {
        setUserProfile({
          name: profile.full_name || session.user.user_metadata?.full_name || 'Usuário',
          avatar_url: profile.avatar_url || session.user.user_metadata?.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Erro ao recarregar perfil:', error);
    }
  };

  const handleCloseTour = () => {
    setIsTourOpen(false);
    localStorage.setItem('qrivo_tour_seen', 'true');
  };

  const handleLoginSuccess = async (isNewUser: boolean, authData: any) => {
    setSession(authData.session || authData);
    if (isNewUser) {
      setIsOnboardingComplete(false);
      navigate('/onboarding');
    } else {
      setIsOnboardingComplete(true);
      navigate('/');
    }
  };

  const handleOnboardingComplete = () => {
    setIsOnboardingComplete(true);
    setIsTourOpen(true);
    navigate('/');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsOnboardingComplete(false);
    navigate('/');
    setSelectedOrder(null);
  };

  const effectiveActivePath = useMemo(() => {
    if (selectedOrder) return '/';
    if (location.pathname.startsWith('/produtos')) return '/produtos';
    if (location.pathname.startsWith('/pedidos')) return '/';
    return location.pathname;
  }, [location.pathname, selectedOrder]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen w-full bg-neutral-25 flex flex-col items-center justify-center p-6 gap-4">
        <i className="ph ph-circle-notch animate-spin text-4xl text-primary-500"></i>
        <span className="text-tag font-bold text-neutral-400 uppercase tracking-widest">Sincronizando painel...</span>
      </div>
    );
  }

  if (isResetPasswordMode) {
    return (
      <Suspense fallback={<LoadingState />}>
        <ResetPasswordPage onSuccess={() => setIsResetPasswordMode(false)} />
      </Suspense>
    );
  }

  if (inviteToken && (!forceShowAuth || session)) {
    return (
      <Suspense fallback={<LoadingState />}>
        <AcceptInvitePage
          token={inviteToken}
          currentUser={session?.user}
          onSuccess={() => {
            setInviteToken(null);
            setForceShowAuth(false);
            navigate('/');
          }}
          onLoginRedirect={() => setForceShowAuth(true)}
        />
      </Suspense>
    );
  }

  if (location.pathname === '/rastreio' || location.pathname.startsWith('/rastreio/')) {
    return (
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route path="/rastreio" element={<OrderTracking />} />
          <Route path="/rastreio/:code" element={<OrderTracking />} />
        </Routes>
      </Suspense>
    );
  }

  if (!session) {
    return (
      <Suspense fallback={<LoadingState />}>
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    );
  }

  if (!isOnboardingComplete && session?.user) {
    return (
      <Suspense fallback={<LoadingState />}>
        <OnboardingPage onComplete={handleOnboardingComplete} userId={session.user.id} />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-row min-h-screen w-full bg-neutral-100 font-sans overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activePath={effectiveActivePath}
        onNavigate={(path) => {
          if (path === '/planos') {
            setSettingsInitialTab('planos');
            navigate('/ajustes');
          } else {
            setSettingsInitialTab(undefined);
            navigate(path);
          }
        }}
        userProfile={userProfile}
        userStats={userStats}
        badges={{ 'Pedidos': newOrdersCount }}
      />
      <main className="flex flex-col flex-1 h-screen overflow-hidden items-center relative">
        <div className="flex flex-col w-full h-full py-[6px] pr-[6px] pl-0 sm:py-[12px] sm:pr-[12px] lg:py-[16px] lg:pr-[16px] gap-[8px] overflow-hidden">
          <div className="w-full h-full bg-white border border-neutral-200 shadow-cards rounded-[12px] sm:rounded-[16px] overflow-hidden">
            <Suspense fallback={<LoadingState />}>
              <Routes>
                <Route path="/" element={<Home
                  onOrderSelect={(order) => navigate(`/pedidos/${order.id}`)}
                  onOpenSidebar={() => setIsSidebarOpen(true)}
                  onNewOrder={() => { setEditingOrder(null); navigate('/pedidos/novo'); }}
                  onEditOrder={(order) => { navigate(`/pedidos/editar/${order.id}`); }}
                />} />
                <Route path="/pedidos/novo" element={<NewOrder onBack={() => navigate('/')} />} />
                <Route path="/pedidos/editar/:id" element={<NewOrder onBack={() => navigate(-1)} />} />
                <Route path="/pedidos/:id" element={<OrderDetails onBack={() => navigate('/')} />} />
                <Route path="/vendedor-ia" element={<VendedorIA />} />
                <Route path="/funil-vendas" element={<FunilVendas />} />
                <Route path="/clientes" element={<Customers />} />
                <Route path="/kanban" element={<Kanban />} />
                <Route path="/ajustes" element={<AccountSettings initialTab={settingsInitialTab} onLogout={handleLogout} onProfileUpdate={refreshProfile} userSession={session} />} />
                <Route path="/chat-ia" element={<SupportPage />} />
                <Route path="/suporte" element={<SupportPage />} />

                <Route path="/produtos" element={
                  <Products
                    onViewDetails={(p) => { setSelectedProductForView(p); navigate('/produtos/detalhes'); }}
                    onEdit={(p) => navigate(`/produtos/editar/${p.id}`)}
                    onAddNew={() => navigate('/produtos/novo')}
                  />
                } />

                <Route path="/produtos/detalhes" element={
                  selectedProductForView ? (
                    <ProductDetails product={selectedProductForView} onBack={() => { setSelectedProductForView(null); navigate('/produtos'); }} onEdit={(p) => navigate(`/produtos/editar/${p.id}`)} onDelete={() => navigate('/produtos')} />
                  ) : <Navigate to="/produtos" />
                } />

                <Route path="/produtos/novo" element={<ProductFormPage product={null} onBack={() => navigate('/produtos')} onSave={(p) => { setSelectedProductForView(p as Product); navigate('/produtos/detalhes'); }} />} />
                <Route path="/produtos/editar/:id" element={<ProductFormPage product={editingProduct} onBack={() => navigate(selectedProductForView ? '/produtos/detalhes' : '/produtos')} onSave={(p) => { setSelectedProductForView(p as Product); navigate('/produtos/detalhes'); }} />} />

                <Route path="/design-system" element={<DesignSystemPage />} />

                <Route path="*" element={<UnderConstruction title="Página em Construção" onBackToHome={() => navigate('/')} />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </main>
      <GuideTourModal isOpen={isTourOpen} onClose={handleCloseTour} />
    </div>
  );
};

export default App;
