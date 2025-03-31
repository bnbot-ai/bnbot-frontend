'use client';

import { Fragment, useEffect, useState } from 'react';
import Logo from '@/components/ui/logo';
import Button from '@/components/ui/button';
import ActiveLink from '@/components/ui/links/active-link';
import { Close } from '@/components/icons/close';
import { useDrawer } from '@/components/drawer-views/context';
import { ChevronDown } from '@/components/icons/chevron-down';
import { MenuItem } from '@/components/ui/collapsible-menu';
import {
  MinimalMenuItems,
  defaultMenuItems,
} from '@/layouts/sidebar/_menu-items';
import { LAYOUT_OPTIONS } from '@/lib/constants';
import { ChevronRight } from '@/components/icons/chevron-right';
import WalletConnect from '@/components/wallet/wallet-connect';
import { XIcon } from '@/components/icons/x-icon';
import { LinkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import ProfileButton from '@/components/xid/profile-button';

const layoutOption = '';
const minimalMenuItems = MinimalMenuItems.map((item) => ({
  name: item.name,
  icon: item.icon,
  href: item.href === '/' ? '/' : item.href,
  ...(item.dropdownItems && {
    dropdownItems: item?.dropdownItems?.map((dropdownItem: any) => ({
      name: dropdownItem.name,
      ...(dropdownItem?.icon && { icon: dropdownItem.icon }),
      href: dropdownItem.href,
      ...(item.dropdownItems && {
        dropdownItems: dropdownItem?.dropdownItems?.map((subItem: any) => ({
          name: subItem.name,
          ...(subItem?.icon && { icon: subItem.icon }),
          href: subItem.href,
        })),
      }),
    })),
  }),
}));

export function MenuItems() {
  return (
    <div className="flex items-center xl:px-4 2xl:px-6 3xl:px-8">
      <ul className="relative flex items-center gap-4 2xl:gap-6">
        {minimalMenuItems.map((item, index) => (
          <Fragment key={'layout' + item.name + index}>
            {item.dropdownItems ? (
              <>
                <li className="group/parent relative">
                  <a
                    href="#"
                    className="flex items-center text-sm font-medium uppercase text-gray-600 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    {item.name}
                    <span className="z-[1] transition-transform duration-200 ltr:ml-3 rtl:mr-3">
                      <ChevronDown />
                    </span>
                  </a>
                  <ul className="invisible absolute right-0 top-[130%] mt-2 w-64 rounded-lg bg-white p-3 opacity-0 shadow-large transition-all group-hover/parent:visible group-hover/parent:top-full group-hover/parent:opacity-100 dark:bg-gray-800 ltr:right-0 rtl:left-0">
                    {item.dropdownItems.map((dropDownItem, index) => (
                      <li
                        className="group relative"
                        key={dropDownItem.name + index}
                      >
                        {dropDownItem.dropdownItems ? (
                          <>
                            <a
                              href="#"
                              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium uppercase text-gray-600 transition hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white"
                            >
                              {dropDownItem.name}
                              <span className="z-[1] -mt-1 transition-transform duration-200 ltr:ml-3 rtl:mr-3">
                                <ChevronRight className="h-3.5 w-3.5" />
                              </span>
                            </a>
                            <ul className="invisible absolute left-[107%] right-0 top-[130%] w-64 rounded-lg bg-white p-3 opacity-0 shadow-large transition-all group-hover:visible group-hover/parent:top-0 group-hover:opacity-100 dark:bg-gray-800 ltr:right-0 rtl:left-0">
                              {dropDownItem.dropdownItems.map(
                                (subMenu: any, index: string) => (
                                  <li key={subMenu.name + index}>
                                    <ActiveLink
                                      href={subMenu.href}
                                      className="block rounded-lg px-3 py-2 text-sm font-medium uppercase !text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 dark:!text-white dark:hover:bg-gray-700/50"
                                      activeClassName="!bg-gray-100 dark:!bg-gray-700 my-1 last:mb-0 first:mt-0 !text-gray-900 dark:!text-white"
                                    >
                                      {subMenu.name}
                                    </ActiveLink>
                                  </li>
                                ),
                              )}
                            </ul>
                          </>
                        ) : (
                          <ActiveLink
                            href={dropDownItem.href}
                            className="block rounded-lg px-3 py-2 text-sm font-medium uppercase !text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 dark:!text-white dark:hover:bg-gray-700/50"
                            activeClassName="!bg-gray-100 dark:!bg-gray-700 my-1 last:mb-0 first:mt-0 !text-gray-900 dark:!text-white"
                          >
                            {dropDownItem.name}
                          </ActiveLink>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              </>
            ) : (
              <li>
                <ActiveLink
                  href={item.href}
                  className="mx-21 px-0.5 text-[13px] font-medium text-gray-500 transition first:ml-0 last:mr-0 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white 2xl:mx-3 2xl:text-sm 3xl:mx-4"
                  activeClassName="!text-black dark:!text-white"
                >
                  {item.name}
                </ActiveLink>
              </li>
            )}
          </Fragment>
        ))}
      </ul>
    </div>
  );
}

interface DrawerMenuProps {
  layoutOption?: string;
  menuItems?: any[];
}

export default function DrawerMenu({
  layoutOption = `/${LAYOUT_OPTIONS.MINIMAL}`,
  menuItems = defaultMenuItems,
}: DrawerMenuProps) {
  const { closeDrawer } = useDrawer();
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();
  const { address } = useAccount();

  useEffect(() => {
    setMounted(true);
    const storedUserData = localStorage.getItem('userData.xid');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  const handleXIDClick = () => {
    router.push('/create');
    closeDrawer();
  };

  const handleSignOut = () => {
    localStorage.removeItem('userData.xid');
    setUserData(null);
    router.push('/login');
  };

  const drawerMenuItems = menuItems.map((item) => ({
    name: item.name,
    icon: item.icon,
    href: item.href === '/' ? '/' : item.href,
    ...(item.dropdownItems && {
      dropdownItems: item?.dropdownItems?.map((dropdownItem: any) => ({
        name: dropdownItem.name,
        ...(dropdownItem?.icon && { icon: dropdownItem.icon }),
        href: dropdownItem.href,
      })),
    }),
  }));

  return (
    <div className="relative w-full max-w-full bg-white dark:bg-dark xs:w-80">
      <div className="flex h-16 items-center justify-between overflow-hidden px-4 py-4">
        <Logo />
        <div className="md:hidden">
          <Button
            title="Close"
            color="white"
            shape="circle"
            variant="transparent"
            size="small"
            onClick={closeDrawer}
          >
            <Close className="h-auto w-2.5" />
          </Button>
        </div>
      </div>

      <div className="custom-scrollbar h-[calc(100%-180px)] overflow-hidden overflow-y-auto">
        <div className="px-4 pb-14 2xl:px-8">
          <div className="mt-4 sm:mt-4">
            {drawerMenuItems?.map((item, index) => (
              <MenuItem
                key={'drawer' + item.name + index}
                name={item.name}
                href={item.href}
                icon={item.icon}
                dropdownItems={item.dropdownItems}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-0 z-10 w-full px-6">
        <div className="flex items-center justify-end gap-3">
          <WalletConnect btnClassName="!h-11" />
          
          {mounted && userData && address && !userData?.xid && (
            <button
              onClick={handleXIDClick}
              className="flex-shrink-0 flex items-center gap-1 rounded-full border border-gray-100 bg-white px-4 py-1.5 text-sm font-medium font-semibold text-gray-600 shadow-main transition-all hover:-translate-y-0.5 hover:shadow-large dark:border-gray-700 dark:bg-light-dark dark:text-white"
            >
              <LinkIcon className="h-5 w-5" />
            </button>
          )}
          
          {mounted && (
            <ProfileButton 
              userData={userData} 
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </div>
    </div>
  );
}
