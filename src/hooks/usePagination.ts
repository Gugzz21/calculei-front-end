import { useState, useEffect } from 'react';

interface UsePaginationProps {
  totalItems: number;
  initialItemsPerPage?: number;
}

export function usePagination({ totalItems, initialItemsPerPage = 5 }: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [pageInput, setPageInput] = useState("1");

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handleGoToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setPageInput(p.toString());
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleItemRemoved = (isLastInPage: boolean) => {
    if (isLastInPage && currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  return {
    currentPage,
    itemsPerPage,
    pageInput,
    totalPages,
    startIndex,
    setPageInput,
    handleGoToPage,
    handlePrevPage,
    handleNextPage,
    handleItemsPerPageChange,
    handleItemRemoved
  };
}
