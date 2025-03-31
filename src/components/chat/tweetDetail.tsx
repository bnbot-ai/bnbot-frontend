'use client';

import React, { useState, useEffect } from 'react';
import { ModalBody, ModalContent } from '@/components/ui/animated-modal';
import {
  ChatBubbleOvalLeftIcon,
  ArrowPathRoundedSquareIcon,
  HeartIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { XIcon } from '@/components/icons/x-icon';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useModal } from '@/components/ui/animated-modal';

interface TrendTweet {
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
  author: {
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

interface TweetDetailProps {
  tweet: TrendTweet | null;
}

function formatDateTime(dateString: string): string {
  return new Date(dateString)
    .toLocaleString('zh-CN', {
      hour: 'numeric',
      minute: 'numeric',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour12: true,
    })
    .replace('年', '/')
    .replace('月', '/')
    .replace('日', '');
}

export default function TweetDetail({ tweet }: TweetDetailProps) {
  const { setOpen } = useModal();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [canSetFullscreen, setCanSetFullscreen] = useState(false);

  useEffect(() => {
    setCanSetFullscreen(false);
    const timer = setTimeout(() => {
      setCanSetFullscreen(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [tweet?.id_str]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
          setSelectedImage(null);
          event.preventDefault();
          event.stopPropagation();
        } else {
          setOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleEsc, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleEsc, { capture: true });
    };
  }, [isFullscreen, setOpen]);

  if (!tweet) return null;

  const formatTextWithLinks = (text: string) => {
    const parts = text.split(
      /((?:https?:\/\/[^\s]+)|(?:@\w+)|(?:#\w+)|(?:\$\w+)(?!\w))/,
    );

    return (
      <p className="!mt-1.5 whitespace-pre-line text-xs leading-snug md:text-sm">
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
          // 普通文本
          return (
            <span key={index} className="text-[18px]">
              {part}
            </span>
          );
        })}
      </p>
    );
  };

  const renderMedia = (media: TrendTweet['media']) => {
    if (!media || media.length === 0) return null;

    const handleImageClick = (e: React.MouseEvent, imageUrl: string) => {
      e.stopPropagation();
      if (canSetFullscreen) {
        setSelectedImage(imageUrl);
        setIsFullscreen(true);
      }
    };

    return (
      <div className="mt-3 overflow-hidden">
        {isFullscreen && selectedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
              setSelectedImage(null);
            }}
          >
            <button
              className="absolute right-4 top-4 rounded-full p-2 text-white transition-colors hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(false);
                setSelectedImage(null);
              }}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <img
              src={selectedImage}
              alt="Tweet media"
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {media.length === 1 && (
          <div className="h-[250px] w-[450px]">
            {media[0].type === 'video' ? (
              <video
                src={media[0].url}
                poster={media[0].thumbnail}
                controls
                className="h-full w-full rounded-2xl border border-gray-100 object-cover"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={media[0].url}
                alt="Tweet media"
                className="h-full w-full cursor-pointer rounded-2xl border border-gray-300 object-cover"
                onClick={(e) => handleImageClick(e, media[0].url)}
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
                  className={`h-full w-full cursor-pointer border border-gray-300 object-cover ${
                    index === 0
                      ? 'rounded-bl-2xl rounded-tl-2xl'
                      : 'rounded-br-2xl rounded-tr-2xl'
                  }`}
                  onClick={(e) => handleImageClick(e, item.url)}
                />
              </div>
            ))}
          </div>
        )}

        {media.length === 3 && (
          <div className="grid grid-cols-2 gap-0.5">
            <div className="aspect-square">
              <img
                src={media[0].url}
                alt="Tweet media"
                className="h-full w-full cursor-pointer rounded-bl-2xl rounded-tl-2xl border border-gray-100 object-cover"
                onClick={(e) => handleImageClick(e, media[0].url)}
              />
            </div>
            <div className="grid grid-rows-2 gap-0.5">
              {media.slice(1, 3).map((item, index) => (
                <div key={index} className="aspect-[2/1]">
                  <img
                    src={item.url}
                    alt="Tweet media"
                    className={`h-full w-full cursor-pointer border border-gray-100 object-cover ${
                      index === 0 ? 'rounded-tr-2xl' : 'rounded-br-2xl'
                    }`}
                    onClick={(e) => handleImageClick(e, item.url)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {media.length >= 4 && (
          <div className="grid grid-cols-2 gap-0.5">
            <div className="grid grid-rows-2 gap-0.5">
              <div className="aspect-[2/1]">
                <img
                  src={media[0].url}
                  alt="Tweet media"
                  className="h-full w-full cursor-pointer rounded-tl-2xl border border-gray-100 object-cover"
                  onClick={(e) => handleImageClick(e, media[0].url)}
                />
              </div>
              <div className="aspect-[2/1]">
                <img
                  src={media[1].url}
                  alt="Tweet media"
                  className="h-full w-full cursor-pointer rounded-bl-2xl border border-gray-100 object-cover"
                  onClick={(e) => handleImageClick(e, media[1].url)}
                />
              </div>
            </div>
            <div className="grid grid-rows-2 gap-0.5">
              <div className="aspect-[2/1]">
                <img
                  src={media[2].url}
                  alt="Tweet media"
                  className="h-full w-full cursor-pointer rounded-tr-2xl border border-gray-100 object-cover"
                  onClick={(e) => handleImageClick(e, media[2].url)}
                />
              </div>
              <div className="aspect-[2/1]">
                <img
                  src={media[3].url}
                  alt="Tweet media"
                  className="h-full w-full cursor-pointer rounded-br-2xl border border-gray-100 object-cover"
                  onClick={(e) => handleImageClick(e, media[3].url)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQuotedTweet = (quotedTweet: TrendTweet['quoted_tweet']) => {
    if (!quotedTweet) return null;

    return (
      <div className="mt-3 rounded-2xl border border-gray-200 p-4">
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
            <span className="text-sm font-medium">{quotedTweet.user.name}</span>
          </a>
          <a
            href={`https://x.com/${quotedTweet.user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:underline"
          >
            <span className="text-sm text-gray-500">
              @{quotedTweet.user.username}
            </span>
          </a>
        </div>
        <div className="mt-1">{formatTextWithLinks(quotedTweet.text)}</div>
      </div>
    );
  };

  return (
    <div className="mx-auto w-80 max-w-3xl sm:px-4">
      <ModalBody className="rounded-lg bg-white shadow-xl sm:m-4">
        <ModalContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <a
                  href={`https://x.com/${tweet.author.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={tweet.author.avatar}
                    alt={tweet.author.name}
                    className="h-10 w-10 rounded-full shadow-xl md:h-11 md:w-11"
                  />
                </a>
                <div className="flex flex-1 items-start justify-between leading-3">
                  <div>
                    <div className="flex items-center gap-1">
                      <a
                        href={`https://x.com/${tweet.author.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        <h4 className="text-xs font-semibold md:text-sm">
                          {tweet.author.name}
                        </h4>
                      </a>
                      <p className="text-xs text-gray-500 md:text-xs">
                        · {formatDateTime(tweet.created_at)}
                      </p>
                    </div>
                    <a
                      href={`https://x.com/${tweet.author.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="-mt-0.5 text-sm text-gray-500">
                        @{tweet.author.username}
                      </span>
                    </a>
                    {tweet.retweeted_tweet && (
                      <span className="ml-2 -mt-0.5 text-sm text-gray-500">
                        RT: @{tweet.retweeted_tweet.username}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://x.com/${tweet.author.username}/status/${tweet.id_str}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="-mr-1 -mt-1 rounded-full bg-gray-100 p-2 hover:bg-gray-200"
                >
                  <XIcon className="h-5 w-5 p-0.5" />
                </a>
              </div>
            </div>

            {formatTextWithLinks(tweet.retweeted_tweet?.text || tweet.text)}
            {renderMedia(tweet.media)}
            {renderQuotedTweet(tweet.quoted_tweet)}

            <div className="!mt-2 px-2 text-xs md:text-sm">
              <div className="space-y-2">
                <div className="flex w-full justify-between text-xs text-gray-500 md:text-sm">
                  <div className="flex items-center text-xs">
                    <ChatBubbleOvalLeftIcon className="mr-1 h-4 w-4 md:h-5 md:w-5" />
                    <span className="mt-0.5 text-gray-500">
                      {tweet.reply_count}
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <ArrowPathRoundedSquareIcon className="mr-1 h-4 w-4 md:h-5 md:w-5" />
                    <span className="mt-0.5 text-gray-500">
                      {tweet.retweet_count}
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <HeartIcon className="mr-1 h-4 w-4 md:h-5 md:w-5" />
                    <span className="mt-0.5 text-gray-500">
                      {tweet.like_count}
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <EyeIcon className="mr-1 h-4 w-4 md:h-5 md:w-5" />
                    <span className="mt-0.5 text-gray-500">
                      {parseInt(tweet.view_count)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalContent>
      </ModalBody>
    </div>
  );
}
