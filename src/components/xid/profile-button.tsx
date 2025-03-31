'use client';

import { useState, useRef, useEffect } from 'react';
import { XIcon } from '@/components/icons/x-icon';
import { useRouter } from 'next/navigation';
import { useDrawer } from '@/components/drawer-views/context';
import { Menu } from '@/components/ui/menu';
import { Transition } from '@/components/ui/transition';
import { PowerIcon } from '@/components/icons/power';
import { UserIcon, CreditCardIcon, WalletIcon, SparklesIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface ProfileButtonProps {
  userData: any;
  onSignOut?: () => void;
}

export default function ProfileButton({ userData, onSignOut }: ProfileButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const { closeDrawer } = useDrawer();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigateTo = (path: string) => {
    router.push(path);
    closeDrawer();
  };

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
    // 默认登出行为
    localStorage.removeItem('userData.xid');
    router.push('/login');
    closeDrawer();
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative">
      <Menu>
        <Menu.Button className="relative h-11 w-11 flex-shrink-0 cursor-pointer overflow-hidden rounded-full transition-all hover:-translate-y-0.5">
          {userData?.avatar ? (
            <img
              src={userData.avatar.replace('_normal', '_200x200')}
              alt={userData.name}
              className="h-full w-full object-cover rounded-full"
              draggable="false"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
              <XIcon className="relative h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
          )}
        </Menu.Button>
        <Transition
          enter="ease-out duration-200"
          enterFrom="opacity-0 translate-y-4"
          enterTo="opacity-100 translate-y-0"
          leave="ease-in duration-100"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-4"
        >
          <Menu.Items
            className={`fixed rounded-3xl bg-white dark:bg-gray-900 z-20 ${
              isMobile 
                ? 'left-1/2 -translate-x-[95px] -translate-y-[180px] w-[70%] max-w-[280px] shadow-md' 
                : 'absolute sm:-right-6 -right-6 mr-4 w-48 shadow-large origin-top-right'
            }`}
          >
            <Menu.Item>
              <div className="px-5 pb-0 pt-4">
                <div className="flex items-center justify-between gap-0">
          
                  {userData?.username && (
                    <span className="rounded-3xl bg-gray-100 px-4 py-1 text-xs tracking-normal dark:bg-gray-800">
                     @{userData.username}
                    </span>
                  )}
                </div>
                {userData?.xid && (
                  <div className="mt-0 flex items-center gap-2 font-medium tracking-wider text-gray-900 dark:text-white">
                    <span className="text-sm">XID: {userData.xid}</span>
                  </div>
                )}
              </div>
            </Menu.Item>
            <Menu.Item>
              <div className="p-2">
                <div
                  className="flex cursor-pointer items-center rounded-3xl px-3 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                  onClick={() => navigateTo('/balance')}
                >
                  <div className="flex items-center gap-3">
                    <WalletIcon className="h-4 w-4" />
                    <span>Rewards</span>
                  </div>
                </div>
                <div
                  className="flex cursor-pointer items-center rounded-3xl px-3 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                  onClick={() => navigateTo('/credits')}
                >
                  <div className="flex items-center gap-3">
                    <SparklesIcon className="h-4 w-4" />
                    <span>Credits</span>
                  </div>
                </div>
                <div
                  className="flex cursor-pointer items-center rounded-3xl px-3 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                  onClick={() => navigateTo('/tasks')}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardDocumentListIcon className="h-4 w-4" />
                    <span>Created Tasks</span>
                  </div>
                </div>
                <div
                  className="flex cursor-pointer items-center rounded-3xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-gray-50 dark:text-red-400 dark:hover:bg-gray-800"
                  onClick={handleSignOut}
                >
                  <div className="flex items-center gap-3">
                    <PowerIcon className="h-4 w-4" />
                    <span>Sign out</span>
                  </div>
                </div>
              </div>
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}