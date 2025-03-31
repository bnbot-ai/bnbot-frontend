import cn from '@/utils/cn';
import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import WalletProvider from './shared/wallet-provider';
import { ThemeProvider } from '@/app/shared/theme-provider';
import { QueryProvider } from './shared/query-client-provider';
import DrawersContainer from '@/components/drawer-views/container';

// base css file
import 'overlayscrollbars/overlayscrollbars.css';
import 'swiper/css';
import 'swiper/css/pagination';
import '@/assets/css/scrollbar.css';
import '@/assets/css/globals.css';
import '@/assets/css/range-slider.css';

import { Inter, Roboto, Ubuntu, Roboto_Mono } from 'next/font/google';
import { NotificationProvider } from '@/context/notification-context';
import { Modal } from '@/components/ui/animated-modal';

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BNBOT',
  description: 'BNBOT - AI-powered crypto intelligence on BNB Chain',
  icons: {
    icon: {
      url: '/favicon.ico',
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className={cn('light')} suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1 maximum-scale=1"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* <meta name="apple-mobile-web-app-status-bar-style" content="white" /> */}
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body suppressHydrationWarning>
        <WalletProvider>
          <QueryProvider>
            <ThemeProvider>
              {/* <SettingsButton /> 
              <SettingsDrawer />  */}
              <Suspense fallback={null}>
                {/* <ModalsContainer /> */}
                <DrawersContainer />
              </Suspense>
              <NotificationProvider>
                <Modal>
                  {children}
                  {/* <PWARegister /> */}
                </Modal>
              </NotificationProvider>
            </ThemeProvider>
          </QueryProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
