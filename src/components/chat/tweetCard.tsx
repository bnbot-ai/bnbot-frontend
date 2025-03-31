import {
  ChatBubbleOvalLeftIcon,
  ArrowPathRoundedSquareIcon,
  HeartIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { useModal } from '@/components/ui/animated-modal';
import { useState, useEffect, useRef } from 'react';

interface Tweet {
  id_str: string;
  created_at: string;
  text: string;
  reply_count: number;
  retweet_count: number;
  like_count: number;
  quote_count: number;
  view_count: string;
  is_retweet: boolean;
  retweeted_status_id: string | null;
  is_quote: boolean;
  quoted_status_id: string | null;
  user: {
    username: string;
    twitter_id: string;
    name: string;
    avatar: string;
    description: string;
  };
  media:
    | {
        type: string;
        url: string;
        thumbnail?: string;
      }[]
    | null;
  quoted_tweet?: {
    id_str: string;
    text: string;
    created_at: string;
    user: {
      name: string;
      username: string;
      avatar: string;
    };
  } | null;
  retweeted_tweet?: {
    text: string;
    username: string;
  } | null;
}

interface TweetCardProps {
  tweet: Tweet;
  username: string;
  avatar?: string;
  name?: string;
}

function formatNumber(num: number | string): string {
  const numValue = typeof num === 'string' ? parseInt(num) : num;
  if (numValue >= 1000000) {
    return `${(numValue / 1000000).toFixed(1)}M`;
  }
  if (numValue >= 1000) {
    return `${(numValue / 1000).toFixed(1)}K`;
  }
  return numValue.toString();
}

function formatDateTime(dateString: string): string {
  return new Date(dateString)
    .toLocaleString('zh-CN', {
      hour: 'numeric',
      minute: 'numeric',
      month: 'long',
      day: 'numeric',
      hour12: true,
    })
    .replace('年', '/')
    .replace('月', '/')
    .replace('日', '');
}

export default function TweetCard({
  tweet,
  username,
  avatar,
  name,
}: TweetCardProps) {
  const { showModal } = useModal();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // 组件在视口内，继续播放视频
          if (videoRef.current && !isVideoPlaying) {
            videoRef.current.play();
            setIsVideoPlaying(true);
          }
        } else {
          // 组件移出视口，暂停视频
          if (videoRef.current) {
            videoRef.current.pause();
            setIsVideoPlaying(false);
          }
        }
      },
      { threshold: 0.1 }, // 触发阈值
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [videoRef, isVideoPlaying]);

  const handleTweetClick = () => {
    const tweetWithAuthor = {
      ...tweet,
      author: {
        username,
        twitter_id: username,
        name: name || username,
        avatar: avatar || '/default-avatar.png',
        description: '',
      },
    };

    showModal([], tweetWithAuthor, 'tweet', undefined);
  };

  const formatTextWithLinks = (
    text: string,
    retweetedTweet?: Tweet['retweeted_tweet'],
  ) => {
    // 如果存在转推推文，则使用转推的文本
    const displayText = retweetedTweet ? `${retweetedTweet.text}` : text;

    const lines = displayText.split('\n');
    const displayedLines = lines.slice(0, 8);
    const isTruncated = lines.length > 8;

    const parts = displayedLines
      .join('\n')
      .split(/((?:https?:\/\/[^\s]+)|(?:@\w+)|(?:#\w+)|(?:\$\w+)(?!\w))/);

    return (
      <p className="mt-1 whitespace-pre-line break-all text-xs leading-5 text-gray-800">
        {parts.map((part, index) => {
          if (!part) return null;

          // 处理链接
          if (part.match(/^https?:\/\//)) {
            return (
              <a
                key={index}
                href={part}
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {part}
              </a>
            );
          }
          // 处理 @用户名、#话题标签、$符号
          else if (part.match(/^[@#$]\w+/)) {
            return (
              <span key={index} className="text-blue-500">
                {part}
              </span>
            );
          }
          // 普通文本
          return <span key={index}>{part}</span>;
        })}
        {isTruncated && '...'}
      </p>
    );
  };

  const renderMedia = (media: Tweet['media']) => {
    if (!media || media.length === 0) return null;

    return (
      <div className="mt-2 overflow-hidden">
        {media.length === 1 && (
          <div className="relative h-[180px]">
            {media[0].type === 'video' ? (
              <>
                {!isVideoPlaying ? (
                  <>
                    <img
                      src={media[0].thumbnail}
                      alt="Tweet media thumbnail"
                      className="h-full w-full rounded-2xl border border-gray-100 object-cover"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black bg-opacity-20 hover:bg-opacity-30"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVideoPlaying(true);
                      }}
                    >
                      <button
                        className="rounded-full bg-gray-300 bg-opacity-30 p-2 shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsVideoPlaying(true);
                        }}
                      >
                        <PlayIcon className="h-8 w-8 text-gray-200" />
                      </button>
                    </div>
                  </>
                ) : (
                  <video
                    ref={videoRef}
                    controls
                    autoPlay
                    className="h-full w-full rounded-2xl border border-gray-100 object-cover"
                    onClick={(e) => e.stopPropagation()}
                    onEnded={() => setIsVideoPlaying(false)}
                  >
                    <source src={media[0].url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </>
            ) : (
              <img
                src={media[0].url}
                alt="Tweet media"
                className="h-full w-full rounded-2xl border border-gray-100 object-cover"
              />
            )}
          </div>
        )}

        {media.length === 2 && (
          <div className="grid grid-cols-2 gap-0.5">
            {media.map((item, index) => (
              <div key={index} className="aspect-square">
                <img
                  src={item.url}
                  alt="Tweet media"
                  className={`h-full w-full border border-gray-100 object-cover ${
                    index === 0
                      ? 'rounded-bl-2xl rounded-tl-2xl'
                      : 'rounded-br-2xl rounded-tr-2xl'
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {media.length >= 3 && (
          <div className="grid grid-cols-2 gap-0.5">
            <div className="aspect-square">
              <img
                src={media[0].url}
                alt="Tweet media"
                className="h-full w-full rounded-bl-2xl rounded-tl-2xl border border-gray-100 object-cover"
              />
            </div>
            <div className="grid grid-rows-2 gap-0.5">
              {media.slice(1, 3).map((item, index) => (
                <div key={index} className="aspect-[2/1]">
                  <img
                    src={item.url}
                    alt="Tweet media"
                    className={`h-full w-full border border-gray-100 object-cover ${
                      index === 0 ? 'rounded-tr-2xl' : 'rounded-br-2xl'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQuotedTweet = (quotedTweet: Tweet['quoted_tweet']) => {
    if (!quotedTweet) return null;

    const formatQuotedText = (text: string) => {
      const lines = text.split('\n');
      const displayedLines = lines.slice(0, 2);
      const isTruncated = lines.length > 2;

      const parts = displayedLines
        .join('\n')
        .split(/((?:https?:\/\/[^\s]+)|(?:@\w+)|(?:#\w+)|(?:\$\w+)(?!\w))/);

      return (
        <p className="mt-1 whitespace-pre-line break-all text-xs text-gray-800">
          {parts.map((part, index) => {
            if (!part) return null;

            // Handle links
            if (part.match(/^https?:\/\//)) {
              return (
                <a
                  key={index}
                  href={part}
                  className="text-blue-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {part}
                </a>
              );
            }
            // Handle @mentions, #hashtags, and $cashtags
            else if (part.match(/^[@#$]\w+/)) {
              if (part.startsWith('@')) {
                return (
                  <a
                    key={index}
                    href={`https://x.com/${part.slice(1)}`}
                    className="text-blue-500 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {part}
                  </a>
                );
              }
              return (
                <span key={index} className="text-blue-500">
                  {part}
                </span>
              );
            }
            // Regular text
            return <span key={index}>{part}</span>;
          })}
          {isTruncated && '...'}
        </p>
      );
    };

    return (
      <div className="mt-2 rounded-xl border border-gray-200/50 p-3">
        <div className="flex items-center gap-2">
          <a
            href={`https://x.com/${quotedTweet.user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={quotedTweet.user.avatar}
              alt={`${quotedTweet.user.username}'s avatar`}
              className="h-5 w-5 rounded-full"
            />
          </a>
          <a
            href={`https://x.com/${quotedTweet.user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:underline"
          >
            <span className="text-[12px] font-medium">
              {quotedTweet.user.name}
            </span>
          </a>
          <a
            href={`https://x.com/${quotedTweet.user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[12px] text-gray-500">
              @{quotedTweet.user.username}
            </span>
          </a>
        </div>
        <div className="mt-1">{formatQuotedText(quotedTweet.text)}</div>
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      className="tweet-card card-compact flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border-[1px] border-gray-100 bg-white hover:bg-gray-50"
      onClick={handleTweetClick}
    >
      <div className="card-body flex-grow !p-3 !pb-1">
        <div className="flex items-start gap-2">
          <div className="h-8 w-8 flex-shrink-0">
            <img
              src={avatar}
              alt={`${username}'s avatar`}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <div className="flex min-w-0 flex-col">
                <p className="-mb-1 truncate text-[12px] font-medium text-black">
                  {name || username}
                </p>
                <p className="truncate text-[12px] text-gray-500">
                  @{username}
                </p>
              </div>
              <div className="flex-shrink-0 text-right text-[12px] text-gray-500">
                <div className="text-[12px] text-gray-500 -mt-0.5">
                  {formatDateTime(tweet.created_at)}
                </div>
                <div className="truncate text-[12px] text-gray-500 -mt-1">
                  {tweet.retweeted_tweet && (
                    <span>RT: @{tweet.retweeted_tweet.username}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="-mt-2">
          {formatTextWithLinks(tweet.text, tweet.retweeted_tweet)}
          {renderMedia(tweet.media)}
          {renderQuotedTweet(tweet.quoted_tweet)}
        </div>
      </div>

      <div className="mb-2 grid grid-cols-4 gap-2 px-3 text-xs text-gray-500">
        <div className="flex items-center">
          <ChatBubbleOvalLeftIcon className="mr-1 h-4 w-4" />
          <span className="mt-0.5 text-[12px]">
            {formatNumber(tweet.reply_count)}
          </span>
        </div>
        <div className="flex items-center">
          <ArrowPathRoundedSquareIcon className="mr-1 h-4 w-4" />
          <span className="mt-0.5 text-[12px]">
            {formatNumber(tweet.retweet_count)}
          </span>
        </div>
        <div className="flex items-center">
          <HeartIcon className="mr-1 h-4 w-4" />
          <span className="mt-0.5 text-[12px]">
            {formatNumber(tweet.like_count)}
          </span>
        </div>
        <div className="flex items-center">
          <EyeIcon className="mr-1 h-4 w-4" />
          <span className="mt-0.5 text-[12px]">
            {formatNumber(tweet.view_count)}
          </span>
        </div>
      </div>
    </div>
  );
}
