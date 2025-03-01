import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Get the product ID from the query parameter
    const url = new URL(request.url);
    const productId = url.searchParams.get('id');
    
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }
    
    console.log("Fetching product data for ID:", productId);
    
    const response = await fetch("https://base-sepolia.easscan.org/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query Attestation($where: AttestationWhereInput) {
            attestations(where: $where) {
              id
              attester
              decodedDataJson
              refUID
              time
              schemaId
              data
            }
          }
        `,
        variables: {
          "where": {
            "OR": [
              {
                "AND": [
                  {
                    "refUID": {
                      "equals": productId
                    }
                  },
                  {
                    "schemaId": {
                      "equals": "0x628d5ed6db59ebc4eb9ca9b9cbcdc8e5c3e963114b4f59d9d332fc82c74222cf"
                    }
                  }
                ]
              }
            ]
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching product data:", error);
    return NextResponse.json(
      { error: "Failed to fetch product data" },
      { status: 500 }
    );
  }
} 