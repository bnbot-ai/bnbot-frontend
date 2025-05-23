'use client';

import { Fragment, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Transition } from '@/components/ui/transition';
import { DRAWER_VIEW, useDrawer } from '@/components/drawer-views/context';
import { useLayout } from '@/lib/hooks/use-layout';
import { LAYOUT_OPTIONS } from '@/lib/constants';
import { defaultMenuItems } from '@/layouts/sidebar/_menu-items';

// dynamic imports
const Sidebar = dynamic(() => import('@/layouts/sidebar/_default'));
// const DrawerFilters = dynamic(() => import('@/components/search/filters'));
const DrawerMenu = dynamic(() => import('@/layouts/sidebar/_layout-menu'));
// const PreviewContent = dynamic(
//   () => import('@/components/create-nft/nft-preview-content')
// );

function renderDrawerContent(view: DRAWER_VIEW | string) {
  switch (view) {
    case 'DEFAULT_SIDEBAR':
      return <Sidebar />;
    case 'RETRO_SIDEBAR':
      return (
        <Sidebar
          layoutOption={`/${LAYOUT_OPTIONS.RETRO}`}
          menuItems={defaultMenuItems}
        />
      );
    case 'CLASSIC_SIDEBAR':
      return (
        <DrawerMenu
          layoutOption={`/${LAYOUT_OPTIONS.CLASSIC}`}
          menuItems={defaultMenuItems}
        />
      );
    // case 'DRAWER_SEARCH':
    //   return <DrawerFilters />;
    // case 'DRAWER_PREVIEW_NFT':
    //   return <PreviewContent />;
    default:
      return <DrawerMenu />;
  }
}

export default function DrawersContainer() {
  const layoutOptions = Object.values(LAYOUT_OPTIONS);
  const pathname = usePathname();
  const layoutSegmentFromURL = pathname!.split('/')[1];
  const searchParams = useSearchParams();
  const { view, isOpen, closeDrawer } = useDrawer();
  const { setLayout } = useLayout();

  // set initial layout on component mount
  useEffect(() => {
    const initialLayout = layoutOptions.find(
      (layout) => layout === layoutSegmentFromURL
    );
    setLayout(() => initialLayout ?? layoutOptions[0]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-40 overflow-hidden"
        onClose={closeDrawer}
      >

        <Transition.Child
          as={Fragment}
          // enter="transform transition ease-out duration-100"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          // leave="transform transition ease-in duration-100"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <div className="fixed inset-y-0 left-0 flex w-full max-w-full xs:w-auto">
            {view && renderDrawerContent(view)}
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}
