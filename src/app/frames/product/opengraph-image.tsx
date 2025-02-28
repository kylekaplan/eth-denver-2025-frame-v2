import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Product Details";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  // Fetch product data from our API
  const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/product`, {
    next: { revalidate: 60 }, // Revalidate every 60 seconds
  });
  
  let productData = { name: "Loading product..." };
  
  if (response.ok) {
    const data = await response.json();
    // Extract product details from the attestation data
    if (data.data?.attestations?.length > 0) {
      try {
        const attestation = data.data.attestations[0];
        const decodedData = JSON.parse(attestation.decodedDataJson);
        productData = {
          name: decodedData[0]?.value?.value || "Product Name",
        };
      } catch (error) {
        console.error("Error parsing product data:", error);
      }
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#f7f7f7",
          color: "#1f2937",
          fontFamily: "sans-serif",
          padding: "40px",
        }}
      >
        <h1 style={{ fontSize: 60, margin: 0 }}>Product Details</h1>
        <p style={{ fontSize: 40, margin: "20px 0" }}>{productData.name}</p>
      </div>
    ),
    {
      ...size,
    }
  );
} 