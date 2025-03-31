import { useState, useEffect } from 'react';
import { Tweet, XAsset } from '@/types';
import defaultAssetImage from '@/assets/images/xid-logo-black.jpeg';

interface AssetCardProps {
  asset: XAsset;
}

import { useModal } from '../ui/animated-modal';

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

// 生成随机小时数的函数
function getRandomHours() {
  // 生成1-48之间的随机整数（1-2天范围内的小时数）
  return Math.floor(Math.random() * 48) + 1;
}

export default function AssetCard({ asset }: AssetCardProps) {
  const [tweetData, setTweetData] = useState<Tweet | null>(null);
  const { showModal } = useModal();
  // 为每个卡片创建一个随机小时数
  const [hours] = useState(() => getRandomHours());

  useEffect(() => {
    const fetchTweetData = async () => {
      try {
        const response = await fetch(asset.uri);
        const data = await response.json();
        setTweetData(data);
      } catch (error) {
        console.error('Error fetching tweet data:', error);
      }
    };

    fetchTweetData();
  }, [asset.uri]);

  const handleCardClick = () => {
    if (tweetData) {
      showModal(asset, tweetData, 'boost');
    }
  };

  const getMediaContent = () => {
    if (!tweetData?.media) {
      return (
        <figure className="flex h-36 w-36 items-center justify-center bg-gray-100">
          <img
            src={defaultAssetImage.src}
            alt="Default media"
            className="h-36 w-36 object-cover"
          />
        </figure>
      );
    }

    // Handle video content
    if (tweetData.media.videos?.length) {
      const video = tweetData.media.videos[0];

      return (
        <div className="relative h-48 w-full">
          <video
            className="h-48 w-full max-w-full object-cover"
            muted
            loop
            playsInline
            poster={video.media_url_https}
            preload="metadata"
          >
            <source src={video.thumb_url} type="video/mp4" />
          </video>
        </div>
      );
    }

    // Handle image content
    if (tweetData.media.images?.length) {
      const media = tweetData.media.images[0];
      return (
        <figure className="flex h-36 w-36 items-start justify-start bg-gray-100">
          <img
            src={media.media_url_https}
            alt="Tweet media"
            className="h-36 w-36 object-cover"
            draggable={false}
            onError={(e) => {
              e.currentTarget.src = defaultAssetImage.src;
            }}
          />
        </figure>
      );
    }

    return (
      <figure className="flex h-36 w-36 items-center justify-center bg-gray-100">
        <img
          src={defaultAssetImage.src}
          alt="Default media"
          className="h-36 w-36 object-cover"
          draggable={false}
        />
      </figure>
    );
  };

  return (
    <div
      className="card-compact flex h-full flex-col overflow-hidden rounded-2xl border-[1px] border-t border-gray-100"
      onClick={handleCardClick}
    >
      <div className="card-body flex-grow !p-3 !pb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 overflow-hidden rounded-full">
            <img
              src={tweetData?.author.image || defaultAssetImage.src}
              alt="Author profile"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = defaultAssetImage.src;
              }}
            />
          </div>
          <div className="flex-grow">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-black">
                  {tweetData?.author.name}
                </span>
                <span className="text-[12px] text-gray-500 -mt-1">@{asset.author}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-600">
                <span className="font-mono text-[13px] tabular-nums text-gray-500">
                  {hours}h
                </span>
              </div>
            </div>
          </div>
        </div>
  
        <p className="line-clamp-3 text-xs leading-5 break-words">
          {tweetData?.text?.replace(/\s*https:\/\/t\.co\/\w+$/g, '')}
        </p>
        <div className="flex h-36 w-36 items-start justify-start overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
          {getMediaContent()}
        </div>
      </div>
      <div className="mb-3 flex justify-between px-3 text-xs text-gray-500">
        <div className="flex items-center">10,000 Participants</div>

        {asset.symbol !== undefined && (
          <div className="flex items-center">1000 $USDT</div>
        )}
      </div>
    </div>
  );
}
