'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

type Purchase = {
  id: string;
  productId: string;
  txHash: string;
  timestamp: number;
  buyerAddress: string;
  referrerFid?: number;
  referrerName?: string;
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const blockExplorerUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || 'https://etherscan.io';
  console.log("blockExplorerUrl", blockExplorerUrl);

  useEffect(() => {
    async function fetchPurchases() {
      try {
        const response = await fetch('/api/purchases');
        if (!response.ok) {
          throw new Error('Failed to fetch purchases');
        }
        const data = await response.json();
        setPurchases(data.purchases);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchPurchases();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const truncateProductId = (id: string) => {
    if (!id) return '';
    return id.length > 20 ? `${id.substring(0, 10)}...${id.substring(id.length - 10)}` : id;
  };

  return (
    <div className="h-screen container mx-auto px-4 py-8 bg-white">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Purchase History</h1>
      
      {loading && <p className="text-gray-700">Loading purchases...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {!loading && !error && purchases.length === 0 && (
        <p className="text-gray-700">No purchases recorded yet.</p>
      )}
      
      {purchases.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b border-gray-200 text-left font-semibold text-gray-800">Product ID</th>
                <th className="py-2 px-4 border-b border-gray-200 text-left font-semibold text-gray-800">Buyer</th>
                <th className="py-2 px-4 border-b border-gray-200 text-left font-semibold text-gray-800">Transaction</th>
                <th className="py-2 px-4 border-b border-gray-200 text-left font-semibold text-gray-800">Date</th>
                <th className="py-2 px-4 border-b border-gray-200 text-left font-semibold text-gray-800">Referrer</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b border-gray-200 text-gray-900">
                    <div className="flex items-center">
                      <span className="mr-2">{truncateProductId(purchase.productId)}</span>
                      <button 
                        onClick={() => copyToClipboard(purchase.productId, purchase.id)}
                        className="text-gray-500 hover:text-blue-500"
                        title="Copy product ID"
                      >
                        {copiedId === purchase.id ? (
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <ClipboardIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200">
                    <a 
                      href={`${blockExplorerUrl}/address/${purchase.buyerAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {purchase.buyerAddress.substring(0, 6)}...{purchase.buyerAddress.substring(38)}
                    </a>
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200">
                    <a 
                      href={`${blockExplorerUrl}/tx/${purchase.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {purchase.txHash.substring(0, 6)}...{purchase.txHash.substring(62)}
                    </a>
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-gray-900">
                    {new Date(purchase.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-gray-900">
                    {purchase.referrerName ? (
                      <span>
                        {purchase.referrerName} 
                        {purchase.referrerFid && (
                          <span className="text-gray-500 ml-1">
                            (FID: {purchase.referrerFid})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-6">
        <Link href="/admin" className="text-blue-500 hover:text-blue-600 hover:underline">
          Back to Admin
        </Link>
      </div>
    </div>
  );
} 