'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PaperAirplaneIcon, RssIcon } from '@heroicons/react/24/outline';
import {
  ChartBarIcon,
  CalendarIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  ChatBubbleOvalLeftIcon,
  ArrowPathRoundedSquareIcon,
  HeartIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import TweetCard from '@/components/chat/tweetCard';
import Masonry from 'react-masonry-css';
import {
  ArrowTopRightOnSquareIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowUpIcon } from '@heroicons/react/24/solid';
import {
  DocumentDuplicateIcon,
  ArrowPathIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import MemeTokenCard from '@/components/chat/MemeTokenCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

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
}
interface FormattedNameProps {
  username: string;
  name: string;
}

const FormattedName: React.FC<FormattedNameProps> = ({ username, name }) => {
  return (
    <a
      href={`https://x.com/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 hover:underline"
    >
      {name}
    </a>
  );
};

const formatText = (text: string) => {
  // Updated regex to match @username(Name), plain @username, $TOKEN (non-numeric), and #hashtag patterns
  const pattern =
    /(@(\w+)\(([^)]+)\))|(@(\w+))|(\$[A-Za-z]\w*)|(\$\d+)|(#\w+)/g;

  const parts = text.split(pattern);
  const formatted = [];
  let i = 0;

  while (i < parts.length) {
    if (parts[i]) {
      if (parts[i].startsWith('@') && parts[i].includes('(')) {
        // Skip this part as it's the full @username(Name) match
        i++;
        // Username is in the next part
        const username = parts[i++];
        // Name is in the next part
        const name = parts[i++];
        formatted.push(
          <FormattedName
            key={`${username}-${i}`}
            username={username}
            name={name}
          />,
        );
      } else if (parts[i].startsWith('@')) {
        // Plain @username mention
        i++;
        const username = parts[i++];
        formatted.push(
          <a
            key={`mention-${i}`}
            href={`https://x.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            @{username}
          </a>,
        );
      } else if (parts[i].startsWith('$') && !/^\$\d+$/.test(parts[i])) {
        // Token symbol (only if not followed by numbers)
        formatted.push(
          <span key={`token-${i}`} className="text-blue-500">
            {parts[i]}
          </span>,
        );
        i++;
      } else if (parts[i].startsWith('$')) {
        // Dollar amount (when followed by numbers)
        formatted.push(parts[i]);
        i++;
      } else if (parts[i].startsWith('#')) {
        // Hashtag
        formatted.push(
          <span key={`hashtag-${i}`} className="text-blue-500">
            {parts[i]}
          </span>,
        );
        i++;
      } else {
        // Regular text with Chinese comma
        formatted.push(parts[i]);
        i++;
      }
    } else {
      i++;
    }
  }

  return formatted;
};

const MessageContent = ({ content }: { content: string }) => {
  const [hiddenTools, setHiddenTools] = useState<Set<string>>(new Set());
  const processedToolsRef = useRef<Set<string>>(new Set());

  // 修改 handleToolResult 函数，使用 Array.from 来处理 Set
  const handleToolResult = useCallback((toolName: string) => {
    if (!processedToolsRef.current.has(toolName)) {
      processedToolsRef.current.add(toolName);
      setHiddenTools((prev) => new Set(Array.from(prev).concat([toolName])));
    }
  }, []);

  const renderToolResult = useCallback(
    (resultData: string) => {
      try {
        console.log('Parsing tool result:', resultData);
        const data = JSON.parse(resultData);
        if (data.tool_name === 'get_meme_data' && data.result?.[0]?.text) {
          console.log('Rendering MemeTokenCard with data:', data);
          // 使用 ref 来检查是否已经处理过这个工具结果
          if (!processedToolsRef.current.has(data.tool_name)) {
            handleToolResult(data.tool_name);
          }
          return (
            <div className="w-[300px] max-w-[380px]">
              <MemeTokenCard toolResult={data} />
            </div>
          );
        }
        return null;
      } catch (error) {
        console.error('Error parsing tool result:', error);
        return null;
      }
    },
    [handleToolResult],
  );

  const cleanContent = content
    .replace(/(?!^)\*\s+/g, '')
    .replace(/(?!^)\*\*/g, '')
    .replace(/###/g, '')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/\\_/g, '_');

  // Parse tool call tags and results
  const parts = cleanContent.split(
    /(<tool-call>.*?<\/tool-call>|<tool-result>.*?<\/tool-result>)/g,
  );

  const formatLine = (line: string) => {
    const tweetIdPattern = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = tweetIdPattern.exec(line)) !== null) {
      // Add text before the ID
      const textBeforeMatch = line.slice(lastIndex, match.index);
      if (textBeforeMatch) {
        parts.push(...formatText(textBeforeMatch));
      }

      // Add a smaller space before the first icon
      parts.push(<span key={`space-before-${match.index}`} />);

      // Handle multiple IDs separated by commas
      const tweetIds = match[1].split(',').map((id) => id.trim());
      tweetIds.forEach((tweetId) => {
        parts.push(
          <button
            key={`tweet-link-${tweetId}`}
            onClick={() => handleTweetClick(tweetId)}
            className="inline-flex items-center text-gray-400 hover:text-gray-700"
            title="查看推文"
          >
            <ArrowRightCircleIcon className="h-4 w-4" />
          </button>,
        );
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last ID
    const remainingText = line.slice(lastIndex);
    if (remainingText) {
      parts.push(...formatText(remainingText));
    }

    return parts;
  };

  const handleTweetClick = (tweetId: string) => {
    console.log('handleTweetClick', tweetId);
    const tweetElement = document.getElementById(`tweet-${tweetId}`);
    if (tweetElement) {
      console.log('tweetElement', tweetElement);
      // 先移除之前可能存在的高亮效果
      const allTweets = document.querySelectorAll('.tweet-container');
      allTweets.forEach((tweet) => tweet.classList.remove('highlight-tweet'));

      // 获取目标元素的父容器（滚动容器）
      const scrollContainer = document.querySelector(
        '.scrollbar-none.h-full.overflow-y-auto, .scrollbar-none.mt-4.h-\\[calc\\(100\\%-4rem\\)\\].overflow-y-auto'
      );

      if (scrollContainer) {
        console.log('scrollContainer', scrollContainer);
        
        // 将滚动容器滚动到目标元素位置
        tweetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        // 短暂延迟后添加高亮效果，确保滚动完成
        setTimeout(() => {
          tweetElement.classList.add('highlight-tweet');
        }, 300);

        // 3秒后移除高亮效果
        setTimeout(() => {
          tweetElement.classList.remove('highlight-tweet');
        }, 3000);
      } else {
        console.error('Scroll container not found');
      }
    } else {
      console.error(`Tweet with ID ${tweetId} not found`);
    }
  };

  return (
    <div className="text-spacing space-y-3">
      {parts.map((part, index) => {
        // Check if this part is a tool call tag
        if (part.startsWith('<tool-call>') && part.endsWith('</tool-call>')) {
          const toolName = part
            .replace('<tool-call>', '')
            .replace('</tool-call>', '')
            .trim();

          // 如果工具结果已经显示，则不显示调用状态
          if (hiddenTools.has(toolName)) {
            return null;
          }

          const formattedToolName =
            toolName
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ') + '...';

          return (
            <div
              key={`tool-${index}`}
              className="my-2 inline-flex rounded-3xl bg-gray-50 p-3 pr-4 text-sm text-gray-600"
            >
              <div className="flex items-center space-x-2">
                <span className="loading loading-spinner loading-xs text-neutral"></span>
                <span>
                  <span className="font-medium">{formattedToolName}</span>
                </span>
              </div>
            </div>
          );
        }

        // Check if this part is a tool result
        if (
          part.startsWith('<tool-result>') &&
          part.endsWith('</tool-result>')
        ) {
          const resultData = part
            .replace('<tool-result>', '')
            .replace('</tool-result>', '')
            .trim();

          return renderToolResult(resultData);
        }

        // Otherwise process as normal text
        const lines = part.split('\n');
        return lines.map((line, lineIndex) => {
          const cleanLine = line.trim();
          if (!cleanLine) return null;
          return (
            <div
              key={`${index}-${lineIndex}`}
              className="text-spacing break-words text-gray-800"
            >
              {formatLine(cleanLine)}
            </div>
          );
        });
      })}
    </div>
  );
};

// Add this CSS to your global styles or component
const style = `
  .highlight-tweet {
    animation: highlight 2s ease-in-out;
  }

  @keyframes highlight {
    0%, 100% {
      background-color: transparent;
    }
    50% {
      background-color: rgba(59, 130, 246, 0.1);
    }
  }
`;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [cursor, setCursor] = useState('1');
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'board'>('board');

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    setHasMounted(true);

    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const scrollToBottom = () => {
    if (!userHasScrolled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isScrolledToBottom =
      Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) <
      10;

    // 只有当用户主动滚动时才设置 userHasScrolled
    if (!isScrolledToBottom) {
      setUserHasScrolled(true);
    } else {
      setUserHasScrolled(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentAssistantMessage]);

  useEffect(() => {
    // Check if user is logged in by looking for access token
    const accessToken = localStorage.getItem('accessToken.xid');
    setIsLoggedIn(!!accessToken);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 添加对 IME 输入的检查
    if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return; // 如果正在输入法编辑状态，直接返回不处理
    }

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter: Add new line
        e.preventDefault();
        const cursorPosition = e.currentTarget.selectionStart;
        const newValue =
          input.slice(0, cursorPosition) + '\n' + input.slice(cursorPosition);
        setInput(newValue);

        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = cursorPosition + 1;
            inputRef.current.selectionEnd = cursorPosition + 1;

            const event = new Event('input', { bubbles: true });
            inputRef.current.dispatchEvent(event);
          }
        }, 0);
      } else {
        // Enter only: Submit form
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Only focus the input on desktop, not on mobile
    if (!isMobile) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }

    // Update local messages state
    const updatedMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(updatedMessages);
    setIsLoading(true);
    setCurrentAssistantMessage('');

    try {
      // Get access token from localStorage
      const accessToken = localStorage.getItem('accessToken.xid');

      // If not logged in, keep loading state and return early
      if (!accessToken) {
        // Keep the loading state active
        return;
      }

      const requestBody = {
        messages: updatedMessages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}/api/v1/ai/chat/?web_search=${webSearchEnabled}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_X_API_KEY || '',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let fullMessage = '';
      let isToolProcess = false; // Track if we're in the middle of tool processing
      let lastToolName = ''; // Store the last used tool name

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5));

              // Handle different event types
              if (data.type === 'content') {
                // Update the current message with thinking content
                fullMessage += data.content;
                setCurrentAssistantMessage(fullMessage);
              } else if (data.type === 'tool_call') {
                // Show tool call info to the user
                isToolProcess = true;
                lastToolName = data.tool_name;

                // Add the tool call tag to display the UI component
                fullMessage += `\n\n<tool-call>${data.tool_name}</tool-call>\n\n`;
                setCurrentAssistantMessage(fullMessage);
              } else if (data.type === 'tool_result') {
                // If we were in a tool process, we need to clean it up
                if (isToolProcess && lastToolName) {
                  // Delay execution by 0.5 seconds
                  setTimeout(() => {
                    // Remove any previous tool call tags for this tool
                    fullMessage = fullMessage.replace(
                      new RegExp(`<tool-call>${lastToolName}</tool-call>`, 'g'),
                      '',
                    );
                    isToolProcess = false; // End the tool process
                  }, 200); // 500 milliseconds delay
                }
                // Handle tool result by wrapping it in tool-result tags
                if (data.tool_name === 'get_meme_data') {
                  const toolResultStr = JSON.stringify(data);
                  fullMessage += `\n\n<tool-result>${toolResultStr}</tool-result>\n\n`;
                  setCurrentAssistantMessage(fullMessage);
                }
                // isToolProcess = false; // End the tool process
              } else if (data.type === 'error') {
                // Handle error messages
                const errorInfo = `\n\n_An error occurred: ${data.content}_\n\n`;
                fullMessage += errorInfo;
                setCurrentAssistantMessage(fullMessage);
              } else if (data.content) {
                // Handle regular content (for backward compatibility)
                fullMessage += data.content;
                setCurrentAssistantMessage(fullMessage);
              }
              // If we received an error message
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
        }
      }

      // Clean up any remaining tool call tags before finalizing the message
      const cleanedMessage = fullMessage; // Remove the cleanup of tool tags to preserve the results

      // Stream ended, update messages array directly with the cleaned message
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: cleanedMessage,
        },
      ]);
      setCurrentAssistantMessage('');
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.',
        },
      ]);
    } finally {
      // Only reset loading state if user is logged in
      if (localStorage.getItem('accessToken.xid')) {
        setIsLoading(false);
      }

      // Only focus the input on desktop after the response is complete
      if (!isMobile) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    }
  };

  const fetchTweets = async (newCursor?: string) => {
    try {
      setIsLoadingMore(true);

      // Get access token from localStorage
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}/api/v1/ai/kol-recent-data/?cursor=${newCursor || cursor}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const data = await response.json();
      if (data.status === 'success') {
        if (newCursor === '1') {
          setTweets(data.data);
        } else {
          setTweets((prev) => [...prev, ...data.data]);
        }
        // If we received less than 20 items (page_size), we've reached the end
        setHasMore(data.data.length === 20);
      }
    } catch (error) {
      console.error('Error fetching tweets:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTweets('1');
  }, []);

  // 更新断点配置
  const breakpointColumnsObj = {
    default: isChatOpen ? 3 : 5, // 当聊天框隐藏时显示5列，显示时显示3列
    1100: 2, // 在1100px以下显示2列
    700: 1, // 在700px以下显示1列
  };

  const toggleWebSearch = () => {
    setWebSearchEnabled(!webSearchEnabled);
  };

  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);

    // Reset after 3 seconds
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 3000);
  };

  // Prevent rendering until after client-side hydration
  if (!hasMounted) {
    // Return a placeholder with the same height to prevent layout shift
    return (
      <div className="relative flex h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)]">
        <div className="w-full">{/* Loading placeholder */}</div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100vh)] sm:h-[calc(100vh-5rem)]">
      {/* 移动端切换按钮 */}
      {isMobile && (
        <div className="absolute left-0 top-5 z-20 flex w-[30px] items-center justify-between rounded-r-xl bg-gray-100/80 text-gray-500 shadow-sm">
          <button
            className="rounded-lg px-1.5 py-1.5"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            {isChatOpen ? (
              <ChevronLeftIcon className="h-5 w-5" />
            ) : (
              <ChevronRightIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      )}

      {/* 左侧聊天框 - 可收起 */}
      <div
        className={`absolute left-0 top-0 transition-transform duration-300 ease-in-out ${
          isChatOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: isMobile && isChatOpen ? '100%' : '33.333333%',
          zIndex: isMobile && isChatOpen ? 10 : 'auto',
          height: isMobile ? '100%' : '100%', // 改回100%
          position: isMobile ? 'fixed' : 'absolute',
          top: 0, // 移除额外的top间距
        }}
      >
        <div className={`h-full ${isMobile ? 'px-0 pb-0 pt-0' : 'px-4 pb-4'}`}>
          <div
            className={`flex h-full flex-col rounded-lg bg-white ${
              isMobile && isChatOpen ? 'h-screen' : 'shadow-card'
            }`}
          >
            {/* 提示文字 */}
            {messages.length === 0 ? (
              <div className="relative flex h-full flex-col">
                <div className="mb-3 flex flex-1 flex-col items-center justify-center space-y-4 text-gray-500">
                  <div className="mb-1">
                    <p className="text-center text-lg font-bold md:text-xl">
                      Welcome to{' '}
                      <span className="text-[#f0b90b]">BNBOT</span>
                    </p>
                    <p className="text-center text-xs md:text-md">
                      AI-powered crypto intelligence on{' '}
                      <span className="text-[#f0b90b]">BNB Chain</span>
                    </p>
                  </div>

                  {/* 输入框部分 */}
                  <div className="w-full px-4">
                    <form onSubmit={handleSubmit} className="w-full">
                      <div className="relative flex items-end">
                        <textarea
                          ref={inputRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Ask me anything…"
                          rows={3}
                          className="scrollbar-none max-h-[200px] min-h-[44px] w-full resize-none rounded-2xl border border-gray-100 bg-white py-3 pl-4 pr-12 text-black focus:border-gray-300 focus:outline-none focus:ring-0"
                          style={{
                            lineHeight: '1.5',
                            height: 'auto',
                          }}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                          }}
                        />
                        <button
                          type="submit"
                          disabled={isLoading || !input.trim()}
                          className="absolute bottom-2 right-2 rounded-full bg-black p-1 p-1.5 font-bold text-[#f0b90b] hover:bg-gray-800 disabled:bg-gray-300 disabled:text-white disabled:hover:bg-gray-300"
                        >
                          <ArrowUpIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </form>
                  </div>
                  <div className="flex w-full max-w-md flex-wrap justify-center gap-2 px-4">
                    <button className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-center text-xs hover:bg-gray-50">
                      Crypto Trends
                    </button>
                    <button className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-center text-xs hover:bg-gray-50">
                      New Assets
                    </button>
                    <button className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-center text-xs hover:bg-gray-50">
                      Token Analysis
                    </button>
                  </div>
                </div>

                {/* Disclaimer - 固定在底部 */}
                <div className="absolute bottom-1 left-0 right-0 px-4 text-center">
                  <p className="text-[12px] text-gray-400 md:text-xs">
                    BNBOT may make mistakes, Not financial advice.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative flex h-full flex-col">
                <div
                  ref={chatContainerRef}
                  onScroll={handleChatScroll}
                  className="scrollbar-none mb-10 flex-1 overflow-y-auto p-4 pb-24"
                >
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="mb-6 w-full"
                    >
                      <div
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`${message.role === 'user' ? 'max-w-[80%]' : 'max-w-[100%]'}`}
                        >
                          <div
                            className={`rounded-3xl ${
                              message.role === 'user'
                                ? 'rounded-br-lg bg-gray-100 px-6 py-3 text-black'
                                : 'bg-transparent text-black'
                            }`}
                          >
                            {message.role === 'assistant' ? (
                              <MessageContent content={message.content} />
                            ) : (
                              <p className="whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            )}
                          </div>

                          {message.role === 'assistant' && !isLoading && (
                            <div className="mt-1 flex space-x-2">
                              <button
                                onClick={() =>
                                  handleCopyMessage(
                                    message.content,
                                    `msg-${index}`,
                                  )
                                }
                                className="text-gray-500 transition-colors hover:text-gray-700"
                                title={
                                  copiedMessageId === `msg-${index}`
                                    ? 'Copied!'
                                    : 'Copy message'
                                }
                              >
                                {copiedMessageId === `msg-${index}` ? (
                                  <CheckIcon className="h-4 w-4 text-green-500" />
                                ) : (
                                  <DocumentDuplicateIcon className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  // Handle regenerating the response
                                  const userMessages = messages.filter(
                                    (msg) => msg.role === 'user',
                                  );
                                  if (userMessages.length > 0) {
                                    const lastUserMessage =
                                      userMessages[userMessages.length - 1];
                                    setInput(lastUserMessage.content);
                                  }
                                }}
                                className="text-gray-500 transition-colors hover:text-gray-700"
                                title="Regenerate response"
                              >
                                <ArrowPathIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {currentAssistantMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 w-full"
                    >
                      <div className="flex justify-start">
                        <div className="max-w-[95%]">
                          <div className="rounded-lg bg-transparent">
                            <MessageContent content={currentAssistantMessage} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {isLoading && !currentAssistantMessage && (
                    <div className="flex justify-start pl-0">
                      <div className="max-w-[85%] rounded-lg bg-transparent px-2 py-2">
                        <div className="flex items-center space-x-5">
                          <span className="loading loading-dots loading-xs bg-[#f0b90b]"></span>

                          <div className="flex space-x-1">
                            {/* <div className="h-1 w-1 animate-pulse rounded-full bg-gray-400"></div>
                            <div className="animation-delay-200 h-1 w-1 animate-pulse rounded-full bg-gray-400"></div>
                            <div className="animation-delay-400 h-1 w-1 animate-pulse rounded-full bg-gray-400"></div> */}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* 输入框部分 - 绝对定位 */}
                <div className="absolute bottom-0 left-0 right-0 bg-transparent p-3">
                  <form onSubmit={handleSubmit}>
                    {isLoading && !isLoggedIn && (
                      <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900">
                              Sign in to continue with X Insight AI
                            </h3>
                            <p className="mt-1 text-[14px] text-gray-500">
                              Enjoy more features when you sign in.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="ease-spring ml-4 transform rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-110 hover:bg-gray-800 active:scale-90"
                          >
                            Sign in
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="relative flex items-end">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message BNBot..."
                        rows={3}
                        className="scrollbar-none max-h-[200px] min-h-[44px] w-full resize-none rounded-2xl border border-gray-100 bg-white py-3 pl-4 pr-12 text-black focus:border-gray-300 focus:outline-none focus:ring-0"
                        style={{
                          lineHeight: '1.5',
                          height: 'auto',
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute bottom-2 right-2 rounded-full bg-[#f0b90b] p-1 p-1.5 font-bold text-white hover:bg-gray-800 disabled:bg-[#f0b90b]/50 disabled:text-white disabled:hover:bg-gray-300"
                      >
                        <ArrowUpIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧面板 - 动态宽度 */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isChatOpen
            ? isMobile
              ? 'ml-0 w-full opacity-0' // On mobile when chat is open, hide but keep in DOM
              : 'ml-[33.333333%] w-2/3' // On desktop when chat is open
            : 'ml-0 w-full' // When chat is closed (both mobile and desktop)
        }`}
        style={{
          pointerEvents: isMobile && isChatOpen ? 'none' : 'auto',
        }}
      >
        <div className={`h-full ${isMobile ? 'px-0 pb-0' : 'px-4 pb-4'}`}>
          <div className="relative h-full rounded-lg bg-white p-4 shadow-card">
            <div
              className={`flex items-center justify-between ${isMobile ? 'hidden' : ''}`}
            >
              <div className="flex items-center gap-4">
                <button className="rounded-lg p-0.5">
                  <ChevronLeftIcon
                    className="h-5 w-5"
                    onClick={() => setIsChatOpen(!isChatOpen)}
                  />
                </button>

                <div className="flex items-center rounded-full bg-gray-100 p-1">
                  <button
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      activeTab === 'preview'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('preview')}
                  >
                    Preview
                  </button>
                  <button
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      activeTab === 'board'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('board')}
                  >
                    Board
                  </button>
                </div>
              </div>

              <div className="flex select-none items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5">
                <span className="relative flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
                  <span className="absolute h-3.5 w-3.5 rounded-full bg-[#f0b90b]/20" />
                  <span className="blink relative block h-1.5 w-1.5 rounded-full bg-[#f0b90b]" />
                </span>
                <span className="text-xs text-gray-600">AI Monitoring</span>
              </div>
            </div>

            <div
              className="scrollbar-none h-full overflow-y-auto md:mt-4 md:h-[calc(100%-4rem)]"
              onScroll={handleChatScroll}
            >
              {activeTab === 'board' ? (
                <Masonry
                  breakpointCols={breakpointColumnsObj}
                  className="-ml-4 flex w-auto"
                  columnClassName="pl-4 bg-clip-padding"
                >
                  {tweets.map((tweet) => (
                    <div
                      id={`tweet-${tweet.id_str}`}
                      className="tweet-container mb-4"
                      key={tweet.id_str}
                    >
                      <TweetCard
                        tweet={tweet}
                        username={tweet.user.username}
                        avatar={tweet.user.avatar}
                        name={tweet.user.name}
                      />
                    </div>
                  ))}
                </Masonry>
              ) : (
                // Preview 视图的内容
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Preview 视图的内容 */}
                  preview content
                </div>
              )}

              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
