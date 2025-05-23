'use client';

import React from 'react';
import Image from '@/components/ui/image';
import AnchorLink from '@/components/ui/links/anchor-link';
import routes from '@/config/routes';
import Button from '@/components/ui/button';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import { useIsDarkMode } from '@/lib/hooks/use-is-dark-mode';
import { LAYOUT_OPTIONS } from '@/lib/constants';
import { useLayout } from '@/lib/hooks/use-layout';
import MinimalLayout from '@/layouts/minimal/layout';

const Layout = ({ children }: React.PropsWithChildren) => {
  return <MinimalLayout>{children}</MinimalLayout>;
};

const NotFoundPage = () => {
  const { layout } = useLayout();
  const isMounted = useIsMounted();
  const { isDarkMode } = useIsDarkMode();
  return (
    <Layout>
      <div className="flex max-w-full flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 3xl:px-10">
        {/* <div className="relative aspect-[257/173] w-52 max-w-full sm:w-[400px] xl:w-[450px] 3xl:w-[500px]">
          {isMounted && !isDarkMode && (
            <></>
            // <Image src={ErrorLightImage} alt="404 Error" priority />
          )}
          {isMounted && isDarkMode && (
            <></>
            // <Image src={ErrorDarkImage} alt="404 Error" priority />
          )}
        </div> */}

        <h2 className="mb-2 mt-5 text-base font-medium uppercase tracking-wide text-gray-900 dark:text-white sm:mb-4 sm:mt-24 sm:text-xl 3xl:mt-12 3xl:text-2xl">
          Error! Page Not Found
        </h2>
        <p className="mb-4 max-w-full text-xs leading-loose tracking-tight text-gray-600 dark:text-gray-400 sm:mb-6 sm:w-[430px] sm:text-sm sm:leading-loose">
          Sorry, the page you are looking for might be renamed, removed, or
          might never exist.
        </p>
        {isMounted && (
          <AnchorLink
            href={{
              pathname:
                layout === LAYOUT_OPTIONS.MODERN ? '/' : routes.create + layout,
            }}
          >
            <Button shape="pill">Back to Home</Button>
          </AnchorLink>
        )}
      </div>
    </Layout>
  );
};

export default NotFoundPage;
