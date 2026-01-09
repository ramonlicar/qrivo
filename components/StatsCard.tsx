
import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  iconBgColor: string;
  iconColor: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, iconBgColor, iconColor }) => {
  return (
    <div className="box-border flex flex-row items-center justify-between p-5 w-full min-h-[88px] bg-white border border-neutral-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group cursor-default">
      {/* Coluna Esquerda: Valor e Label */}
      <div className="flex flex-col items-start gap-1 overflow-hidden">
        <span className="text-[22px] font-black text-neutral-900 tracking-tight leading-none truncate w-full">
          {value}
        </span>
        <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest whitespace-nowrap">
          {label}
        </span>
      </div>

      {/* Coluna Direita: Ícone com Fundo Colorido */}
      <div className={`flex flex-none items-center justify-center w-10 h-10 ${iconBgColor} rounded-lg shadow-sm transition-transform group-hover:scale-105 ml-2 border border-black/5`}>
        <i className={`ph ${icon} text-[20px] ${iconColor}`}></i>
      </div>
    </div>
  );
};
