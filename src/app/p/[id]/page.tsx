import { Metadata } from "next";
import ProductUI from "~/components/ProductUI";
import { getIpfsHashFromBytes } from "~/utils/ifps";
import { getBytesFromHex } from "~/utils/ifps";

const appUrl = process.env.NEXT_PUBLIC_URL;
const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY;

// Function to fetch product data
async function getProductData(productId: string) {
  try {
    const response = await fetch(`${appUrl}/api/product?id=${productId}`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching product data:", error);
    return { error: "Failed to fetch product data" };
  }
}

// Function to fetch user profile by FID
async function getUserProfile(fid: string) {
  console.log("fid", fid);
  try {
    const response = await fetch(
      `https://hub.pinata.cloud/v1/userDataByFid?fid=${fid}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    console.log("response", response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("data", data);
    const referrer = data.messages.find(
      (msg: any) => msg.data.userDataBody.type === "USER_DATA_TYPE_USERNAME"
    );
    console.log("referrer", referrer);
    return referrer.data.userDataBody.value;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

// const frame = {
//   version: "next",
//   imageUrl: `${appUrl}/p/opengraph-image`,
//   // imageUrl: productDetails.images[0],
//   button: {
//     title: "View Details",
//     action: {
//       type: "launch_frame",
//       name: "Product Details",
//       url: `${appUrl}/p/`,
//       splashImageUrl: `${appUrl}/splash.png`,
//       splashBackgroundColor: "#f7f7f7",
//     },
//   },
// };

// export const metadata: Metadata = {
//   title: "Product Details",
//   description: "View product details from EAS attestations",
//   openGraph: {
//     title: "Product Details",
//     description: "View product details from EAS attestations",
//   },
//   other: {
//     "fc:frame": JSON.stringify(frame),
//   },
// };

export async function generateMetadata({ 
  params,
  searchParams 
}: { 
  params: { id: string },
  searchParams: { ref?: string } 
}): Promise<Metadata> {
  // Need to await params and searchParams for Next.js App Router
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  
  const productId = resolvedParams.id;
  const refFid = resolvedSearchParams?.ref;
  
  console.log("Generating metadata for product ID:", productId);
  
  const data = await getProductData(productId);

  let ipfsBytesHash = null;
  let productDetails = null;

  // Extract product details from the attestation data
  if (data.data?.attestations?.length > 0) {
    try {
      const attestation = data.data.attestations[0];
      const decodedData = JSON.parse(attestation.decodedDataJson);
      ipfsBytesHash = decodedData[0]?.value?.value;
      const recoveredBytes = getBytesFromHex(ipfsBytesHash);
      const recoveredIpfsHash = getIpfsHashFromBytes(recoveredBytes);
      // fetch the ipfs hash from the ipfs api
      const ipfsResponse = await fetch(`${ipfsGateway}/${recoveredIpfsHash}`);
      productDetails = await ipfsResponse.json();
    } catch (error) {
      console.error("Error parsing product data:", error);
    }
  }

  const frame = {
    version: "next",
    imageUrl: productDetails?.images?.[0] || `${appUrl}/p/opengraph-image`,
    button: {
      title: "View Details",
      action: {
        type: "launch_frame",
        name: "Product Details",
        url: `${appUrl}/p/${productId}${refFid ? `?ref=${refFid}` : ''}`,
        splashImageUrl: `${appUrl}/splash.png`,
        splashBackgroundColor: "#f7f7f7",
      },
    },
  };

  return {
    title: productDetails?.name || "Product Details",
    description: productDetails?.description || "Details for Product",
    openGraph: {
      title: productDetails?.name || "Product Details",
      description: productDetails?.description || "Details for Product",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function ProductDetailsFrame({ 
  searchParams,
  params
}: { 
  searchParams: { ref?: string },
  params: { id: string }
}) {
  // Need to await params and searchParams for Next.js App Router
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  
  const productId = resolvedParams.id;
  const refFid = resolvedSearchParams?.ref;
  
  console.log("Product ID from URL:", productId);
  console.log("Referrer FID:", refFid);

  const data = await getProductData(productId);

  let ipfsBytesHash = null;
  let productDetails = null;
  let referrerName = null;

  // Fetch referrer profile if ref parameter exists
  if (refFid) {
    referrerName = await getUserProfile(refFid);
  }

  // Extract product details from the attestation data
  if (data.data?.attestations?.length > 0) {
    try {
      const attestation = data.data.attestations[0];
      const decodedData = JSON.parse(attestation.decodedDataJson);
      ipfsBytesHash = decodedData[0]?.value?.value;
      const recoveredBytes = getBytesFromHex(ipfsBytesHash);
      const recoveredIpfsHash = getIpfsHashFromBytes(recoveredBytes);
      // fetch the ipfs hash from the ipfs api
      const ipfsResponse = await fetch(`${ipfsGateway}/${recoveredIpfsHash}`);
      productDetails = await ipfsResponse.json();

      productDetails.seller = {
        fid: 16216,
        displayName: "Kyle Kaplan",
      };

      
      // Add referrer information to product details if available
      if (referrerName) {
        productDetails.referrer = {
          fid: refFid,
          displayName: referrerName,
        };
      }
      // Use the product ID from URL parameter instead of hardcoded value
      productDetails.productId = productId;
    } catch (error) {
      console.error("Error parsing product data:", error);
    }
  }

  if (!productDetails) {
    return <div>No product details found</div>;
  }

  return <ProductUI productDetails={productDetails} />;
}
