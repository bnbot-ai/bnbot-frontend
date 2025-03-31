'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import AssetCard from '@/components/boost/mini-boost-card';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useModal } from '@/components/ui/animated-modal';
import { motion } from 'framer-motion';
import { ApolloClient, InMemoryCache, useQuery, gql } from '@apollo/client';

import { NumberTicker } from '@/components/ui/numberTicker';
import Masonry from 'react-masonry-css';

// 创建独立的 Apollo Client 实例
const xassetClient = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_XASSET_GRAPHQL_ENDPOINT,
  cache: new InMemoryCache(),
});

import { XAsset, Tweet } from '@/types';

interface CreateRecord {
  id: string;
  user: string;
  token: string;
  timestamp: string;
}

const GET_XASSETS = gql`
  query GetXAssets {
    xassets(orderBy: deployedAt, orderDirection: desc, first: 100) {
      id
      tweetId
      name
      symbol
      author
      tokenAddress
      maxSupply
      totalSupply
      holderCount
      uri
      lastTradedPrice
      lastTradedAt
      deployedAt
      irysTxId
      owner
      deployer
      createdAt
    }
  }
`;

export default function XAssetPage() {
  const [assets, setAssets] = useState<XAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { showModal } = useModal();
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [shakeLeft, setShakeLeft] = useState(false);
  const [assetCount, setAssetCount] = useState(123123123);
  const [viewCount, setViewCount] = useState(2145627899);

  const { loading, error, data } = useQuery(GET_XASSETS, {
    client: xassetClient,
    onError: (error) => {
      console.error('GraphQL Error:', error);
    },
  });

  // 使用 useMemo 缓存资产列表
  const filteredAssets = useMemo(() => {
    return assets.filter(
      (asset) =>
        asset.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [assets, searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 只有当滚动超过100px后才开始处理显示/隐藏逻辑
      if (currentScrollY > 150) {
        setIsSearchVisible(currentScrollY < lastScrollY);
      } else {
        setIsSearchVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  useEffect(() => {
    if (data?.xassets) {
      setAssets(data.xassets);
    }
  }, [data]);

  // Add this useEffect for number animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAssetCount(prev => prev + Math.floor(Math.random() * 3));
      setViewCount(prev => prev + Math.floor(Math.random() * 1000) + 1000);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Update breakpoint columns to maintain 5 columns
  const breakpointColumnsObj = {
    default: 5, // Always show 5 columns by default
    1600: 5,
    1200: 4,
    900: 3,
    600: 2,
    400: 1,
  };

  return (
    <div className="pb-10">
      <div
        className={`sticky top-0 z-[1] mt-0 bg-white transition-transform duration-300 ${
          isSearchVisible ? 'translate-y-0' : '-translate-y-full'
        } py-2 sm:px-6 lg:px-8 3xl:px-10`}
      >
        <div className="mx-auto w-full px-4 md:px-0">
          <div className="flex items-center justify-between gap-4">
            <div className="w-full md:w-[480px]">
              <div className="flex items-center gap-3">
                <a
                  href="/boost/create"
                  className="flex items-center justify-center rounded-full bg-[#f0b90b] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-110 hover:bg-[#f0b90b] hover:text-black"
                >
                  Create Boost
                </a>
                <div className="relative flex-1">
                  <div className="group relative w-full">
                    <div className="relative w-[70%] md:w-[60%] origin-left transition-all duration-300 ease-in-out group-focus-within:w-[100%] md:group-focus-within:w-[120%] group-focus-within:-translate-y-0.5 group-focus-within:scale-[1.02] group-hover:-translate-y-0.5 group-hover:scale-[1.01]">
                      <input
                        type="text"
                        className="block w-full rounded-full border-0 py-2.5 pl-6 pr-12 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-200 transition-all duration-300 ease-in-out placeholder:text-gray-400 focus:shadow-lg focus:ring-2 focus:ring-inset focus:ring-[#F0B90B] sm:text-base md:py-2"
                        placeholder="Search"
                        onFocus={(e) =>
                          (e.target.placeholder = 'Search Tweet ID and Author')
                        }
                        onBlur={(e) => (e.target.placeholder = 'Search')}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        value={searchQuery}
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                        <MagnifyingGlassIcon className="h-5 w-5 text-[#F0B90B]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-5 text-lg text-black hidden md:flex">
              <div className="">{'Total Rewards:'}</div>
              <div className="">
                $
                <NumberTicker
                  value={assetCount}
                  className="text-gray-700"
                  withCommas={true}
                />
              </div>
              <div className="">{'Total Impressions:'}</div>
              <div className="">
                <NumberTicker
                  value={viewCount}
                  className="text-gray-700"
                  withCommas={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 md:pt-6 sm:px-4 lg:px-4 3xl:px-8 px-4">
        {loading ? (
          // 使用网格布局替代瀑布流
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(10)].map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="card w-full bg-base-100 shadow-md"
              >
                <div className="card-body rounded-2xl border-[1px] border-t border-gray-100 p-3">
                  <div className="mt-1 flex items-center gap-5">
                    <div className="w-full">
                      <div className="skeleton h-4 w-full rounded border-gray-100"></div>
                      <div className="skeleton mt-2 h-4 w-full rounded border-gray-100"></div>
                    </div>
                  </div>
                  <div className="skeleton mt-1 flex h-48 w-48 items-start justify-start overflow-hidden rounded-2xl border-gray-100"></div>
                  <div className="mb-1 mt-2 space-y-2">
                    <div className="skeleton mb-3 h-6 w-full rounded border-gray-100"></div>
                    <div className="skeleton h-4 w-4/5 rounded border-gray-100"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="col-span-full py-10 text-center">
            <p className="text-red-500">
              Error loading assets. Please try again later.
            </p>
          </div>
        ) : (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex w-auto -ml-4"
            columnClassName="pl-4 bg-clip-padding"
          >
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="mb-4 card !z-0 cursor-pointer bg-base-100 shadow-sm will-change-transform backface-visibility-hidden transform-gpu transition-all duration-150 ease-out hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(240,_185,_11,_0.25)]"
              >
                <AssetCard asset={asset} />
              </div>
            ))}
          </Masonry>
        )}
      </div>
    </div>
  );
}
