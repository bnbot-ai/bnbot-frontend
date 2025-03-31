'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';

import TweetCard from '@/components/boost/tweet-card';

import { WebUploader } from '@irys/web-upload';
import { WebBaseEth, WebEthereum } from '@irys/web-upload-ethereum';
import { EthersV6Adapter } from '@irys/web-upload-ethereum-ethers-v6';
import { ethers } from 'ethers';
import { Eip1193Provider } from 'ethers';
import XTweetIDCreatorABI from '@/contracts/XTweetIDCreator';
import Step from '@/components/boost/step';
import { useNotification } from '@/context/notification-context';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  type BaseError,
} from 'wagmi';

interface TweetInfo {
  id: string;
  text: string;
  created_at: string;
  likes: number;
  retweets: number;
  quotes: number;
  replies: number;
  views_count: number;
  bookmarks: number;
  lang: string;
  author: {
    rest_id: string;
    name: string;
    screen_name: string;
    image: string;
    followers_count: number;
    blue_verified: boolean;
  };
  media?: {
    images?: Array<{
      media_url_https: string;
    }>;
    videos?: Array<{
      media_url_https: string;
      thumb_url: string;
      large_url: string;
      aspect_ratio?: [number, number];
      duration_millis?: number;
    }>;
  };
}

function extractIdFromLink(url: string): string | null {
  const regex = /\/status\/(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

const getIrysUploader = async () => {
  try {
    const provider = new ethers.BrowserProvider(
      window.ethereum as unknown as Eip1193Provider,
    );
    const irysUploader = await WebUploader(WebBaseEth).withAdapter(
      EthersV6Adapter(provider),
    );
    return irysUploader;
  } catch (error) {
    console.error('Error connecting to Irys:', error);
    throw error;
  }
};

const downloadImage = async (url: string): Promise<Buffer> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to download image');
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

interface CreateAssetSignature {
  username: string;
  tweet_id: string;
  // name: string;
  // symbol: string;
  // irys_tx_id: string;
  expire_at: number;
  chain_id: number;
  signature: string;
}

// 添加视频相关的类型定义
interface VideoVariant {
  content_type: string;
  bitrate?: number;
  url: string;
}

interface VideoInfo {
  aspect_ratio: [number, number];
  duration_millis: number;
  variants: VideoVariant[];
}

interface MediaEntity {
  type: string;
  media_url_https: string;
  sizes: {
    small: { w: number; h: number; resize: string };
    large: { w: number; h: number; resize: string };
    medium: { w: number; h: number; resize: string };
    thumb: { w: number; h: number; resize: string };
  };
  video_info?: VideoInfo; // 添加可选的 video_info 字段
}

export default function XAsset() {
  const [tweetLink, setTweetLink] = useState<string>('');
  
  // Add debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout>();

  const [tweetInfo, setTweetInfo] = useState<TweetInfo | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [steps, setSteps] = useState([
    { name: '1. Permanently store X content' },
    { name: '2. Create Asset' },
  ]);

  const [tokenAddress, setTokenAddress] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  interface TweetInfoResponse {
    code: number;
    data: {
      data: {
        tweetResult: {
          result: {
            core: {
              user_results: {
                result: {
                  profile_image_shape: string;
                  legacy: {
                    profile_image_url_https: string;
                    screen_name: string;
                    name: string;
                    followers_count: number;
                    // ... other legacy fields
                  };
                  is_blue_verified: boolean;
                  rest_id: string;
                };
              };
            };
            legacy: {
              extended_entities?: {
                media: Array<{
                  type: string;
                  media_url_https: string;
                  sizes: {
                    small: { w: number; h: number; resize: string };
                    large: { w: number; h: number; resize: string };
                    medium: { w: number; h: number; resize: string };
                    thumb: { w: number; h: number; resize: string };
                  };
                  // other media fields
                }>;
              };
              id_str: string;
              full_text: string;
              created_at: string;
              favorite_count: number;
              retweet_count: number;
              quote_count: number;
              reply_count: number;
              bookmark_count: number;
              lang: string;
            };
            views: {
              count: string;
              state: string;
            };
          };
        };
      };
    };
    msg: string;
  }

  const { showNotification } = useNotification();

  const uploadTweetAsset = async (tweetInfo: TweetInfo) => {
    try {
      const irys = await getIrysUploader();
      const provider = new ethers.BrowserProvider(
        window.ethereum as unknown as Eip1193Provider,
      );

      console.log('Irys address:', irys.address);

      // Prepare upload data - keep original media URLs without uploading to Irys
      const uploadData = { ...tweetInfo };

      // Convert final data to Buffer
      const dataToUpload = Buffer.from(JSON.stringify(uploadData));

      // Calculate total upload cost
      const price = await irys.getPrice(new Blob([dataToUpload]).size);
      console.log(`Upload will cost ${irys.utils.fromAtomic(price)} ETH`);

      // Check balance and fund if needed
      const balance = await irys.getBalance();
      console.log(`Current balance is ${irys.utils.fromAtomic(balance)} ETH`);

      if (balance.lt(price)) {
        console.log('Need funding! Initiating fund transaction...');
        try {
          const feeData = await provider.getFeeData();
          const gasPrice = Number(feeData.gasPrice);
          const fundTx = await irys.fund(price, gasPrice);
          console.log(`Funding success! TX ID: ${fundTx.id}`);
        } catch (fundError) {
          console.error('Funding error:', fundError);
          throw fundError;
        }
      }

      // Upload complete data
      console.log('Uploading data to Irys...');
      const receipt = await irys.upload(dataToUpload, {
        tags: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'Application', value: 'X-Asset' },
          { name: 'Type', value: 'tweet' },
          { name: 'Tweet-ID', value: tweetInfo.id },
          { name: 'Created-At', value: tweetInfo.created_at },
          { name: 'Version', value: '1.0.0' },
        ],
      });

      console.log('Upload successful!');
      console.log('Transaction ID:', receipt.id);
      console.log('View content at:', `https://gateway.irys.xyz/${receipt.id}`);

      showNotification({
        msg: `Successfully stored tweet content.`,
        type: 'success',
        title: 'Upload Successful',
      });

      return {
        txId: receipt.id,
        url: `https://gateway.irys.xyz/${receipt.id}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      showNotification({
        msg: errorMessage,
        type: 'error',
        title: 'Upload Failed',
      });
      console.error('Error uploading to Irys:', error);
      throw error;
    }
  };

  const testCreate = async () => {
    if (!tweetInfo) {
      console.error('Please load a tweet first');
      return;
    }

    const assetName = (document.getElementById('assetName') as HTMLInputElement)
      ?.value;
    const assetSymbol = (
      document.getElementById('assetSymbol') as HTMLInputElement
    )?.value;

    if (!assetName || !assetSymbol) {
      console.error('Please enter asset name and symbol');
      return;
    }

    try {
      // Step 1: Upload to Irys
      setCurrentStep(0);
      setSteps((prevSteps) => [
        { name: '1. Permanently store X content (Uploading...)' },
        prevSteps[1],
      ]);

      const { txId } = await uploadTweetAsset(tweetInfo);
      // const txId = '0x1234567890';
      console.log('Irys upload successful! TxID:', txId);

      // 立即更新第一步的完成状态
      setSteps((prevSteps) => [
        {
          name: `1. Permanently store Tweet TxID: ${txId.slice(0, 4)}...${txId.slice(-4)}`,
        },
        { name: '2. Create Asset (Processing...)' },
      ]);

      // Step 2: Get signature and create asset
      setCurrentStep(1);

      // 暂时不用验证登录
      // const accessToken = localStorage.getItem('accessToken.xid');
      // if (!accessToken) {
      //   throw new Error('Access token not found');
      // }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}/api/v1/utils/sign-asset`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            username: tweetInfo.author.screen_name,
            tweet_id: tweetInfo.id,
          }),
        },
      );

      // if (!response.ok) {
      //   throw new Error('Failed to get signature from backend');
      // }

      const signatureData: CreateAssetSignature = await response.json();

      // Step 3: Call contract using wagmi
      writeContract({
        address: process.env
          .NEXT_PUBLIC_XTWEETID_CREATOR_ADDRESS as `0x${string}`,
        abi: XTweetIDCreatorABI,
        functionName: 'createAsset',
        args: [
          signatureData.username,
          signatureData.tweet_id,
          assetName,
          assetSymbol,
          txId,
          signatureData.expire_at,
          signatureData.chain_id,
          signatureData.signature,
        ],
      });
    } catch (error) {
      // 在错误发生时更新步骤状态以显示失败
      setSteps((prevSteps) => [
        prevSteps[0],
        { name: '2. Create Asset (Failed)' },
      ]);
      console.error('Error creating asset:', error);
      throw error;
    } finally {
      setIsLoading(false);
      // 不要在 finally 中重置步骤，用户可以看到最终状态
    }
  };

  // Modify fetchTweetInfo to include validation
  const fetchTweetInfo = useCallback(async (): Promise<void> => {
    const tweetId = extractIdFromLink(tweetLink);
    // Only proceed if we have a valid tweet ID and not already loading
    if (!tweetId || isLoading || tweetId === tweetInfo?.id) return;

    setIsLoading(true);
    setTweetInfo(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}/api/v1/x/tweet-info?tweet_id=${tweetId}`,
        {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_X_API_KEY || '',
          },
        },
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data: TweetInfoResponse = await response.json();
      console.log('Tweet Info:', data);

      if (data.code === 1 && data.data?.data?.tweetResult?.result) {
        const tweetResult = data.data.data.tweetResult.result;
        const legacy = tweetResult.legacy;
        const user = tweetResult.core.user_results.result;

        const tweetInfo: TweetInfo = {
          id: legacy.id_str,
          text: legacy.full_text,
          created_at: legacy.created_at,
          likes: legacy.favorite_count,
          retweets: legacy.retweet_count,
          quotes: legacy.quote_count,
          replies: legacy.reply_count,
          views_count: parseInt(tweetResult.views.count, 10),
          bookmarks: legacy.bookmark_count,
          lang: legacy.lang,
          author: {
            rest_id: user.rest_id,
            name: user.legacy.name,
            screen_name: user.legacy.screen_name,
            image: user.legacy.profile_image_url_https,
            followers_count: user.legacy.followers_count,
            blue_verified: user.is_blue_verified,
          },
          media: legacy.extended_entities?.media
            ? {
                images: legacy.extended_entities.media
                  .filter((m: MediaEntity) => m.type === 'photo')
                  .map((img: MediaEntity) => ({
                    media_url_https: img.media_url_https,
                  })),
                videos: legacy.extended_entities.media
                  .filter((m: MediaEntity) => m.type === 'video')
                  .map((video: MediaEntity) => {
                    if (!video.video_info) return null;
                    
                    const variants = video.video_info.variants
                      .filter(v => v.content_type === 'video/mp4')
                      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
                    
                    return {
                      media_url_https: video.media_url_https,
                      thumb_url: variants[variants.length - 2]?.url || '',
                      large_url: variants[0]?.url || '',
                      aspect_ratio: video.video_info.aspect_ratio,
                      duration_millis: video.video_info.duration_millis,
                    };
                  })
                  .filter((v): v is NonNullable<typeof v> => v !== null),
              }
            : undefined,
        };

        setTweetInfo(tweetInfo);
      } else {
        throw new Error('Unexpected data structure');
      }
    } catch (error) {
      console.error('Error fetching tweet info:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tweetLink, isLoading, tweetInfo?.id]);

  // Modify the useEffect to include better validation
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Only set timer if the link appears to be a valid tweet URL
    if (tweetLink && tweetLink.includes('twitter.com') || tweetLink.includes('x.com')) {
      debounceTimer.current = setTimeout(() => {
        const tweetId = extractIdFromLink(tweetLink);
        // Only fetch if we have a valid tweet ID and it's different from current
        if (tweetId && tweetId !== tweetInfo?.id) {
          fetchTweetInfo();
        }
      }, 500);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [tweetLink, fetchTweetInfo, tweetInfo?.id]);

  const {
    data: hash,
    isPending,
    writeContract,
    error: txError,
    status: txStatus,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash: hash,
  });

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
        title: 'Create Asset Failed',
      });

      if (txStatus === 'error') {
        setSteps((prevSteps) => [
          prevSteps[0],
          { name: '2. Create Asset (Failed)' },
        ]);
      }
    }

    if (isConfirmed && receipt) {
      // wagmi 已经帮我们处理好了事件解析
      const event = receipt.logs[0]; // AssetCreated 事件
      if ('args' in event && Array.isArray(event.args)) {
        const tokenAddress = event.args[2]; // token address 是第三个参数

        setTokenAddress(tokenAddress);

        setSteps((prevSteps) => [
          prevSteps[0],
          {
            name: `2. Create Asset: ${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`,
          },
        ]);

        showNotification({
          msg: `Asset created successfully. Token address: ${tokenAddress}`,
          type: 'success',
          title: 'Asset Created',
        });
      }
    }
  }, [txStatus, txError, isConfirmed, receipt, showNotification]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        showNotification({
          msg: 'Please select an image file',
          type: 'error',
          title: 'Invalid File Type',
        });
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification({
          msg: 'Image size should be less than 5MB',
          type: 'error',
          title: 'File Too Large',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (tweetInfo) {
      window.scrollTo({
        top: window.scrollY + 70, // 当前滚动位置向下滑动 50px
        behavior: 'smooth', // 平滑滑动
      });
    }
  }, [tweetInfo]);

  return (
    <>
      <div className="m-auto w-full px-4 text-center sm:px-6 lg:px-8 3xl:px-10">
        {/* Only show steps when tweet is loaded */}
        {tweetInfo && (
          <div className="hidden md:block fixed left-8 top-[180px] -translate-y-1/2 z-10">
            <Step steps={steps} currentStep={currentStep} />
            {tokenAddress && (
              <div className="mt-4 text-left">
                <a
                  href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL}/token/${tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <span>
                    Token Address:{' '}
                    {`${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`}
                  </span>
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        )}

        <div className="mx-auto flex w-full flex-col md:w-5/6 xl:px-6 3xl:max-w-[1700px] 3xl:px-12">
          <div className="mx-auto w-full pb-28 md:w-1/2">
            <h3 className="m-auto mt-4 w-full pt-1 text-center font-medium">
              X Asset
            </h3>
            <span className="text-sm">
              Turn X Content into Digital Asset on Blockchain
            </span>

            <div className="mt-3 flex items-center">
              <div className="relative flex-1 rounded-3xl">
                <input
                  type="url"
                  name="tweetLink"
                  id="tweetLink"
                  className="mx-auto block w-full rounded-3xl border-0 py-3 text-center text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-transform duration-200 hover:scale-[1.02] focus:scale-[1.02] active:scale-[0.98]"
                  placeholder="Tweet Link"
                  onChange={(e) => setTweetLink(e.target.value)}
                  value={tweetLink}
                />
              </div>
            </div>

            {isLoading && (
              <p className="mt-4 flex items-center justify-center text-center text-sm text-black">
                <span className="loading loading-spinner loading-xs mr-2"></span>
                <span>Loading Tweet...</span>
              </p>
            )}

            {tweetInfo && (
              <>
                <div className="mt-3 flex justify-between text-left text-sm">
                  <TweetCard tweet={tweetInfo} />
                </div>

                <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 items-center justify-center">
                  {/* Image Upload Box */}
                  <div className="w-full md:w-1/3 flex justify-center p-3">
                    <div className="w-full max-w-[200px] transition-transform duration-200 hover:scale-[1.05]">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="relative aspect-square w-full cursor-pointer overflow-hidden"
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[20px] bg-gray-50 hover:bg-gray-100">
                          {selectedImage ? (
                            <div className="relative h-full w-full">
                              <img
                                src={selectedImage}
                                alt="Preview"
                                className="h-full w-full rounded-[20px] object-cover"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImage(null);
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                  }
                                }}
                                className="absolute right-2 top-2 rounded-full bg-gray-800 p-1 text-white opacity-70 hover:opacity-100"
                              >
                              </button>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="text-xs text-gray-500">jpeg/png/webp/gif</div>
                              <div className="mt-1 text-xs text-gray-400">( &lt; 5MB )</div>
                              <button 
                                className="mt-3 rounded-full bg-white px-3 py-2 text-xs text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                              >
                                Select Image
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input Fields */}
                  <div className="w-full md:w-2/3 flex justify-center">
                    <div className="w-full max-w-[400px] space-y-2.5">
                      {/* Token Name Input */}
                      <div className="mb-1">
                        <span className="text-left block mb-0.5 ">Token Name:</span>
                        <div className="relative">
                          <input
                            type="text"
                            name="assetName"
                            id="assetName"
                            className="block w-full pl-6 rounded-full border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-transform duration-200 hover:scale-[1.02] focus:scale-[1.02] active:scale-[0.98]"
                            placeholder="I really love this meme"
                          />
                        </div>
                      </div>

                      {/* Token Symbol Input */}
                      <div>
                        <span className="text-left block mb-0.5">Token Ticker:</span>
                        <div className="relative">
                          <input
                            type="text"
                            name="assetSymbol"
                            id="assetSymbol"
                            className="block w-full pl-6 rounded-full border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-transform duration-200 hover:scale-[1.02] focus:scale-[1.02] active:scale-[0.98]"
                            placeholder="RLTM"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="mt-4 w-full rounded-3xl bg-black px-3 py-2.5 text-md font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:bg-gray-800 hover:shadow-lg active:scale-[0.98] md:flex-1"
                  onClick={testCreate}
                >
                  Create Asset
                </button>

                {/* Show steps only on mobile */}
                <div className="mb-4 flex w-full md:hidden">
                  <Step steps={steps} currentStep={currentStep} />
                  {tokenAddress && (
                    <div className="mt-4 text-center">
                      <a
                        href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL}/token/${tokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <span>
                          Token Address:{' '}
                          {`${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`}
                        </span>
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
