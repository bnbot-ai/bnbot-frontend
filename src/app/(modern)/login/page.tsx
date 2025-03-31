'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { fadeInBottom } from '@/lib/framer-motion/fade-in-bottom';
import XLogin from '@/components/login/x-login';
import Image from '@/components/ui/image';

import EthBrand from '@/assets/images/eth-brand-6.avif';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const Login: React.FC = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 检查本地存储中的用户数据
    const userData = localStorage.getItem('userData.xid');
    const token = localStorage.getItem('accessToken.xid');

    if (userData && token) {
      const parsedUserData = JSON.parse(userData);
      if (parsedUserData && token) {
        router.push('/balance');
      }
    }
  }, [router]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="m-auto mt-32 w-full px-4 text-center sm:px-6 md:mt-10 md:w-1/2 lg:px-8 3xl:px-10">
      <div className="relative mx-auto mt-10 h-24 w-full max-w-xs overflow-hidden rounded-lg sm:h-30 md:h-32 xl:h-36 2xl:h-48 3xl:h-60 mb-5">
        {/* <Image
          src={EthBrand}
          placeholder="blur"
          priority
          quality={100}
          className="animate-float h-full w-full object-contain"
          alt="Cover Image"
        /> */}
        <video
          src="https://video.twimg.com/amplify_video/1902617401205911602/vid/avc1/752x720/1kPE84zLO1Ok0JlC.mp4?tag=16"
          autoPlay
          muted
          className="absolute inset-0 h-full w-full object-cover"
          onEnded={(e) => {
            const video = e.target as HTMLVideoElement;
            let currentTime = video.duration;
            
            // 创建倒放动画
            const reverseInterval = setInterval(() => {
              if (currentTime <= 0) {
                // 倒放结束，清除定时器并重新正向播放
                clearInterval(reverseInterval);
                video.currentTime = 0;
                video.play();
                return;
              }
              
              // 每次减少一小段时间来模拟倒放
              currentTime -= 0.1;  // 可以调整这个值来改变倒放速度
              video.currentTime = currentTime;
            }, 30); // 可以调整间隔来改变倒放的流畅度
          }}
        />
      </div>
      <div className="mx-auto flex w-full shrink-0 flex-col md:px-4 xl:px-6 3xl:max-w-[1700px] 3xl:px-12">
        <div className="text-center">
          {/* <h1 className="text-3xl">Your X web3 username</h1> */}
          <h5 className="m-auto w-full text-sm font-medium md:w-1/2">
            Unlock the Power of{' '}
            <span className="text-[#f0b90b]">BNBOT</span>
          </h5>
        </div>
        <div className="mx-auto w-full max-w-lg rounded-lg bg-white p-5 pt-4 dark:bg-light-dark xs:p-6 xs:pt-5">
          <AnimatePresence mode={'wait'}>
            <motion.div
              initial="exit"
              animate="enter"
              exit="exit"
              variants={fadeInBottom('easeIn', 0.25)}
            >
              <XLogin />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Login;
