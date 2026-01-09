
import React, { useEffect, useRef } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  autoResize?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  containerClassName = '',
  className = '',
  autoResize = true,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea && autoResize) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [props.value]);

  return (
    <div className={`
      box-border flex flex-row items-start p-0 bg-white border border-neutral-200 rounded-md
      focus-within:border-neutral-900 transition-all group shadow-sm
      overflow-hidden
      ${containerClassName}
    `}>
      <textarea
        ref={textareaRef}
        onInput={adjustHeight}
        className={`
          w-full bg-transparent border-none text-[13px] font-medium 
          text-neutral-black p-3
          placeholder:text-neutral-400 focus:outline-none flex-1 resize-none
          custom-textarea-scrollbar
          ${className}
        `}
        {...props}
      />
      <style>{`
        .custom-textarea-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-textarea-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-textarea-scrollbar::-webkit-scrollbar-thumb {
          background: #EEEEEC;
          border-radius: 4px;
        }
        .custom-textarea-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #DCDCD5;
        }
      `}</style>
    </div>
  );
};
