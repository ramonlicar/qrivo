
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
    <div className="flex flex-col items-start p-[12px] w-full min-h-[94px] bg-white border-[1.2px] border-[#E8E8E3] shadow-[0px_3px_6px_rgba(0,0,0,0.05)] rounded-[14px]">
      <div className="flex flex-row justify-between items-center w-full mb-auto">
        <span className="text-body2 font-semibold text-[#2C2C2A]">
          {label}
        </span>
        <div className={`flex flex-row justify-center items-center w-[38px] h-[38px] rounded-[9px] ${iconBgColor}`}>
          <i className={`ph ${icon} text-[19px] ${iconColor}`}></i>
        </div>
      </div>

      <span className="text-h3 font-bold text-[#01040E] mt-auto">
        {value}
      </span>
    </div>
  );
};
