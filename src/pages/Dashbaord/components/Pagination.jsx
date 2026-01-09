import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = false,
  totalItems = 0,
}) => {
  // Don't render if there's only one page or no pages
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  const handlePageClick = (page) => {
    if (
      page !== "..." &&
      page !== currentPage &&
      page >= 1 &&
      page <= totalPages
    ) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
      {showInfo && totalItems > 0 && (
        <div className="text-sm text-slate-600">
          Affichage de {Math.min((currentPage - 1) * 10 + 1, totalItems)} à{" "}
          {Math.min(currentPage * 10, totalItems)} sur {totalItems} résultats
        </div>
      )}

      <div className="flex items-center space-x-1">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`
            inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
            ${
              currentPage === 1
                ? "text-slate-400 cursor-not-allowed"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }
          `}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Précédent
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center space-x-1 mx-4">
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="inline-flex items-center justify-center w-10 h-10 text-slate-400">
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              ) : (
                <button
                  onClick={() => handlePageClick(page)}
                  className={`
                    inline-flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200
                    ${
                      page === currentPage
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }
                  `}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile page info */}
        <div className="sm:hidden text-sm text-slate-600 mx-4">
          Page {currentPage} sur {totalPages}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`
            inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
            ${
              currentPage === totalPages
                ? "text-slate-400 cursor-not-allowed"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }
          `}
        >
          Suivant
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
