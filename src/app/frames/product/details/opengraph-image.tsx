import { ImageResponse } from "next/og";

export const alt = "Farcaster Frames V2 Demo";
export const size = {
  width: 600,
  height: 400,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col justify-center items-center relative bg-white">
        <h1 className="text-xl text-black font-bold text-center mb-2">
          ACME MUG
        </h1>
          <span className="text-lg font-semibold text-green-600">
            $15.00
          </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
