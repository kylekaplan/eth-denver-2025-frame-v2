import { Metadata } from "next";
import App from "./app";
import Link from "next/link";

const appUrl = process.env.NEXT_PUBLIC_URL;

const frame = {
  version: "next",
  imageUrl: `${appUrl}/opengraph-image`,
  button: {
    title: "Launch Frame",
    action: {
      type: "launch_frame",
      name: "Farcaster Frames v2 Demo",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Farcaster Frames v2 Demo",
    openGraph: {
      title: "Farcaster Frames v2 Demo",
      description: "A Farcaster Frames v2 demo app.",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return (
    <div>
      <App />
      <div className="w-[300px] mx-auto py-2 px-2 mt-4">
        <h2 className="text-xl font-bold mb-4">Available Frames</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/frames/hello" className="text-blue-500 hover:underline">
              Hello Frame
            </Link>
          </li>
          <li>
            <Link href="/frames/token" className="text-blue-500 hover:underline">
              Token Frame
            </Link>
          </li>
          <li>
            <Link href="/frames/product" className="text-blue-500 hover:underline">
              Product Frame
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
