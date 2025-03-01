import { createConfig, http, WagmiProvider } from "wagmi";
import { base, baseSepolia, degen, mainnet, optimism, optimismSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

export const config = createConfig({
  chains: [base, baseSepolia, optimism, optimismSepolia, mainnet, degen],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [optimism.id]: http(),
    [optimismSepolia.id]: http(),
    [mainnet.id]: http(),
    [degen.id]: http(),
  },
  connectors: [farcasterFrame()],
});

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
