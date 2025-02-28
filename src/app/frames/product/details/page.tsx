import { Metadata } from "next";
import ProductDetails from "~/components/ProductDetails";
import { getIpfsHashFromBytes } from "~/utils/ifps";
import { getBytesFromHex } from "~/utils/ifps";

const appUrl = process.env.NEXT_PUBLIC_URL;
const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY;

// Function to fetch product data
async function getProductData() {
  try {
    const response = await fetch(`${appUrl}/api/product`, {
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

export async function generateMetadata({ searchParams }: { searchParams: { ref?: string } }): Promise<Metadata> {
  const data = await getProductData();
  const refFid = searchParams?.ref;
  console.log("refFid", refFid);

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
      
      // Add referrer information to product details if available
      if (referrerName) {
        productDetails.referrer = {
          fid: refFid,
          displayName: referrerName,
        };
      }
    } catch (error) {
      console.error("Error parsing product data:", error);
    }
  }

  const frame = {
    version: "next",
    imageUrl: `${appUrl}/frames/product/details/opengraph-image`,
    // imageUrl: productDetails.images[0],
    button: {
      title: "View Details",
      action: {
        type: "launch_frame",
        name: "Product Details",
        url: `${appUrl}/frames/product/details`,
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

export default async function ProductDetailsFrame({ searchParams }: { searchParams: { ref?: string } }) {
  const data = await getProductData();
  const refFid = searchParams?.ref;

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
      
      // Add referrer information to product details if available
      if (referrerName) {
        productDetails.referrer = {
          fid: refFid,
          displayName: referrerName,
        };
      }
      productDetails.productId =
        "0x13fde286c6d1a7508e2e6ca1a9127e0d38d738504cc3216e3e3bb31abf8b71cd";
    } catch (error) {
      console.error("Error parsing product data:", error);
    }
  }

  if (!productDetails) {
    return <div>No product details found</div>;
  }

  return <ProductDetails productDetails={productDetails} />;
}
