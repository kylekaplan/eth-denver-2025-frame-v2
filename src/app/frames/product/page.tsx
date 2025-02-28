import { Metadata } from "next";
import App from "~/app/app";

const appUrl = process.env.NEXT_PUBLIC_URL;

const frame = {
  version: "next",
  imageUrl: `${appUrl}/frames/product/opengraph-image`,
  button: {
    title: "View Product",
    action: {
      type: "launch_frame",
      name: "Product Details",
      url: `${appUrl}/frames/product/`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const metadata: Metadata = {
  title: "Product Details",
  description: "View product details from EAS attestations",
  openGraph: {
    title: "Product Details",
    description: "View product details from EAS attestations",
  },
  other: {
    "fc:frame": JSON.stringify(frame),
  },
};

export default function ProductFrame() {
  // return <App title={"Product Details"} />;
  return <h1>Product Details</h1>;
} 