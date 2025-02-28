"use client"

import { BaseError, useAccount, useChainId, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { ProductDetails } from "./ProductDetails";
import Image from "next/image";
import { useState } from "react";
import { truncateAddress } from "~/lib/truncateAddress";
import { UserRejectedRequestError } from "viem";

export default function ProductUI({ productDetails }: { productDetails: ProductDetails }) {

  const [txHash, setTxHash] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });
  console.log("txHash", txHash);
  console.log("isConfirming", isConfirming);
  console.log("isConfirmed", isConfirmed);

  const handleBuy = () => {
    sendTransaction(
      {
        // call yoink() on Yoink contract
        to: "0x4bBFD120d9f352A0BEd7a014bd67913a2007a878",
        data: "0x9846cd9efc000023c0",
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
        },
      }
    );
  };

  return (
    <div className="max-w-full bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {productDetails.images && productDetails.images.length > 0 ? (
          <Image
            src={productDetails.images[0]}
            alt={productDetails.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No image available
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h1 className="text-xl text-black font-bold text-center mb-2">
          {productDetails.name}
        </h1>

        <div className="flex justify-between items-center mb-3">
          <span className="text-lg font-semibold text-green-600">
            ${productDetails.price?.toFixed(2) || "0.00"}
          </span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {productDetails.quantity > 0
              ? `${productDetails.quantity} in stock`
              : "Out of stock"}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {productDetails.description}
        </p>

        <div className="flex space-x-2">
          <button
            onClick={handleBuy}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium"
          >
            Buy Now
          </button>
          <button className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 px-3 rounded text-sm font-medium">
            Referral Link
          </button>
        </div>
        {isSendTxError && renderError(sendTxError)}
        {txHash && (
          <div className="mt-2 text-xs text-gray-500">
            <div>Hash: {truncateAddress(txHash)}</div>
            <div>
              Status:{" "}
              {isConfirming
                ? "Confirming..."
                : isConfirmed
                ? "Confirmed!"
                : "Pending"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const renderError = (error: Error | null) => {
  if (!error) return null;
  if (error instanceof BaseError) {
    const isUserRejection = error.walk(
      (e) => e instanceof UserRejectedRequestError
    );

    if (isUserRejection) {
      return <div className="text-red-500 text-xs mt-1">Rejected by user.</div>;
    }
  }

  return <div className="text-red-500 text-xs mt-1">{error.message}</div>;
};