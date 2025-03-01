"use client";

import {
  BaseError,
  useAccount,
  useChainId,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { truncateAddress } from "~/lib/truncateAddress";
import { UserRejectedRequestError } from "viem";
import sdk, {
  AddFrame,
  FrameNotificationDetails,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import { createStore } from "mipd";
import { baseSepolia } from "viem/chains";

export type ProductDetails = {
  name: string;
  description: string;
  price: number;
  quantity: number;
  images: string[];
  contractAddress: string;
  productId: string;
  seller: {
    fid: number;
    displayName: string;
    address: `0x${string}`;
  };
  referrer?: {
    fid?: number;
    displayName?: string;
  };
  // returnPolicy: string;
  // returnWindow: string;
  // shippingPolicy: string;
  // sku: string;
  // upc: string;
};

export default function ProductUI({
  productDetails,
}: {
  productDetails: ProductDetails;
}) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [added, setAdded] = useState(false);
  const [notificationDetails, setNotificationDetails] =
    useState<FrameNotificationDetails | null>(null);

  const [lastEvent, setLastEvent] = useState("");

  const [addFrameResult, setAddFrameResult] = useState("");
  const [sendNotificationResult, setSendNotificationResult] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [askToSwitchChain, setAskToSwitchChain] = useState(false);
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


  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      setAdded(context.client.added);

      sdk.on("frameAdded", ({ notificationDetails }) => {
        setLastEvent(
          `frameAdded${!!notificationDetails ? ", notifications enabled" : ""}`
        );

        setAdded(true);
        if (notificationDetails) {
          setNotificationDetails(notificationDetails);
        }
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        setLastEvent(`frameAddRejected, reason ${reason}`);
      });

      sdk.on("frameRemoved", () => {
        setLastEvent("frameRemoved");
        setAdded(false);
        setNotificationDetails(null);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        setLastEvent("notificationsEnabled");
        setNotificationDetails(notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        setLastEvent("notificationsDisabled");
        setNotificationDetails(null);
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      console.log("Calling ready");
      sdk.actions.ready({});

      // Set up a MIPD Store, and request Providers.
      const store = createStore();

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      });
    };
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);



  // Record purchase when transaction is confirmed
  useEffect(() => {
    const recordPurchase = async () => {
      console.log(
        "recordPurchase",
        isConfirmed,
        txHash,
        productDetails.productId
      );
      if (isConfirmed && txHash && productDetails.productId) {
        try {
          const response = await fetch("/api/purchases", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: productDetails.productId,
              txHash: txHash,
              buyerAddress: address,
              referrerFid: productDetails.referrer?.fid,
              referrerName:
                productDetails.referrer?.displayName
            }),
          });

          const data = await response.json();
          console.log("Purchase recorded:", data);
        } catch (error) {
          console.error("Failed to record purchase:", error);
        }
      }
    };

    recordPurchase();
  }, [isConfirmed, txHash, address, productDetails]);

  const {
    switchChain,
    error: switchChainError,
    isError: isSwitchChainError,
    isPending: isSwitchChainPending,
  } = useSwitchChain();

  const handleSwitchChain = () => {
    switchChain({ chainId: baseSepolia.id });
    setAskToSwitchChain(false);
  }

  useEffect(() => {
    handleSwitchChain();
  }, []);

  const handleBuy = async () => {
    if (!productDetails.seller.address) {
      console.error("Seller address is missing");
      return;
    }

    if (chainId !== baseSepolia.id) {
      setAskToSwitchChain(true);
      return;
    }

    // Convert price to USDC units (6 decimals)
    const priceInUSDC = BigInt(Math.floor(productDetails.price * 1_000_000));
    
    // const usdcContractAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const usdcContractAddress =
      process.env.NEXT_PUBLIC_USDC_ADDRESS ||
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    
    // ERC20 transfer function signature: transfer(address,uint256)
    // Function selector: 0xa9059cbb
    const transferFunctionSelector = "0xa9059cbb";
    
    // Encode the recipient address (32 bytes, padded)
    const paddedAddress = productDetails.seller.address.slice(2).padStart(64, '0');
    
    // Encode the amount (32 bytes, padded)
    const paddedAmount = priceInUSDC.toString(16).padStart(64, '0');
    
    // Construct the complete data field
    const data = `${transferFunctionSelector}${paddedAddress}${paddedAmount}`;
    
    console.log("Sending USDC to:", productDetails.seller.address);
    console.log("Amount:", priceInUSDC.toString(), "USDC units");
    
    sendTransaction(
      {
        to: usdcContractAddress as `0x${string}`,
        data: data as `0x${string}`,
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
        },
      }
    );
  };

  const handleReferral = () => {
    console.log("handleReferral", productDetails.referrer?.fid);
    const referralLink = `${window.location.origin}/p/${productDetails.productId}?ref=${context?.user.fid}`;
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
  };
  
  console.log("productDetails", productDetails);

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="max-w-xl mx-auto py-2 px-2">
        <div className="max-w-full h-lvh bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Product Image */}
          <div className="relative h-96 bg-gray-100 overflow-hidden">
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

            {/* Product ID and Referrer */}
            <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
              <div>
                Sold by:{" "}
                <span
                  onClick={() => {
                    sdk.actions.viewProfile({ fid: productDetails.seller.fid });
                  }}
                >
                  {productDetails.seller.displayName}
                </span>
              </div>
              {productDetails.referrer?.displayName &&
                productDetails?.referrer?.fid && (
                  <div className="flex items-center">
                    <span
                      onClick={() => {
                        sdk.actions.viewProfile({
                          fid: productDetails.referrer?.fid ?? 0,
                        });
                      }}
                      className="text-gray-500"
                    >
                      Referral: 10% goes to{" "}
                      {productDetails.referrer.displayName}
                    </span>
                  </div>
                )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleBuy}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium"
              >
                Buy Now
              </button>
              <button
                onClick={handleReferral}
                className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 px-3 rounded text-sm font-medium"
              >
                Referral Link
              </button>
            </div>
            {copySuccess && (
              <div className="mt-2 text-xs text-gray-500">
                Referral link copied to clipboard
              </div>
            )}
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
            {askToSwitchChain && (
              <button
                onClick={handleSwitchChain}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium"
              >
                Please switch to Base Sepolia to purchase this product.
              </button>
            )}
          </div>
        </div>
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
