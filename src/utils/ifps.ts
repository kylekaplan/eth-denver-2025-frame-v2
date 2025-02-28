export const getBytesFromHex = (hex: string): Uint8Array => {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;

  // Create a new Uint8Array with the correct length
  const bytes = new Uint8Array(cleanHex.length / 2);

  // Convert each pair of hex characters to a byte
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }

  return bytes;
};

// Convert bytes back to IPFS hash string
export const getIpfsHashFromBytes = (bytes: Uint8Array): string => {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
};
