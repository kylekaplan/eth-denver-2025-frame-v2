'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { use } from 'react';

type Purchase = {
  id: string;
  productId: string;
  txHash: string;
  timestamp: number;
  buyerAddress: string;
  referrerFid?: number;
  referrerName?: string;
};

export default function ProductPurchasesPage({ 
  params 
}: { 
  params: Promise<{ productId: string }> 
}) {
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const { productId } = resolvedParams;
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [productName, setProductName] = useState<string>("");

  const blockExplorerUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || 'https://etherscan.io';

  useEffect(() => {
    async function fetchPurchases() {
      try {
        // Fetch all purchases
        const response = await fetch('/api/purchases');
        if (!response.ok) {
          throw new Error('Failed to fetch purchases');
        }
        const data = await response.json();
        
        // Filter purchases by product ID
        const filteredPurchases = data.purchases.filter(
          (purchase: Purchase) => purchase.productId === productId
        );
        
        setPurchases(filteredPurchases);
        
        // Try to fetch product details to get the name
        try {
          const productResponse = await fetch(`/api/product?id=${productId}`);
          if (productResponse.ok) {
            const productData = await productResponse.json();
            if (productData.data?.attestations?.length > 0) {
              // This is simplified - you might need to adjust based on your actual data structure
              setProductName("Product Details");
            }
          }
        } catch (productError) {
          console.error("Error fetching product details:", productError);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      fetchPurchases();
    }
  }, [productId]);

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
      <h1 className="text-3xl font-bold mb-2 text-gray-900">
        Purchase History
      </h1>
      <h2 className="text-xl mb-6 text-gray-700">
        {productName ? productName : `Product: ${truncateProductId(productId)}`}
      </h2>
      
      {loading && <p className="text-gray-700">Loading purchases...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {!loading && !error && purchases.length === 0 && (
        <p className="text-gray-700">No purchases found for this product.</p>
      )}
      
      {purchases.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b border-gray-200 text-left font-semibold text-gray-800">Buyer</th>
                <th className="py-2 px-4 border-b border-gray-200 text-left font-semibold text-gray-800">Transaction</th>
                <th className="py-2 px-4 border-b border-gray-200 text-left font-semibold text-gray-800">Date</th>
                <th className="py-2 px-4 border-b border-gray-200 text-left font-semibold text-gray-800">Referrer</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
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
    </div>
  );
} 