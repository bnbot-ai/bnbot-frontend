'use client';

import React, { useState, useEffect } from 'react';
import { ModalBody, ModalContent } from '@/components/ui/animated-modal';
import { XAsset, Tweet } from '@/types';
import {
  ChatBubbleOvalLeftIcon,
  ArrowPathRoundedSquareIcon,
  HeartIcon,
  EyeIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { XIcon } from '@/components/icons/x-icon';
import { NumberTicker } from '@/components/ui/numberTicker';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  type BaseError,
  useReadContract,
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import abi from '@/contracts/XTweetIDCreator.js';
import { useNotification } from '@/context/notification-context';
import defaultAssetImage from '@/assets/images/xid-logo-black.jpeg';

interface AssetModalProps {
  asset: XAsset | null;
  initialTweet?: Tweet | null;
}

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) {
    return '0';
  }

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(() => {
    // 设置24小时的倒计时（以毫秒为单位）
    return 24 * 60 * 60 * 1000;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          // 时间到了就重置为24小时
          return 24 * 60 * 60 * 1000;
        }
        return prevTime - 16; // 每16ms减少一次
      });
    }, 16);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (60 * 60 * 1000));
    const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
    const ms = milliseconds % 1000;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms
      .toString()
      .padStart(3, '0')}`;
  };

  return (
    <span className="font-mono text-sm tabular-nums">
      {formatTime(timeLeft)}
    </span>
  );
}

// 使用 dangerouslySetInnerHTML 来直接替换文本中的标记
const formatBoostText = (text: string) => {
  // 将 #、@ 和 $ 后的内容替换为带颜色的 HTML
  const formattedText = text.replace(
    /(#|@|\$)([A-Za-z0-9_]+)/g, 
    '<span class="text-[#F0B90B] font-medium">$1$2</span>'
  );
  
  return (
    <div dangerouslySetInnerHTML={{ __html: formattedText }} />
  );
};

export default function AssetModal({ asset, initialTweet }: AssetModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canSetFullscreen, setCanSetFullscreen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [buyPrice, setBuyPrice] = useState<string>('0');
  const { showNotification } = useNotification();

  const {
    data: hash,
    isPending,
    writeContract,
    error: txError,
    status: txStatus,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: hash,
    });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (
      value === '' ||
      (/^\d+$/.test(value) && parseInt(value) > 0 && parseInt(value) <= 1000000)
    ) {
      setAmount(value);
    }
  };

  const { data: price } = useReadContract({
    abi,
    address: process.env.NEXT_PUBLIC_XTWEETID_CREATOR_ADDRESS as `0x${string}`,
    functionName: 'getBuyPriceAfterFee',
    args:
      asset?.tweetId && amount
        ? [
            BigInt(asset.tweetId),
            BigInt(amount) * BigInt(1e18), // 将输入数量乘以 1e18
          ]
        : undefined,
    query: {
      enabled: !!(asset?.tweetId && amount && /^\d+$/.test(amount)),
    },
  });

  useEffect(() => {
    console.log('Debug values:', {
      tweetId: asset?.tweetId,
      amount,
      isEnabled: !!(asset?.tweetId && amount && /^\d+$/.test(amount)),
      contractAddress: process.env.NEXT_PUBLIC_XTWEETID_CREATOR_ADDRESS,
    });
  }, [asset?.tweetId, amount]);

  useEffect(() => {
    console.log('Raw price data:', price);
    if (price && typeof price === 'bigint') {
      const formattedPrice = formatEther(price);
      console.log('formatted price:', formattedPrice);
      setBuyPrice(formattedPrice);
    }
  }, [price]);

  useEffect(() => {
    console.log('Current buyPrice state:', buyPrice);
  }, [buyPrice]);

  useEffect(() => {
    if (txStatus === 'error') {
      const fullErrorMessage =
        (txError as BaseError)?.shortMessage ?? 'Error in transaction';
      const reasonMatch = fullErrorMessage.match(
        /with the following reason:\s*(.*)/,
      );
      const extractedReason = reasonMatch ? reasonMatch[1] : fullErrorMessage;

      showNotification({
        msg: extractedReason,
        type: 'error',
        title: 'Buy Failed',
      });
    } else if (txStatus === 'success') {
      showNotification({
        msg: 'Transaction submitted successfully',
        type: 'success',
        title: 'Success',
      });
    }
  }, [txStatus, txError, showNotification]);

  const handleBuy = async () => {
    if (!asset?.tweetId || !amount) return;

    try {
      writeContract({
        abi,
        address: process.env
          .NEXT_PUBLIC_XTWEETID_CREATOR_ADDRESS as `0x${string}`,
        functionName: 'buy',
        args: [
          BigInt(asset.tweetId),
          BigInt(amount) * BigInt(1e18), // 将输入数量乘以 1e18
        ],
        value:
          price && typeof price === 'bigint' ? price * BigInt(2) : undefined, // 添加类型检查
      });
    } catch (error) {
      console.error('Error buying:', error);
    }
  };

  useEffect(() => {
    setCanSetFullscreen(false);

    const timer = setTimeout(() => {
      setCanSetFullscreen(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [asset?.id, initialTweet]);

  useEffect(() => {
    setTweet(initialTweet || null);
    setCanSetFullscreen(false);
    setAmount('');
    console.log('canSetFullscreen', canSetFullscreen);
  }, [initialTweet, asset?.id]);

  useEffect(() => {
    const fetchTweetInfo = async () => {
      if (!asset?.tweetId) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}/api/v1/x/tweet-info?tweet_id=${asset.tweetId}`,
          {
            headers: {
              'x-api-key': process.env.NEXT_PUBLIC_X_API_KEY || '',
            },
          },
        );

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data.code === 1 && data.data?.data?.tweetResult?.result) {
          const tweetResult = data.data.data.tweetResult.result;
          const legacy = tweetResult.legacy;
          const user = tweetResult.core.user_results.result;

          setTweet((prevTweet) => {
            if (!prevTweet) return null;
            return {
              ...prevTweet,
              author: {
                ...prevTweet.author,
                followers_count: parseInt(user.legacy.followers_count, 10),
              },
              likes: legacy.favorite_count,
              retweets: legacy.retweet_count,
              replies: legacy.reply_count,
              quotes: legacy.quote_count,
              views_count: parseInt(tweetResult.views.count, 10),
            };
          });
        }
      } catch (error) {
        console.error('Error fetching tweet info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (initialTweet) {
      fetchTweetInfo();
    }
  }, [asset?.tweetId, initialTweet]);

  if (!asset || !tweet) return null;

  return (
    <div className="mx-auto w-full max-w-7xl sm:px-4">
      <ModalBody className="rounded-lg bg-white shadow-xl sm:m-4">
        <ModalContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <div className="flex w-full flex-col justify-between space-y-4 rounded-xl border border-gray-100 p-3 pb-2 md:w-1/2">
              <div className="overflow-y-auto md:h-[400px]">
                <div className="flex h-full flex-col">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={tweet.author.image}
                        alt={tweet.author.name}
                        className="h-10 w-10 rounded-full shadow-xl md:h-11 md:w-11"
                      />
                      <div className="flex flex-1 items-start justify-between leading-3">
                        <div>
                          <div className="flex items-center gap-1">
                            <h4 className="text-xs font-bold md:text-sm">
                              {tweet.author.name}
                            </h4>
                            <p className="text-xs text-gray-500 md:text-sm">
                              ·{' '}
                              {new Date(tweet.created_at).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                },
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <p className="text-xs md:text-sm">
                              @{tweet.author.screen_name}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`https://x.com/${tweet.author.screen_name}/status/${asset.tweetId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          <XIcon className="h-5 w-5" />
                        </a>
                      </div>
                    </div>

                    <p className="!mt-1.5 line-clamp-4 text-sm !leading-[1.5] md:text-md">
                      {tweet.text.split(/(\s+)/).map((part, index) => {
                        if (part.startsWith('http')) {
                          return null;
                        }
                        if (part.startsWith('@')) {
                          const username = part.substring(1);
                          return (
                            <a
                              key={index}
                              href={`https://x.com/${username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1DA1F2] hover:underline"
                            >
                              {part}
                            </a>
                          );
                        }
                        return part;
                      })}
                    </p>

                    {tweet.media && (
                      <div className="!mt-1.5 h-fit w-fit overflow-hidden rounded-xl border border-[1px] border-gray-200">
                        {tweet.media.videos && tweet.media.videos.length > 0 ? (
                          <video
                            controls
                            autoPlay
                            playsInline
                            disablePictureInPicture
                            controlsList="nodownload noplaybackrate"
                            poster={tweet.media.videos[0].media_url_https}
                            className="h-[200px] w-[320px] bg-black object-cover [&::-webkit-media-controls-mute-button]:hidden [&::-webkit-media-controls-volume-slider]:hidden"
                          >
                            <source
                              src={tweet.media.videos[0].large_url}
                              type="video/mp4"
                            />
                          </video>
                        ) : tweet.media.images &&
                          tweet.media.images.length > 0 ? (
                          <>
                            {isFullscreen && (
                              <div
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
                                onClick={() => setIsFullscreen(false)}
                              >
                                <button
                                  className="absolute right-4 top-4 rounded-full p-2 text-white transition-colors hover:bg-white/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsFullscreen(false);
                                  }}
                                >
                                  <XMarkIcon className="h-6 w-6" />
                                </button>
                                <img
                                  src={tweet.media.images[0].media_url_https}
                                  alt="Tweet media"
                                  className="max-w-screen max-h-screen object-contain"
                                  onClick={(e) => e.stopPropagation()}
                                  onError={(e) => {
                                    e.currentTarget.src = defaultAssetImage.src;
                                  }}
                                />
                              </div>
                            )}
                            <div className="h-[220px] w-[220px] bg-black">
                              <img
                                src={tweet.media.images[0].media_url_https}
                                alt="Tweet media"
                                className="h-[220px] w-[220px] cursor-pointer bg-black object-cover"
                                onClick={() => {
                                  if (canSetFullscreen) {
                                    setIsFullscreen(true);
                                  }
                                }}
                                onError={(e) => {
                                  e.currentTarget.src = defaultAssetImage.src;
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="h-[220px] w-[220px] bg-black">
                            <img
                              src={defaultAssetImage.src}
                              alt="Default media"
                              className="h-[220px] w-[220px] cursor-pointer bg-black object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto border-t border-gray-100 pt-2">
                <div className="flex w-full justify-between text-xs text-gray-500 md:text-sm">
                  <div className="flex items-center text-xs">
                    <ChatBubbleOvalLeftIcon className="mr-1 h-4 w-4 md:h-5 md:w-5" />
                    <span className="mt-0.5">
                      {formatNumber(tweet?.replies || 0)}
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <ArrowPathRoundedSquareIcon className="mr-1 h-4 w-4 md:h-5 md:w-5" />
                    <span className="mt-0.5">
                      {formatNumber(tweet?.retweets || 0)}
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <HeartIcon className="mr-1 h-4 w-4 md:h-5 md:w-5" />
                    <span className="mt-0.5">
                      {formatNumber(tweet?.likes || 0)}
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <EyeIcon className="mr-1 h-4 w-4 md:h-5 md:w-5" />
                    <span className="mt-0.5">
                      {formatNumber(tweet?.views_count || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col space-y-2 rounded-xl px-2 md:w-1/2">
              <div className="mb-6">
                <div className="mb-2 mt-2 flex items-center justify-between">
                  <p className="text-md font-medium">Boost Info</p>
                  <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1">
                    <span className="relative flex h-3 w-3 flex-shrink-0 items-center justify-center">
                      <span className="absolute h-3 w-3 rounded-full bg-[#f0b90b]/20" />
                      <span className="blink relative block h-1.5 w-1.5 rounded-full bg-[#f0b90b]" />
                    </span>
                    <span className="text-xs text-gray-600">AI Monitoring</span>
                  </div>
                </div>
                <div className="flex min-h-[8rem] mt-3 items-start rounded-xl bg-gray-100/50 p-3 text-sm text-gray-600">
                  {formatBoostText("带上 #BNBOT 标签，并 @BNBOT , 瓜分1000 $USDT")}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>Remaining Time</div>
                  <div>
                    <CountdownTimer />
                  </div>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Remaining Rewards</p>
                  <p className="text-sm font-medium">
                    {formatNumber(
                      asset?.holderCount ? Number(asset.holderCount) : 0,
                    )}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Total Reward</p>
                  <p className="text-sm font-medium">${formatNumber(1000)}</p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="text-sm text-gray-600">claim people:</div>
                  <div>10000</div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>Quote Tweet</div>
                  <div>
                    <a
                      href={`https://twitter.com/intent/tweet?text=Say%20something...%0A%23StarkLink%20%40Fanscoin%0A%0A&url=https://x.com/${tweet.author.screen_name}/status/${asset.tweetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button className="rounded-full bg-[#f0b90b] px-4 py-2 text-white transition-all duration-300 hover:scale-110 hover:bg-[#f0b90b] hover:text-black">
                        Quote
                      </button>
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>Leave Comments</div>
                  <div>
                    <a
                      href={`https://twitter.com/intent/tweet?text=%23StarkLink%20%40jackleeio&in_reply_to=${asset.tweetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button className="rounded-full bg-[#f0b90b] px-4 py-2 text-white transition-all duration-300 hover:scale-110 hover:bg-[#f0b90b] hover:text-black">
                        Comment
                      </button>
                    </a>
                  </div>
                </div>
              </div>

              {amount && (
                <div className="mt-6 flex items-center text-base text-gray-600">
                  <span>Price: </span>
                  {price && typeof price === 'bigint' ? (
                    <span className="ml-2">
                      {Number(buyPrice).toFixed(8)} ETH
                    </span>
                  ) : (
                    <span className="ml-2">Loading...</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </ModalContent>
      </ModalBody>
    </div>
  );
}
