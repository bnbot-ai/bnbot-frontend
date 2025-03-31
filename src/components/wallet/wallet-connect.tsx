'use client';

// import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAppKit } from '@reown/appkit/react';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { useChainId, useChains } from 'wagmi';
import cn from '@/utils/cn';
import Button from '@/components/ui/button';
import { Menu } from '@/components/ui/menu';
import { Transition } from '@/components/ui/transition';
import ActiveLink from '@/components/ui/links/active-link';
import { ChevronForward } from '@/components/icons/chevron-forward';
import { PowerIcon } from '@/components/icons/power';
import ethLogo from '@/assets/images/logo-eth-color.png';
import { useEffect, useState } from 'react';
import ethereumIcon from '@/assets/images/chain/ethereum.svg'
import arbitrumIcon from '@/assets/images/chain/arbitrum.svg'
import baseIcon from '@/assets/images/chain/base.svg'
import optimismIcon from '@/assets/images/chain/optimism.svg'
import blastIcon from '@/assets/images/chain/blast.webp'
import zksyncIcon from '@/assets/images/chain/zksync.webp'
import scrollIcon from '@/assets/images/chain/scroll.svg'
import polygonIcon from '@/assets/images/chain/polygon.svg'
import bnbIcon from '@/assets/images/chain/bnb-chain.svg'
import avalanceIcon from '@/assets/images/chain/avalanche.svg'

export default function WalletConnect({
  btnClassName,
  anchorClassName,
}: {
  btnClassName?: string;
  anchorClassName?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { address } = useAccount();
  const { open } = useAppKit();
  const { data } = useBalance({
    address,
  });
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const chains = useChains();
  const currentChain = chains.find(chain => chain.id === chainId);
  const balance = data?.formatted;

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

  const handleBuy = async () => {
    await open({
      view: 'OnRampProviders',
    });
  };

  const handleSwap = async () => {
    await open({
      // @ts-ignore
      view: 'Swap',
    });
  };

  const getChainIcon = (chainId: number): string => {
    const iconMap: {[key: number]: string} = {
      1: ethereumIcon.src,
      10: optimismIcon.src,
      8453: baseIcon.src,
      84532: baseIcon.src,
      42161: arbitrumIcon.src,
      11155111: ethereumIcon.src,
      81457: blastIcon.src,
      324: zksyncIcon.src,
      534352: scrollIcon.src,
      137: polygonIcon.src,
      43114: avalanceIcon.src,
      56: bnbIcon.src,
    };
    return iconMap[chainId] || ethereumIcon.src;
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {address ? (
        <div className="z-10 flex items-center gap-3 sm:gap-6 md:mr-0 lg:gap-8">
          <div className="relative flex flex-grow items-center">
            <Menu>
              <Menu.Button className="flex w-full items-center">
                <div className="relative h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-slate-50">
                  <img
                    src={getChainIcon(chainId)}
                    alt="Logo"
                    className="absolute h-full w-full rounded-full object-cover"
                  />
                </div>
                {/* <div className="ml-3 flex-grow rounded-3xl bg-gray-100 px-3 py-2.5 tracking-tighter dark:bg-gray-800">
                  {address.slice(0, 8)}
                  {'...'}
                  {address.slice(address.length - 8)}
                </div> */}
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
                  className={`fixed rounded-3xl bg-white dark:bg-gray-900 ${
                    isMobile 
                      ? 'left-1/2 -translate-x-1/2 -translate-y-[90px] w-[80%] max-w-[320px] shadow-md' 
                      : 'absolute sm:-right-14 -right-20 mr-5 mt-72 w-72 shadow-large origin-top-right'
                  }`}
                >
                  <Menu.Item>
                    <Menu.Item>
                      <div className="border-b border-dashed border-gray-200 px-6 py-5 dark:border-gray-700">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-lg font-medium -tracking-tighter text-gray-600 dark:text-gray-400">
                            Balance
                          </span>
                          <span className="rounded-3xl bg-gray-100 px-2 py-1 text-sm tracking-normal dark:bg-gray-800">
                            {address.slice(0, 6)}
                            {'...'}
                            {address.slice(address.length - 6)}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2 font-medium uppercase tracking-wider text-gray-900 dark:text-white">
                          <span>{balance?.slice(0, 10)} ETH</span>
                          <button
                            className="btn btn-circle btn-outline btn-sm ml-2 w-20 px-1 py-0.5 text-xs font-medium tracking-tighter hover:bg-black md:px-2 md:text-sm"
                            onClick={() => handleBuy()}
                          >
                            Buy
                          </button>
                        </div>

                        <div className="mb-1 mt-3 flex items-center justify-center text-center gap-4">
                          <button
                            onClick={() => open({ view: 'Networks' })}
                            className="flex w-full items-center justify-center text-center gap-2 rounded-full bg-gray-100/50 px-4 py-1.5 border border-gray-200/50 hover:bg-gray-50"
                          >
                            {currentChain ? (
                              <img 
                                src={getChainIcon(currentChain.id)} 
                                alt={currentChain.name || 'Network'} 
                                className="h-5 w-5 rounded-full"
                              />
                            ) : (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-gray-600 dark:text-gray-400"
                              >
                                <path
                                  d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                            <span className="text-sm font-medium text-gray-700">{currentChain?.name || 'Network'}</span>
                          </button>
                        </div>
                      </div>
                    </Menu.Item>
                  </Menu.Item>
                  <Menu.Item>
                    <div className="p-3">
                      <div
                        className="flex cursor-pointer items-center justify-center rounded-3xl px-3 py-2.5 text-center text-sm font-medium text-gray-900 transition hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                        onClick={() => disconnect()}
                      >
                        <div className="flex items-center justify-center gap-3">
                          <PowerIcon />
                          <span className="uppercase">Disconnect</span>
                        </div>
                      </div>
                    </div>
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => open()}
          className={cn('shadow-main hover:shadow-large bg-[#F0B90B] text-white hover:bg-[#F0B90B]/80', btnClassName)}
        >
          Connect
        </Button>
      )}
    </>
  );
}
