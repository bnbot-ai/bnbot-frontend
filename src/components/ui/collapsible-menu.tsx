'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import cn from '@/utils/cn';
import { motion } from 'framer-motion';
import { useMeasure } from '@/lib/hooks/use-measure';
import ActiveLink from '@/components/ui/links/active-link';
import { ChevronDown } from '@/components/icons/chevron-down';

type MenuItemProps = {
  name?: string;
  icon: React.ReactNode;
  href: string;
  dropdownItems?: DropdownItemProps[];
  isActive?: boolean;
};

type DropdownItemProps = {
  name: string;
  href: string;
};

export function MenuItem({
  name,
  icon,
  href,
  dropdownItems,
  isActive,
}: MenuItemProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [ref, { height }] = useMeasure<HTMLUListElement>();
  const isChildrenActive =
    dropdownItems && dropdownItems.some((item) => item.href === pathname);
  useEffect(() => {
    if (isChildrenActive) {
      setIsOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="mb-2 min-h-[48px] list-none last:mb-0">
      {dropdownItems?.length ? (
        <>
          <div
            className={cn(
              'relative flex h-12 cursor-pointer items-center justify-between whitespace-nowrap  rounded-lg px-4 text-sm transition-all',
              isChildrenActive
                ? 'text-white'
                : 'text-gray-500 hover:text-brand dark:hover:text-white',
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="z-[1] flex items-center ltr:mr-3 rtl:ml-3">
              {/* <span className={cn('ltr:mr-3 rtl:ml-3')}>{icon}</span> */}
              {name}
            </span>
            <span
              className={`z-[1] transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            >
              <ChevronDown />
            </span>

            {isChildrenActive && (
              <motion.span
                className={cn(
                  'absolute bottom-0 left-0 right-0 h-full w-full rounded-lg bg-brand opacity-0 shadow-large transition-opacity',
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </div>

          <div
            style={{
              height: isOpen ? height : 0,
            }}
            className="ease-[cubic-bezier(0.33, 1, 0.68, 1)] overflow-hidden transition-all duration-[350ms]"
          >
            <ul ref={ref}>
              {dropdownItems.map((item, index) => (
                <li className="first:pt-2" key={index}>
                  <ActiveLink
                    href={item.href}
                    className="flex items-center rounded-lg p-3 text-sm text-gray-500 transition-all before:h-1 before:w-1 before:rounded-full before:bg-gray-500 hover:text-brand dark:hover:text-white ltr:pl-6 before:ltr:mr-5 rtl:pr-6 before:rtl:ml-5"
                    activeClassName="!text-brand dark:!text-white dark:before:!bg-white before:!bg-brand before:!w-2 before:!h-2 before:-ml-0.5 before:ltr:!mr-[18px] before:rtl:!ml-[18px] !font-medium"
                  >
                    {item.name}
                  </ActiveLink>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <ActiveLink
          href={href}
          className={cn(
            'font-bolder relative flex h-12 items-center whitespace-nowrap rounded-3xl rounded-none px-4 text-base text-gray-900 transition-all hover:text-slate-200 dark:hover:text-white',
            {
              'bg-black': isActive,
            },
          )}
          activeClassName="!text-white"
        >
          <span className="relative z-[1]">{name}</span>

          {href === pathname && (
            <motion.span
              className={cn(
                'absolute bottom-0 left-0 right-0 h-full w-full rounded-3xl bg-black  opacity-0 shadow-large transition-opacity',
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </ActiveLink>
      )}
    </div>
  );
}
