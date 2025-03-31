import routes from '@/config/routes';
import { HomeIcon } from '@/components/icons/home';
import { FarmIcon } from '@/components/icons/farm';
import { PoolIcon } from '@/components/icons/pool';
import { ProfileIcon } from '@/components/icons/profile';
import { DiskIcon } from '@/components/icons/disk';
import { ExchangeIcon } from '@/components/icons/exchange';
import { VoteIcon } from '@/components/icons/vote-icon';
import { PlusCircle } from '@/components/icons/plus-circle';
import { CompassIcon } from '@/components/icons/compass';
import { LivePricing } from '@/components/icons/live-pricing';
import { LockIcon } from '@/components/icons/lock-icon';
import { TradingBotIcon } from '@/components/icons/trading-bot-icon';

export const defaultMenuItems = [
  {
    name: 'Chat',
    icon: <HomeIcon />,
    href: routes.home,
  },
  {
    name: 'AI Task',
    icon: <TradingBotIcon />,
    href: routes.create,
  },
  {
    name: 'Boost',
    icon: <TradingBotIcon />,
    href: routes.boost,
  },
  {
    name: 'Message',
    icon: <LivePricing />,
    href: routes.message,
  },
];

export const MinimalMenuItems = [
  {
    name: 'Chat',
    icon: <HomeIcon />,
    href: routes.home,
  },
  {
    name: 'AI Task',
    icon: <HomeIcon />,
    href: routes.create,
  },
  {
    name: 'Boost',
    icon: <TradingBotIcon />,
    href: routes.boost,
  },
  {
    name: 'Message',
    icon: <TradingBotIcon />,
    href: routes.message,
  },
];
