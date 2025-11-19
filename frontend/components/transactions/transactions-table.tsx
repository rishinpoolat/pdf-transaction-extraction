"use client";

import { useState } from "react";
import { Transaction } from "@/lib/actions/transactions";

interface TransactionsTableProps {
  transactions: Transaction[];
  onViewDetails?: (transaction: Transaction) => void;
}

export function TransactionsTable({
  transactions,
  onViewDetails,
}: TransactionsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "document" | "none">("none");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Client-side filtering
  let filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      searchTerm === "" ||
      txn.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.documentNumber?.includes(searchTerm) ||
      txn.surveyNumber?.includes(searchTerm) ||
      txn.plotNumber?.includes(searchTerm) ||
      txn.village?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      (filterType === "conveyance" &&
        txn.transactionNature?.toLowerCase().includes("conveyance")) ||
      (filterType === "mortgage" &&
        txn.transactionNature?.toLowerCase().includes("mortgage")) ||
      (filterType === "gift" &&
        txn.transactionNature?.toLowerCase().includes("gift"));

    return matchesSearch && matchesFilter;
  });

  // Apply sorting
  if (sortBy === "date") {
    filteredTransactions = [...filteredTransactions].sort((a, b) => {
      const dateA = a.executionDate || a.registrationDate || "";
      const dateB = b.executionDate || b.registrationDate || "";

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      const comparison = new Date(dateA).getTime() - new Date(dateB).getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    });
  } else if (sortBy === "document") {
    filteredTransactions = [...filteredTransactions].sort((a, b) => {
      const docA = `${a.documentNumber || ""}/${a.documentYear || ""}`;
      const docB = `${b.documentNumber || ""}/${b.documentYear || ""}`;
      const comparison = docA.localeCompare(docB);
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    endIndex
  );

  // Reset to page 1 when filter/search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  return (
    <div className="w-full">
      {/* Search and Filter Bar */}
      <div className="mb-4 flex gap-4 flex-col sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by buyer, seller, document no., survey no., plot no., village..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          >
            <option value="all">All Types</option>
            <option value="conveyance">Conveyance</option>
            <option value="mortgage">Mortgage</option>
            <option value="gift">Gift Deed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as "date" | "document" | "none");
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          >
            <option value="none">No Sorting</option>
            <option value="date">Sort by Date</option>
            <option value="document">Sort by Document #</option>
          </select>

          {sortBy !== "none" && (
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-black"
              title={sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-2 text-sm text-gray-600">
        Showing {startIndex + 1}-
        {Math.min(endIndex, filteredTransactions.length)} of{" "}
        {filteredTransactions.length} transactions
        {filteredTransactions.length !== transactions.length &&
          ` (filtered from ${transactions.length})`}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Page
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seller
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Buyer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Survey No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plot No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No transactions found
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.pageNumber || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {txn.documentNumber || "-"}
                    {txn.documentYear && `/${txn.documentYear}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.executionDate || txn.registrationDate || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.transactionNature || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div
                      className="max-w-xs truncate"
                      title={txn.sellerName || "-"}
                    >
                      {txn.sellerName || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div
                      className="max-w-xs truncate"
                      title={txn.buyerName || "-"}
                    >
                      {txn.buyerName || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.surveyNumber || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.plotNumber || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.considerationValue
                      ? `₹${txn.considerationValue}`
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onViewDetails?.(txn)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-black"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-black"
            >
              Previous
            </button>

            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 hover:bg-gray-50 text-black"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-black"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-black"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
