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

  // Client-side filtering
  const filteredTransactions = transactions.filter((txn) => {
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
      (filterType === "conveyance" && txn.transactionNature?.toLowerCase().includes("conveyance")) ||
      (filterType === "mortgage" && txn.transactionNature?.toLowerCase().includes("mortgage")) ||
      (filterType === "gift" && txn.transactionNature?.toLowerCase().includes("gift"));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full">
      {/* Search and Filter Bar */}
      <div className="mb-4 flex gap-4 flex-col sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by buyer, seller, document no., survey no., plot no., village..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="conveyance">Conveyance</option>
            <option value="mortgage">Mortgage</option>
            <option value="gift">Gift Deed</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-2 text-sm text-gray-600">
        Showing {filteredTransactions.length} of {transactions.length} transactions
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
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn) => (
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
                    <div className="max-w-xs truncate" title={txn.sellerName || "-"}>
                      {txn.sellerName || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={txn.buyerName || "-"}>
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
                    {txn.considerationValue ? `₹${txn.considerationValue}` : "-"}
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
    </div>
  );
}
