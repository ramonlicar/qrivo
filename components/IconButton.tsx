
import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  variant?: 'edit' | 'delete' | 'neutral' | 'ghost';
  size?: 'sm' | 'md';
  title?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'neutral',
  size = 'sm',
  className = '',
  title,
  ...props
}) => {
  // Tamanho padrão sm (32x32) usado em listas e tabelas, md (36x36) para áreas mais amplas
  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const iconSize = size === 'sm' ? 'text-[18px]' : 'text-[20px]';

  const variantClasses = {
    edit: 'text-neutral-500 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50',
    delete: 'text-neutral-500 hover:text-system-error-500 hover:border-system-error-200 hover:bg-system-error-50',
    neutral: 'text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 hover:bg-neutral-100',
    ghost: 'border-transparent bg-transparent shadow-none text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'
  };

  return (
    <button
      title={title}
      className={`
        flex items-center justify-center rounded-md border border-neutral-200 bg-white transition-all active:scale-95 flex-none hover:shadow-sm
        ${sizeClasses}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      <i className={`ph ${icon} ${iconSize}`}></i>
    </button>
  );
};
