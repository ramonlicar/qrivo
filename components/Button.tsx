
import React from 'react';
import { buttonStyles } from '../buttons';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'neutral' | 'tertiary' | 'danger-light';
  isLoading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const isInactive = disabled || isLoading;

  // Obter estilos da variante selecionada
  const variantSet = buttonStyles.variants[variant];

  // Aplicar estilos baseados no estado
  const appliedStyle = isInactive
    ? variantSet.inactive
    : `${variantSet.default} ${variantSet.hover} ${variantSet.active}`;

  return (
    <button
      className={`${buttonStyles.base} ${appliedStyle} ${className}`}
      disabled={isInactive}
      {...props}
    >
      {isLoading ? (
        <i className="ph ph-bold ph-circle-notch animate-spin text-base"></i>
      ) : (
        <>
          {leftIcon && <i className={`${leftIcon} text-base flex-none`}></i>}
          {children && <span className="leading-none">{children}</span>}
          {rightIcon && <i className={`${rightIcon} text-base flex-none`}></i>}
        </>
      )}
    </button>
  );
};
