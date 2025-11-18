"use client";

import { Transaction } from "@/lib/actions/transactions";

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function TransactionDetailsModal({
  transaction,
  onClose,
}: TransactionDetailsModalProps) {
  if (!transaction) return null;

  const DetailRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 col-span-2">{value || "-"}</dd>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Transaction Details - {transaction.documentNumberTamil}/{transaction.documentYear}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <dl className="space-y-1">
            {/* Document Information */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Document Information
              </h3>
              <div className="space-y-1">
                <DetailRow label="Document Number (Tamil)" value={transaction.documentNumberTamil} />
                <DetailRow label="Document Number (English)" value={transaction.documentNumberEnglish} />
                <DetailRow label="Document Year" value={transaction.documentYear} />
                <DetailRow label="Transaction Nature" value={transaction.transactionNature} />
                <DetailRow label="Page Number" value={transaction.pageNumber?.toString()} />
              </div>
            </div>

            {/* Dates */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dates</h3>
              <div className="space-y-1">
                <DetailRow label="Execution Date" value={transaction.executionDate} />
                <DetailRow label="Presentation Date" value={transaction.presentationDate} />
                <DetailRow label="Registration Date" value={transaction.registrationDate} />
              </div>
            </div>

            {/* Parties */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Parties</h3>
              <div className="space-y-1">
                <DetailRow label="Seller (Tamil)" value={transaction.sellerNameTamil} />
                <DetailRow label="Seller (English)" value={transaction.sellerNameEnglish} />
                <DetailRow label="Buyer (Tamil)" value={transaction.buyerNameTamil} />
                <DetailRow label="Buyer (English)" value={transaction.buyerNameEnglish} />
              </div>
            </div>

            {/* Property Details */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Property Details
              </h3>
              <div className="space-y-1">
                <DetailRow label="Survey Number (Tamil)" value={transaction.surveyNumberTamil} />
                <DetailRow label="Survey Number (English)" value={transaction.surveyNumberEnglish} />
                <DetailRow label="Plot Number (Tamil)" value={transaction.plotNumberTamil} />
                <DetailRow label="Plot Number (English)" value={transaction.plotNumberEnglish} />
                <DetailRow label="Village (Tamil)" value={transaction.villageTamil} />
                <DetailRow label="Village (English)" value={transaction.villageEnglish} />
                <DetailRow label="Property Type" value={transaction.propertyType} />
                <DetailRow label="Property Extent" value={transaction.propertyExtent} />
              </div>
            </div>

            {/* Financial Details */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Financial Details
              </h3>
              <div className="space-y-1">
                <DetailRow label="Consideration Value" value={transaction.considerationValue ? `₹${transaction.considerationValue}` : undefined} />
                <DetailRow label="Market Value" value={transaction.marketValue ? `₹${transaction.marketValue}` : undefined} />
              </div>
            </div>

            {/* Original Text */}
            {transaction.originalText && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Original Text (Tamil)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap break-words font-sans">
                    {transaction.originalText}
                  </pre>
                </div>
              </div>
            )}

            {/* Translated Text */}
            {transaction.translatedText && transaction.translatedText !== "[Translation unavailable - rate limited]" && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Translated Text (English)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap break-words font-sans">
                    {transaction.translatedText}
                  </pre>
                </div>
              </div>
            )}
          </dl>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
