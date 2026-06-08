import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  const [inputMode, setInputMode] = useState(false);
  const [inputValue, setInputValue] = useState(currentPage.toString());

  const handleInputSubmit = () => {
    const page = Math.max(1, Math.min(totalPages, parseInt(inputValue, 10)));
    if (!isNaN(page)) {
      onPageChange(page);
      setInputValue(page.toString());
      setInputMode(false);
    }
  };

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const delta = 2;
    const range: (number | string)[] = [];

    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage > delta + 1) {
      pages.push(1);
      if (currentPage > delta + 2) pages.push('...');
    }
    pages.push(...range);
    if (currentPage < totalPages - delta) {
      if (currentPage < totalPages - delta - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 py-3">
      {/* First */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded-lg text-xs font-semibold border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        title="첫 페이지"
      >
        {'<<'}
      </button>

      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded-lg text-xs font-semibold border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft size={14} />
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-0.5">
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => {
                if (page === currentPage) {
                  setInputMode(true);
                } else {
                  onPageChange(page as number);
                }
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-lg text-xs font-semibold border transition-colors ${
                page === currentPage
                  ? 'bg-blue-600 text-white border-blue-600 cursor-pointer'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {inputMode && page === currentPage ? (
                <input
                  autoFocus
                  type="number"
                  min="1"
                  max={totalPages}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={handleInputSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInputSubmit();
                  }}
                  className="w-14 h-8 px-1 py-0.5 text-center text-xs text-black border border-blue-400 rounded focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
                />
              ) : (
                page
              )}
            </button>
          )
        )}
      </div>

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-lg text-xs font-semibold border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        <ChevronRight size={14} />
      </button>

      {/* Last */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-lg text-xs font-semibold border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        title="마지막 페이지"
      >
        {'>>'}
      </button>
    </div>
  );
}
