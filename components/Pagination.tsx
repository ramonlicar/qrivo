
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages || totalPages === 0;

  const buttonBaseClass = "flex items-center justify-center w-8 h-8 rounded-md border border-neutral-100 transition-all flex-none";
  const activeClass = "bg-white text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 hover:bg-neutral-25 active:scale-95 shadow-sm";
  const disabledClass = "bg-neutral-25 cursor-not-allowed opacity-60 border-neutral-100 text-neutral-400";
  const iconClass = "text-[16px]";

  return (
    <div className="flex flex-row items-center gap-1.5 h-8 w-auto">
      <button onClick={() => !isFirstPage && onPageChange(1)} disabled={isFirstPage} className={`${buttonBaseClass} ${isFirstPage ? disabledClass : activeClass}`} title="Primeira"><i className={`ph ph-caret-double-left ${iconClass}`}></i></button>
      <button onClick={() => !isFirstPage && onPageChange(currentPage - 1)} disabled={isFirstPage} className={`${buttonBaseClass} ${isFirstPage ? disabledClass : activeClass}`} title="Anterior"><i className={`ph ph-caret-left ${iconClass}`}></i></button>
      <div className="flex items-center justify-center px-4 min-w-[80px] h-full font-bold text-[12px] text-neutral-900 whitespace-nowrap select-none">
        <span>{currentPage}</span><span className="mx-2 text-neutral-300 font-normal">/</span><span>{Math.max(1, totalPages)}</span>
      </div>
      <button onClick={() => !isLastPage && onPageChange(currentPage + 1)} disabled={isLastPage} className={`${buttonBaseClass} ${isLastPage ? disabledClass : activeClass}`} title="Próxima"><i className={`ph ph-caret-right ${iconClass}`}></i></button>
      <button onClick={() => !isLastPage && onPageChange(totalPages)} disabled={isLastPage} className={`${buttonBaseClass} ${isLastPage ? disabledClass : activeClass}`} title="Última"><i className={`ph ph-caret-double-right ${iconClass}`}></i></button>
    </div>
  );
};
