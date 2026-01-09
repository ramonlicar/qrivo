
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white border border-neutral-100 rounded-xl shadow-sm overflow-hidden ${noPadding ? '' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
};
