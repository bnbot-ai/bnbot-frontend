'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useRouter } from 'next/navigation';
import Image from '@/components/ui/image';
import EthBrand from '@/assets/images/eth-brand-5.avif';
import XIDProfile from '@/components/profile/xid-profile';
import TokenBalanceTable from '@/components/profile/token-balance-table';
import xidABI from '@/contracts/XID';

interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
}

const AuthorProfilePageRetro = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Contract read for XID address lookup

  console.log('userData', userData?.username.toLowerCase());
  console.log('start reading contract');
  const { data: xidAddress, isError } = useReadContract({
    address: process.env.NEXT_PUBLIC_XID_ADDRESS as `0x${string}`,
    abi: xidABI,
    functionName: 'getAddressByUsername',
    args: userData?.username ? [userData.username.toLowerCase()] : undefined,
  });

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const encodedUser = params.get('user');

    if (token && encodedUser) {
      try {
        const decodedUser = JSON.parse(atob(encodedUser));

        localStorage.setItem('accessToken.xid', token);
        localStorage.setItem('userData.xid', JSON.stringify(decodedUser));
        setUserData(decodedUser);
      } catch (error) {
        console.error('Error decoding user data:', error);
      }
    } else {
      // Check local storage for user data
      const storedUserData = localStorage.getItem('userData.xid');
      const storedToken = localStorage.getItem('accessToken.xid');

      if (storedUserData && storedToken) {
        setUserData(JSON.parse(storedUserData));
      } else {
        router.push('/login');
      }
    }

    setIsLoading(false);
  }, [router]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 3xl:px-10">
      {/* Profile Card */}
      <div className="m-auto w-full rounded-3xl text-center shadow-lg md:w-1/2">
        <div className="relative h-48 w-full overflow-hidden rounded-3xl sm:h-32 md:h-48 xl:h-64 2xl:h-72 3xl:h-80">
          <Image
            src={EthBrand}
            placeholder="blur"
            priority
            quality={100}
            className="h-full w-full object-cover"
            alt="Cover Image"
            draggable="false"
          />
        </div>
        <div className="mx-auto flex w-full shrink-0 flex-col md:px-4 xl:px-6 3xl:max-w-[1700px] 3xl:px-12">
          <XIDProfile
            userData={userData}
            xidAddress={xidAddress as `0x${string}`}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Token Balance Table */}
      <div className="mx-auto mt-8 w-full md:w-3/4">
        <TokenBalanceTable
          userData={userData}
          xidAddress={xidAddress as `0x${string}`}
          loading={isLoading}
        />
      </div>
    </div>
  );
};

export default AuthorProfilePageRetro;
