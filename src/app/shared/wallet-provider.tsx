'use client';

import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { WagmiProvider, CreateConnectorFn } from 'wagmi';
import { arbitrum, mainnet, base, baseSepolia } from '@reown/appkit/networks';
import { walletConnect, coinbaseWallet, injected } from 'wagmi/connectors';
// const initialState = cookieToInitialState(config);

export const projectId = process.env.NEXT_PUBLIC_CRYPTO_PROJECT_ID || '';

const metadata = {
  //optional
  name: 'XID',
  description: 'Start Earning on 𝕏 With XID',
  url: 'https://xid.so',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// create the connectors (delete the ones you don't need)
// const connectors: CreateConnectorFn[] = [];
// connectors.push(walletConnect({ projectId, metadata, showQrModal: false })); // showQrModal must be false
// connectors.push(injected({ shimDisconnect: true }));
// connectors.push(
//   coinbaseWallet({
//     appName: metadata.name,
//     appLogoUrl: metadata.icons[0],
//   }),
// );

const wagmiAdapter = new WagmiAdapter({
  networks: [base, baseSepolia],
  projectId,
  // connectors,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [base, baseSepolia],
  metadata: metadata,
  projectId,
  features: {
    analytics: false,
    email: false,
    socials: [],
    emailShowWallets: true,
  },
  themeMode: 'light',
});

export default function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>{children}</WagmiProvider>
  );
}
