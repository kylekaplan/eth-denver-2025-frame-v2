import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Purchase schema
export type Purchase = {
  id: string;
  productId: string;
  txHash: string;
  timestamp: number;
  buyerAddress: string;
  referrerFid?: number;
  referrerName?: string;
};

// GET handler to retrieve purchase history
export async function GET() {
  try {
    // Get all purchase keys
    const purchaseKeys = await redis.keys("purchase:*");
    
    if (!purchaseKeys.length) {
      return NextResponse.json({ purchases: [] });
    }
    
    // Get all purchases
    const purchases = await Promise.all(
      purchaseKeys.map(async (key) => {
        const purchase = await redis.get(key);
        return purchase;
      })
    );
    
    // Sort purchases by timestamp (newest first)
    const sortedPurchases = purchases
      .filter(Boolean)
      .sort((a: any, b: any) => b.timestamp - a.timestamp);
    
    return NextResponse.json({ purchases: sortedPurchases });
  } catch (error) {
    console.error("Error retrieving purchases:", error);
    return NextResponse.json(
      { error: "Failed to retrieve purchases" },
      { status: 500 }
    );
  }
}

// POST handler to record a new purchase
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, txHash, buyerAddress, referrerFid, referrerName } = body;

    // Validate required fields
    if (!productId || !txHash || !buyerAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create purchase record
    const timestamp = Date.now();
    const id = `${txHash.substring(0, 10)}-${timestamp}`;
    
    const purchase: Purchase = {
      id,
      productId,
      txHash,
      timestamp,
      buyerAddress,
      ...(referrerFid && { referrerFid: Number(referrerFid) }),
      ...(referrerName && { referrerName }),
    };

    // Store in Redis
    await redis.set(`purchase:${id}`, purchase);

    // Track referrals if applicable
    if (referrerFid) {
      await redis.sadd(`referrals:${referrerFid}`, id);
    }

    return NextResponse.json({ success: true, purchase });
  } catch (error) {
    console.error("Error recording purchase:", error);
    return NextResponse.json(
      { error: "Failed to record purchase" },
      { status: 500 }
    );
  }
} 