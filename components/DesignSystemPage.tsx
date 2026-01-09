import React, { useState } from 'react';
import { theme } from '../theme';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { Checkbox } from './Checkbox';
import { Select } from './Select';
import { Radio } from './Radio';
import { Calendar } from './Calendar';
import { Slider } from './Slider';
import { Collapse } from './Collapse';
import { Combobox } from './Combobox';
import { EmptyState } from './EmptyState';
import { Note } from './Note';
import { ProjectBanner } from './ProjectBanner';
import { Skeleton } from './Skeleton';
import { Table } from './Table';
import { Badge } from './Badge';

const DesignSystemPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState('colors');
    const [checkboxStatus, setCheckboxStatus] = useState(true);
    const [radioValue, setRadioValue] = useState('option1');
    const [selectValue, setSelectValue] = useState('val1');
    const [comboboxValue, setComboboxValue] = useState('');
    const [sliderValue, setSliderValue] = useState(50);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const sections = [
        { id: 'colors', label: 'Cores', icon: 'ph-palette' },
        { id: 'typography', label: 'Tipografia', icon: 'ph-text-aa' },
        { id: 'components', label: 'Componentes', icon: 'ph-cube' },
        { id: 'icons', label: 'Ícones', icon: 'ph-phosphor-logo' },
    ];

    const mockTableData = [
        { id: '1', name: 'João Silva', email: 'joao@qrivo.com', status: 'Ativo', plan: 'Enterprise' },
        { id: '2', name: 'Maria Santos', email: 'maria@qrivo.com', status: 'Pendente', plan: 'Business' },
        { id: '3', name: 'Pedro Costa', email: 'pedro@qrivo.com', status: 'Inativo', plan: 'Pro' },
    ];

    const ColorCard = ({ name, hex, label }: { name: string, hex: string, label: string }) => (
        <div className="flex flex-col gap-2 group">
            <div
                className="h-20 w-full rounded-xl border border-neutral-100 shadow-sm transition-transform group-hover:scale-[1.02]"
                style={{ backgroundColor: hex }}
            />
            <div className="flex flex-col">
                <span className="text-body2 font-bold text-neutral-900">{label}</span>
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">{hex}</span>
                <span className="text-[10px] text-neutral-300 font-medium">theme.colors.{name}</span>
            </div>
        </div>
    );

    return (
        <div className="flex h-full bg-white font-sans text-neutral-900 overflow-hidden">
            {/* Sidebar de Documentação */}
            <aside className="w-64 border-r border-neutral-100 flex flex-col gap-8 flex-shrink-0 h-full p-8 overflow-y-auto no-scrollbar">
                <div className="flex items-center gap-3">
                    <img src="https://0e65cb6695ddeca8cb391ef6f8f9b815.cdn.bubble.io/f1766623374427x261268037475739240/Qrivo%20S%C3%ADmbolo.svg" alt="Logo" className="w-8 h-8" />
                    <h1 className="text-h5 font-black tracking-tight">Design System</h1>
                </div>

                <nav className="flex flex-col gap-1">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-body2 font-bold transition-all ${activeSection === s.id
                                ? 'bg-neutral-50 text-primary-600 shadow-sm'
                                : 'text-neutral-500 hover:bg-neutral-25 hover:text-neutral-900'
                                }`}
                        >
                            <i className={`ph ${s.icon} text-lg`}></i>
                            {s.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-8 border-t border-neutral-50 flex flex-col gap-2">
                    <span className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">Versão 1.2.0</span>
                    <Button variant="ghost" className="!h-8 !px-0 justify-start" onClick={() => window.history.back()}>
                        <i className="ph ph-arrow-left mr-2"></i>
                        Voltar ao App
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-full overflow-y-auto p-16 scroll-smooth">
                <div className="max-w-5xl">
                    {activeSection === 'colors' && (
                        <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <header className="flex flex-col gap-4">
                                <h2 className="text-h2 font-black tracking-tight">Cores</h2>
                                <p className="text-body1 text-neutral-500 max-w-2xl leading-relaxed">
                                    Nossa paleta de cores é fundamentada no verde esmeralda para ações primárias e uma escala de cinzas neutros para estrutura e contraste.
                                </p>
                            </header>

                            <section className="flex flex-col gap-6">
                                <h3 className="text-body2 font-black text-neutral-300 uppercase tracking-widest">Primary Palette</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
                                    <ColorCard label="Primary 500" hex={theme.colors.primary[500]} name="primary.500" />
                                    <ColorCard label="Primary 600" hex={theme.colors.primary[600]} name="primary.600" />
                                    <ColorCard label="Primary 700" hex={theme.colors.primary[700]} name="primary.700" />
                                    <ColorCard label="Primary 100" hex={theme.colors.primary[100]} name="primary.100" />
                                </div>
                            </section>

                            <section className="flex flex-col gap-6">
                                <h3 className="text-body2 font-black text-neutral-300 uppercase tracking-widest">Neutral Scale</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
                                    <ColorCard label="Black" hex={theme.colors.neutral.black} name="neutral.black" />
                                    <ColorCard label="Neutral 900" hex={theme.colors.neutral[900]} name="neutral.900" />
                                    <ColorCard label="Neutral 700" hex={theme.colors.neutral[700]} name="neutral.700" />
                                    <ColorCard label="Neutral 500" hex={theme.colors.neutral[500]} name="neutral.500" />
                                    <ColorCard label="Neutral 300" hex={theme.colors.neutral[300]} name="neutral.300" />
                                    <ColorCard label="Neutral 100" hex={theme.colors.neutral[100]} name="neutral.100" />
                                </div>
                            </section>

                            <section className="flex flex-col gap-6">
                                <h3 className="text-body2 font-black text-neutral-300 uppercase tracking-widest">System Colors</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
                                    <ColorCard label="Success" hex={theme.colors.system.success[500]} name="system.success.500" />
                                    <ColorCard label="Error" hex={theme.colors.system.error[500]} name="system.error.500" />
                                    <ColorCard label="Warning" hex={theme.colors.system.warning[500]} name="system.warning.500" />
                                    <ColorCard label="Info" hex={theme.colors.system.info[500]} name="system.info.500" />
                                </div>
                            </section>
                        </div>
                    )}

                    {activeSection === 'typography' && (
                        <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <header className="flex flex-col gap-4">
                                <h2 className="text-h2 font-black tracking-tight">Tipografia</h2>
                                <p className="text-body1 text-neutral-500">
                                    Utilizamos a família **Inter** para toda a interface, garantindo legibilidade e uma estética moderna.
                                </p>
                            </header>

                            <section className="flex flex-col gap-8 divide-y divide-neutral-50">
                                {[
                                    { style: 'Display', font: '64px', weight: '700', token: 'desktop-display', example: 'Elevate your sales' },
                                    { style: 'Heading 1', font: '40px', weight: '700', token: 'desktop-h1---bold', example: 'Transformando Operações' },
                                    { style: 'Heading 2', font: '32px', weight: '700', token: 'desktop-h2---bold', example: 'Design System Qrivo' },
                                    { style: 'Heading 3', font: '24px', weight: '700', token: 'desktop-h3---bold', example: 'Interface de Dashboards' },
                                    { style: 'Body 1 Medium', font: '15px', weight: '500', token: 'desktop-body-1---medium', example: 'O Qrivo automatiza seu processo de vendas utilizando inteligência artificial.' },
                                    { style: 'Body 2 Semibold', font: '13px', weight: '700', token: 'desktop-body-2---semibold', example: 'Acesse seu centro de operações de vendas IA.' },
                                    { style: 'Small Text 3', font: '12px', weight: '700', token: 'desktop-small-texts-3---semibold', example: 'Informações detalhadas do sistema' },
                                    { style: 'Tags', font: '11px', weight: '500', token: 'desktop-tags', example: 'Sincronizando painel...' },
                                ].map((t, i) => (
                                    <div key={i} className="py-8 flex items-baseline gap-12 group hover:bg-neutral-25/50 transition-colors px-4 -mx-4 rounded-xl">
                                        <div className="w-48 flex-shrink-0 flex flex-col">
                                            <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">{t.style}</span>
                                            <span className="text-body2 font-mono text-neutral-400">{t.font} / {t.weight}</span>
                                            <span className="text-[10px] text-neutral-300 font-medium">theme.typography.{t.token}</span>
                                        </div>
                                        <div className="flex-1" style={{ fontSize: t.font, fontWeight: t.weight }}>
                                            {t.example}
                                        </div>
                                    </div>
                                ))}
                            </section>
                        </div>
                    )}

                    {activeSection === 'components' && (
                        <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <header className="flex flex-col gap-4">
                                <h2 className="text-h2 font-black tracking-tight">Componentes</h2>
                                <p className="text-body1 text-neutral-500 leading-relaxed">
                                    Padrões de interface prontos para uso, seguindo as diretrizes de acessibilidade e interatividade do padrão Geist.
                                </p>
                            </header>

                            <section className="flex flex-col gap-6">
                                <h3 className="text-body2 font-black text-neutral-300 uppercase tracking-widest">Common Bases</h3>
                                <div className="p-10 bg-neutral-25 rounded-3xl border border-neutral-100 flex flex-col gap-10">
                                    <div className="flex flex-wrap gap-4 items-center">
                                        <Button variant="primary">Primary Action</Button>
                                        <Button variant="secondary">Secondary</Button>
                                        <Button variant="tertiary">Tertiary</Button>
                                        <Button variant="ghost">Ghost Button</Button>
                                        <Button variant="danger">Danger Action</Button>
                                        <Button variant="danger-light">Danger Light</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-4 items-center">
                                        <Badge variant="primary">New Feature</Badge>
                                        <Badge variant="success" isPill>Verified</Badge>
                                        <Badge variant="warning">Attention</Badge>
                                        <Badge variant="error" size="sm">Urgent</Badge>
                                        <Badge variant="neutral">Beta</Badge>
                                    </div>
                                </div>
                            </section>

                            <section className="flex flex-col gap-6">
                                <h3 className="text-body2 font-black text-neutral-300 uppercase tracking-widest">Advanced Inputs</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-10 bg-neutral-25 rounded-3xl border border-neutral-100">
                                    <div className="flex flex-col gap-6">
                                        <TextInput label="Corporate Email" placeholder="user@company.com" leftIcon="ph-envelope" />
                                        <Combobox
                                            label="Quick Search"
                                            placeholder="Find something..."
                                            value={comboboxValue}
                                            onChange={setComboboxValue}
                                            options={[
                                                { value: 'opt1', label: 'Dashboard Overview' },
                                                { value: 'opt2', label: 'Sales Pipeline' },
                                                { value: 'opt3', label: 'Customer List' },
                                                { value: 'opt4', label: 'System Settings' },
                                            ]}
                                        />
                                        <div className="flex flex-col gap-4">
                                            <Checkbox label="Enable system notifications" checked={checkboxStatus} onChange={setCheckboxStatus} />
                                            <Radio label="Standard Mode" checked={radioValue === 'option1'} onChange={() => setRadioValue('option1')} />
                                            <Radio label="Performance Mode" checked={radioValue === 'option2'} onChange={() => setRadioValue('option2')} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-6">
                                        <Select
                                            label="Select Priority"
                                            value={selectValue}
                                            onChange={setSelectValue}
                                            options={[
                                                { value: 'val1', label: 'Low - Standard Reply' },
                                                { value: 'val2', label: 'Medium - Fast Track' },
                                                { value: 'val3', label: 'High - Immediate' }
                                            ]}
                                        />
                                        <Slider label="Threshold Sensitivity" value={sliderValue} onChange={setSliderValue} />
                                    </div>
                                </div>
                            </section>

                            <section className="flex flex-col gap-6">
                                <h3 className="text-body2 font-black text-neutral-300 uppercase tracking-widest">Content & Containers</h3>
                                <div className="flex flex-col gap-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Note label="Integration Success" variant="success">
                                            Seu pipeline de vendas do WhatsApp foi conectado com sucesso ao sistema central.
                                        </Note>
                                        <Note label="System Warning" variant="warning">
                                            O limite de créditos de IA está chegando ao fim. Considere fazer o upgrade do seu plano.
                                        </Note>
                                    </div>
                                    <Collapse title="Advanced Security Configuration">
                                        <p>Configure aqui tokens de API e autenticação multi-fator para sua equipe.</p>
                                    </Collapse>
                                </div>
                            </section>

                            <section className="flex flex-col gap-6">
                                <h3 className="text-body2 font-black text-neutral-300 uppercase tracking-widest">Professional Grid</h3>
                                <Table
                                    columns={[
                                        { header: 'Nome', accessor: 'name' },
                                        { header: 'E-mail', accessor: 'email' },
                                        { header: 'Plano', accessor: (item) => <Badge variant="primary" size="sm" isPill>{item.plan}</Badge> },
                                        {
                                            header: 'Status', accessor: (item) => (
                                                <Badge variant={item.status === 'Ativo' ? 'success' : item.status === 'Pendente' ? 'warning' : 'error'} isPill>
                                                    {item.status}
                                                </Badge>
                                            )
                                        }
                                    ]}
                                    data={mockTableData}
                                />
                            </section>

                            <section className="flex flex-col gap-6">
                                <h3 className="text-body2 font-black text-neutral-300 uppercase tracking-widest">States & Feedback</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <EmptyState
                                        title="Nenhum dado encontrado"
                                        description="Você ainda não possui pedidos registrados neste período. Comece criando um novo pedido manual."
                                        actionLabel="Criar Novo Pedido"
                                        onAction={() => { }}
                                    />
                                    <div className="p-10 bg-neutral-25 rounded-3xl border border-neutral-100 flex flex-col gap-6">
                                        <div className="flex items-center gap-4">
                                            <Skeleton isCircle className="w-12 h-12" />
                                            <div className="flex flex-col gap-2">
                                                <Skeleton className="w-32 h-4" />
                                                <Skeleton className="w-24 h-3" />
                                            </div>
                                        </div>
                                        <Skeleton className="w-full h-32" />
                                    </div>
                                </div>
                            </section>

                            <section className="flex flex-col gap-6">
                                <h3 className="text-body2 font-black text-neutral-300 uppercase tracking-widest">Banners</h3>
                                <ProjectBanner
                                    title="Domine a IA com o Qrivo Enterprise"
                                    description="Desbloqueie automações ilimitadas e suporte prioritário 24/7 para sua operação de vendas."
                                    actionLabel="Ver Planos Enterprise"
                                    onAction={() => { }}
                                    image="https://0e65cb6695ddeca8cb391ef6f8f9b815.cdn.bubble.io/f1766623374427x261268037475739240/Qrivo%20S%C3%ADmbolo.svg"
                                />
                            </section>
                        </div>
                    )}

                    {activeSection === 'icons' && (
                        <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <header className="flex flex-col gap-4">
                                <h2 className="text-h2 font-black tracking-tight">Ícones</h2>
                                <p className="text-body1 text-neutral-500">
                                    Utilizamos a biblioteca **Phosphor Icons** no peso Bold para navegação e Fill para estados ativos.
                                </p>
                            </header>

                            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
                                {[
                                    'ph-shopping-cart', 'ph-package', 'ph-robot', 'ph-funnel',
                                    'ph-users', 'ph-kanban', 'ph-gear', 'ph-sparkle',
                                    'ph-house', 'ph-chart-line', 'ph-envelope', 'ph-whatsapp-logo',
                                    'ph-user', 'ph-lock', 'ph-eye', 'ph-arrow-left'
                                ].map(icon => (
                                    <div key={icon} className="aspect-square bg-white border border-neutral-100 rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-neutral-900 hover:shadow-md transition-all cursor-pointer">
                                        <i className={`ph ${icon} text-2xl text-neutral-500 group-hover:text-primary-600`}></i>
                                        <span className="text-[10px] text-neutral-300 font-medium group-hover:text-neutral-900 truncate px-2">{icon.replace('ph-', '')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DesignSystemPage;
