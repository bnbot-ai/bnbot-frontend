'use client';

import Image from '@/components/ui/image';
import AnchorLink from '@/components/ui/links/anchor-link';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import { useIsDarkMode } from '@/lib/hooks/use-is-dark-mode';
import { useLayout } from '@/lib/hooks/use-layout';
import lightLogo from '@/assets/images/logo.svg';
import xLogo from '@/assets/images/logo-x-white.png';
import darkLogo from '@/assets/images/logo-white.svg';
import xidLogo from '@/assets/images/xid-new-logo-1.svg';
import routes from '@/config/routes';
import { LAYOUT_OPTIONS } from '@/lib/constants';
import cn from '@/utils/cn';
import bnbRobotsLogo from '@/assets/images/bnb-robots-logo.svg';

interface LogoPropTypes {
  className?: string;
}

export default function Logo({ className }: LogoPropTypes) {
  const { layout } = useLayout();
  const isMounted = useIsMounted();
  const { isDarkMode } = useIsDarkMode();
  return (
    isMounted && (
      <AnchorLink
        // href={{
        //   pathname:
        //     routes.create + (layout === LAYOUT_OPTIONS.MODERN ? '' : layout),
        // }}
        href="https://about.xid.so"
        className={cn('flex w-28 items-center outline-none sm:w-48', className)}
      >
        <span className="relative flex items-end overflow-hidden">
          <Image
            src={xidLogo}
            alt="XID Logo"
            height={42}
            priority
            className="block md:hidden"
            draggable="false"
          />
          {/* <Image
            src={bnbRobotsLogo}
            alt="BNB Robots Logo"
            height={44}
            priority
            className="hidden md:block"
            draggable="false"
          /> */}
          <div className="text-2xl font-bold text-[#f0b90b]">BNBOT</div>
          <span className="ml-1 rounded-md bg-gray-100/50 px-1.5 py-0.5 text-[10px] font-semibold text-[#f0b90b]">
            beta
          </span>
        </span>
      </AnchorLink>
    )
  );
}
