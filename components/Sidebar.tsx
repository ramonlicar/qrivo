
import React from 'react';
import { NAVIGATION_SECTIONS } from '../constants';
import { SidebarTooltip } from './SidebarTooltip';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activePath: string;
  onNavigate: (path: string) => void;
  userProfile?: {
    name: string;
    avatar_url: string;
  };
  userStats?: {
    plan: string;
    used: number;
    total: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  activePath,
  onNavigate,
  userStats = { plan: 'Plano Gratuito', used: 0, total: 50 },
  userProfile = { name: 'Usuário', avatar_url: '' }
}) => {


  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
    if (isOpen) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[60] lg:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        flex flex-col justify-between items-center p-[16px_12px] gap-[16px] 
        h-screen bg-neutral-100 
        fixed lg:sticky top-0 left-0 z-[70]
        border-r border-neutral-200
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-[72px] min-w-[72px]' : 'w-[240px] min-w-[240px]'}
      `}>

        {/* Top Section: Logo + Nav */}
        <div className="flex flex-col items-center gap-[16px] w-full overflow-hidden flex-1 min-h-0">
          {/* Logo Container */}
          <div className={`py-4 w-full flex items-center transition-all ${isCollapsed ? 'justify-center px-0' : 'flex-row justify-between px-3'}`}>
            {isCollapsed ? (
              <img
                src="https://0e65cb6695ddeca8cb391ef6f8f9b815.cdn.bubble.io/f1766623374427x261268037475739240/Qrivo%20S%C3%ADmbolo.svg"
                alt="Q"
                className="h-[42px] w-auto pointer-events-none select-none cursor-pointer"
                onClick={() => onNavigate('/')}
              />
            ) : (
              <>
                <img
                  src="//0e65cb6695ddeca8cb391ef6f8f9b815.cdn.bubble.io/f1759800667234x298580053943223740/logo%20qrivo%20ia.svg"
                  alt="Qrivo.ia"
                  className="h-[38px] w-auto pointer-events-none select-none transition-opacity duration-200 cursor-pointer"
                  onClick={() => onNavigate('/')}
                />

                <button
                  onClick={onToggleCollapse}
                  className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-200 text-neutral-400 hover:text-neutral-900 transition-all group"
                  title="Recolher"
                >
                  <i className="ph ph-caret-double-left text-lg group-hover:scale-110"></i>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-full hover:bg-neutral-200 text-neutral-500 transition-colors"
              aria-label="Fechar menu"
            >
              <i className="ph ph-x ph-bold text-xl"></i>
            </button>
          </div>


          {/* Navigation Groups */}
          <nav className={`w-full flex flex-col items-center overflow-y-auto no-scrollbar flex-1 ${isCollapsed ? 'space-y-1' : 'space-y-6 mt-4'}`}>
            {NAVIGATION_SECTIONS.map((section) => (
              <div key={section.title} className="w-full">
                {!isCollapsed && (
                  <h3 className="text-[11px] text-neutral-400 mb-2 px-3 font-medium tracking-[0.02em] leading-[18px] select-none truncate uppercase">
                    {section.title}
                  </h3>
                )}
                <ul className={`flex flex-col items-center w-full ${isCollapsed ? 'space-y-1' : 'space-y-1'}`}>
                  {section.items.map((item) => {
                    const isActive = activePath === item.path;
                    return (
                      <li key={item.label} className="w-full relative group/tooltip">
                        <SidebarTooltip label={item.label} active={isCollapsed}>
                          <button
                            onClick={(e) => handleNavClick(e, item.path)}
                            className={`flex items-center rounded-lg transition-all group border ${isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 h-8 w-full'
                              } ${isActive
                                ? 'bg-white shadow-small border-transparent'
                                : 'border-transparent hover:bg-neutral-200'
                              }`}
                          >
                            <i className={`ph ${item.icon} ${isActive ? 'ph-fill text-primary-600' : 'ph-bold text-neutral-500'} text-base group-hover:scale-110 transition-transform`}></i>
                            {!isCollapsed && (
                              <span className={`text-body2 leading-none font-semibold tracking-tight truncate ${isActive ? 'text-primary-600' : 'text-neutral-black'}`}>
                                {item.label}
                              </span>
                            )}
                          </button>
                        </SidebarTooltip>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Section: Profile & Plan Card */}
        <div className="w-full pt-4 border-t border-neutral-200 flex flex-col gap-3">
          <SidebarTooltip label="Ajustes da Conta" active={isCollapsed}>
            <button
              onClick={() => onNavigate('/ajustes')}
              className={`flex flex-col bg-white rounded-xl border border-neutral-200 shadow-small overflow-hidden transition-all text-left w-full hover:border-primary-300 hover:shadow-md active:scale-[0.98] group relative ${isCollapsed ? 'p-1.5 items-center w-10 h-10 mx-auto' : 'p-3'
                }`}
            >
              <div className={`flex items-center gap-3 w-full ${isCollapsed ? 'justify-center' : ''}`}>
                <div className={`rounded-lg bg-primary-500 flex-shrink-0 flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-110 transition-transform overflow-hidden ${isCollapsed ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-[12px]'}`}>
                  {userProfile.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{userProfile.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-body2 font-semibold text-neutral-black leading-tight truncate w-full group-hover:text-primary-600 transition-colors">
                      {userProfile.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <i className="ph ph-crown-simple ph-fill text-[10px] text-amber-500"></i>
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tight">{userStats.plan}</span>
                    </div>
                  </div>
                )}
              </div>
            </button>
          </SidebarTooltip>

          {isCollapsed && (
            <SidebarTooltip label="Expandir Menu" active={isCollapsed}>
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center justify-center w-10 h-10 text-neutral-400 hover:text-neutral-900 transition-all mx-auto group bg-white border border-neutral-200 rounded-xl shadow-small relative"
                title="Expandir"
              >
                <i className="ph ph-caret-double-right text-[18px] group-hover:scale-110"></i>
              </button>
            </SidebarTooltip>
          )}
        </div>
      </aside>
    </>
  );
};
