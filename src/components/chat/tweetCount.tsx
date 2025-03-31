'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface TrendData {
  timestamp: string;
  discussions: number;
  reach: number;
  scaledReach: number;
  holders: number;
}

interface TokenMetrics {
  discussions: number;
  potentialReach: number;
  holders: number;
}

interface TwitterUser {
  rest_id: string;
  legacy: {
    followers_count: number;
  };
}

interface TweetResult {
  core: {
    user_results: {
      result: TwitterUser;
    };
  };
  legacy: {
    full_text: string;
    created_at: string;
  };
}

interface TweetEntry {
  content: {
    itemContent: {
      tweet_results: {
        result: TweetResult;
      };
    };
  };
}

interface Tweet {
  id: string;
  authorId: string;
  followers: number;
  timestamp: string;
}

interface TwitterResponse {
  data: {
    data: {
      search_by_raw_query: {
        search_timeline: {
          timeline: {
            instructions: {
              entries: TweetEntry[];
              entry_id_to_replace?: string;
            }[];
          };
        };
      };
    };
  };
}

const parseTwitterDate = (twitterDate: string): Date => {
  // Twitter date format: "Fri Feb 07 11:57:16 +0000 2025"
  return new Date(twitterDate);
};

export default function XTrend() {
  const [tokenName, setTokenName] = useState('');
  const [metrics, setMetrics] = useState<TokenMetrics>({
    discussions: 0,
    potentialReach: 0,
    holders: 0,
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [allTweets, setAllTweets] = useState<Map<string, Tweet>>(new Map());
  const [lastPointTime, setLastPointTime] = useState<Date | null>(null);

  const scaleValue = (value: number): number => {
    return Math.log10(value + 1);
  };

  const fetchTwitterData = async () => {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      
      let allTweets: Tweet[] = [];
      let cursor: string | undefined;
      
      // 循环获取所需的所有推文
      do {
        const apiUrl = `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}/api/v1/x/search?words=${tokenName}${cursor ? `&cursor=${cursor}` : ''}`;
        
        const response = await fetch(apiUrl, {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_X_API_KEY || '',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const responseData = await response.json();
        
        if (responseData.code !== 1 || !responseData.data?.data) {
          console.error('Invalid API response:', responseData);
          break;
        }

        const twitterData = responseData.data.data;
        const instructions = twitterData?.search_by_raw_query?.search_timeline?.timeline?.instructions;
        
        if (!instructions || !Array.isArray(instructions)) {
          console.error('No instructions found in response:', twitterData);
          break;
        }

        const tweets: Tweet[] = [];
        cursor = undefined;

        for (const instruction of instructions) {
          if (instruction.type === "TimelineAddEntries") {
            for (const entry of instruction.entries) {
              if (entry.content?.itemContent?.tweet_results?.result) {
                const tweetData = entry.content.itemContent.tweet_results.result;
                const tweet: Tweet = {
                  id: tweetData.rest_id,
                  authorId: tweetData.core.user_results.result.rest_id,
                  timestamp: new Date(tweetData.legacy.created_at).toISOString(),
                  followers: tweetData.core.user_results.result.legacy.followers_count || 0,
                };
                tweets.push(tweet);
              }
            }
          } else if (instruction.type === "TimelineReplaceEntry" && 
                     instruction.entry?.content?.cursorType === "Bottom") {
            cursor = instruction.entry.content.value;
          }
        }

        allTweets = [...allTweets, ...tweets];

        // 如果是首次获取数据且需要历史数据，继续获取
        if (!lastPointTime && cursor && tweets.length > 0) {
          const oldestTweet = tweets[tweets.length - 1];
          const oldestTweetTime = new Date(oldestTweet.timestamp);
          
          if (oldestTweetTime > oneHourAgo) {
            continue;
          }
        }
        
        break;
      } while (true);

      // 更新推文集合
      const updatedTweets = new Map();
      allTweets.forEach(tweet => {
        updatedTweets.set(tweet.id, tweet);
      });
      setAllTweets(updatedTweets);

      // 计算1小时内的总曝光量
      const hourTweets = allTweets.filter(tweet => {
        const tweetDate = new Date(tweet.timestamp);
        return tweetDate >= oneHourAgo;
      });
      const totalHourReach = hourTweets.reduce((acc, tweet) => acc + tweet.followers, 0);

      // 计算10分钟内的讨论数
      const recentTweets = allTweets.filter(tweet => {
        const tweetDate = new Date(tweet.timestamp);
        return tweetDate >= tenMinutesAgo;
      });
      const recentUsers = new Set(recentTweets.map(tweet => tweet.authorId));

      // 创建新的数据点
      const newDataPoint = {
        timestamp: now.toISOString(),
        discussions: recentUsers.size,
        reach: totalHourReach,
        scaledReach: scaleValue(totalHourReach),
        holders: 0,
      };

      // 更新趋势数据
      setTrendData(prev => [...prev.slice(-29), newDataPoint]);
      setLastPointTime(now);

      // 更新指标
      setMetrics({
        discussions: recentUsers.size,
        potentialReach: totalHourReach,
        holders: 0,
      });

    } catch (error) {
      console.error('Error in fetch:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring) {
      fetchTwitterData(); // Initial fetch
      interval = setInterval(fetchTwitterData, 10000); // 每10秒请求一次
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, tokenName]);

  // Reset all data when starting new monitoring
  const startMonitoring = () => {
    if (!tokenName.trim()) {
      console.error('Please enter a token name');
      return;
    }
    setAllTweets(new Map());
    setTrendData([]);
    setMetrics({
      discussions: 0,
      potentialReach: 0,
      holders: 0,
    });
    setLastPointTime(null);
    setIsMonitoring(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">X Trend - Token Monitor</h1>
      
      <div className="flex gap-4 mb-8">
        <input
          type="text"
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          placeholder="Enter token name (e.g., 'BTC' or 'ETH')"
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={startMonitoring}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Start Monitoring
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div 
          className="p-6 bg-white rounded-lg shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-semibold mb-2">Discussions</h2>
          <p className="text-3xl font-bold">{metrics.discussions}</p>
        </motion.div>

        <motion.div 
          className="p-6 bg-white rounded-lg shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold mb-2">Potential Reach</h2>
          <p className="text-3xl font-bold">{metrics.potentialReach}</p>
        </motion.div>

        <motion.div 
          className="p-6 bg-white rounded-lg shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold mb-2">Holders</h2>
          <p className="text-3xl font-bold">{metrics.holders}</p>
        </motion.div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Metrics Trends</h2>
        <LineChart 
          width={800} 
          height={400} 
          data={trendData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(timestamp) => {
              const date = new Date(timestamp);
              return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            }}
          />
          <YAxis 
            yAxisId="discussions"
            orientation="left" 
            stroke="#8884d8"
          />
          <YAxis 
            yAxisId="reach"
            orientation="right" 
            stroke="#82ca9d"
            tickFormatter={(value) => {
              return `${Math.round(Math.pow(10, value)).toLocaleString()}`;
            }}
          />
          <Tooltip 
            labelFormatter={(timestamp) => {
              const date = new Date(timestamp);
              return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            }}
            formatter={(value, name) => {
              if (name === "Reach (log scale)") {
                const originalValue = Math.round(Math.pow(10, Number(value)));
                return [originalValue.toLocaleString(), name];
              }
              return [value, name];
            }}
          />
          <Line 
            yAxisId="discussions"
            type="monotone" 
            dataKey="discussions" 
            stroke="#8884d8" 
            name="Discussions"
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
          <Line 
            yAxisId="reach"
            type="monotone" 
            dataKey="scaledReach" 
            stroke="#82ca9d" 
            name="Reach (log scale)"
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </div>
    </div>
  );
}
