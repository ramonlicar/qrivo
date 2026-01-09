
import React from 'react';
import { Button } from './Button';

interface UnderConstructionProps {
  title: string;
  onBackToHome: () => void;
}

export const UnderConstruction: React.FC<UnderConstructionProps> = ({ title, onBackToHome }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center animate-in fade-in duration-500">
      <div className="flex flex-col items-center max-w-md bg-white p-10 rounded-card border border-neutral-200 shadow-cards">
        <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6">
          <i className="ph ph-rocket-launch text-4xl text-primary-500"></i>
        </div>
        
        <h2 className="text-h5 font-bold text-neutral-black mb-2">
          {title}
        </h2>
        
        <p className="text-body1 text-neutral-500 mb-8">
          Estamos trabalhando intensamente nesta funcionalidade. Em breve você terá acesso total a estas ferramentas aqui no Qrivo.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <Button variant="primary" onClick={onBackToHome} leftIcon="ph-arrow-left">
            Voltar para Pedidos
          </Button>
          
          <div className="flex items-center justify-center gap-2 py-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
            <span className="text-tag text-neutral-400 uppercase">Desenvolvimento Ativo</span>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute bottom-10 right-10 opacity-10 pointer-events-none hidden lg:block">
        <i className="ph ph-robot text-[200px]"></i>
      </div>
    </div>
  );
};
