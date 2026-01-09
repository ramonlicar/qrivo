
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'neutral' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  isPill?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  isPill = false,
  className = ''
}) => {
  const variants = {
    success: 'bg-[#DBFBED] text-[#09B86D] border-[#09B86D]/20',
    error: 'bg-red-50 text-red-600 border-red-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    neutral: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    primary: 'bg-primary-50 text-primary-600 border-primary-200',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-[11px]',
    lg: 'px-3 py-1 text-[12px]',
  };

  return (
    <div className={`
      inline-flex items-center justify-center font-bold border transition-all duration-200
      ${variants[variant]}
      ${sizes[size]}
      ${isPill ? 'rounded-full' : 'rounded-md'}
      ${className}
    `}>
      <span className="uppercase tracking-wider">
        {children}
      </span>
    </div>
  );
};
