
import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  height?: string;
  className?: string;
  noPadding?: boolean;
  zIndex?: number;
  hideHeader?: boolean;
  position?: 'center' | 'right';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '448px',
  height = 'auto',
  className = '',
  noPadding = false,
  zIndex = 100,
  hideHeader = false,
  position = 'center'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const positionClasses = {
    center: {
      overlay: "items-center justify-center p-4",
      content: "rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[calc(100vh-48px)]"
    },
    right: {
      overlay: "justify-end p-0",
      content: "h-full shadow-2xl animate-in slide-in-from-right duration-300 border-r-0 border-y-0"
    }
  };

  const currentStyle = positionClasses[position];

  return (
    <div
      className={`fixed inset-0 flex bg-black/30 animate-in fade-in duration-200 ${currentStyle.overlay}`}
      onClick={onClose}
      style={{ zIndex }}
    >
      <div
        className={`relative w-full bg-white flex flex-col overflow-hidden border border-neutral-100 ${currentStyle.content} ${className}`}
        style={{ maxWidth, height: position === 'right' ? '100%' : height }}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideHeader && (
          <div className="box-border flex flex-row justify-between items-center px-6 h-14 bg-white border-b border-neutral-100 flex-none gap-4">
            <div className="flex-1 text-left flex items-center overflow-hidden">
              {typeof title === 'string' ? <h5 className="text-[15px] font-black text-neutral-900 tracking-tight truncate m-0">{title}</h5> : title}
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-neutral-50 transition-all flex-none text-neutral-400 hover:text-neutral-900"
            >
              <i className="ph ph-x text-lg"></i>
            </button>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto custom-scrollbar ${noPadding ? 'p-0' : 'p-6'}`}>{children}</div>
        {footer && <div className="flex-none bg-neutral-25/30 border-t border-neutral-100 p-6">{footer}</div>}
      </div >
    </div >
  );
};
