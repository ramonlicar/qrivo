
import React from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: string;
  rightIcon?: string;
  containerClassName?: string;
  onRightIconClick?: () => void;
}

export const TextInput: React.FC<TextInputProps> = ({
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
  onRightIconClick,
  ...props
}) => {
  return (
    <div className={`
      box-border flex flex-row items-center p-[0px_12px] gap-[10px] h-[40px] bg-white border border-neutral-200 rounded-md
      focus-within:border-neutral-900 transition-all group shadow-sm
      ${containerClassName}
    `}>
      {leftIcon && (
        <i className={`ph ${leftIcon} text-neutral-400 group-focus-within:text-neutral-900 transition-colors`}></i>
      )}

      <input
        className={`
          w-full h-full bg-transparent border-none text-[13px] font-medium 
          text-neutral-black
          placeholder:text-neutral-400 focus:outline-none flex-1
          ${className}
        `}
        {...props}
      />

      {rightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          className={`ph ${rightIcon} text-neutral-400 group-focus-within:text-neutral-900 transition-colors outline-none ${onRightIconClick ? 'cursor-pointer hover:scale-110 active:scale-95' : 'pointer-events-none'}`}
        ></button>
      )}
    </div>
  );
};
