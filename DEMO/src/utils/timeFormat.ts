import { getCurrentLanguage } from '../i18n/config';

/**
 * Format timestamp following WeChat's time display rules:
 * - Today: show time (e.g., "6:23")
 * - Yesterday: show "Yesterday" / "昨天"
 * - Within this week: show day of week (e.g., "周一" / "Mon")
 * - Within this year: show date (e.g., "1/15" or "15/1")
 * - Older: show full date (e.g., "2023/1/15" or "15/1/2023")
 */
export const formatConversationTime = (timestamp: number): string => {
  if (!timestamp) {
    return '';
  }

  const now = new Date();
  const msgDate = new Date(timestamp);
  const lang = getCurrentLanguage();

  // Reset time to midnight for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

  // Calculate difference in days
  const diffTime = today.getTime() - msgDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Today - show time only (HH:mm format, 12-hour without AM/PM)
  if (diffDays === 0) {
    const hours = msgDate.getHours();
    const minutes = msgDate.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  // Yesterday
  if (diffDays === 1) {
    return lang === 'zh' ? '昨天' : 'Yesterday';
  }

  // Within this week (2-6 days ago) - show day of week
  if (diffDays >= 2 && diffDays <= 6) {
    const daysOfWeek = lang === 'zh'
      ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return daysOfWeek[msgDate.getDay()];
  }

  // Within this year - show month/day
  if (msgDate.getFullYear() === now.getFullYear()) {
    const month = msgDate.getMonth() + 1;
    const day = msgDate.getDate();
    return lang === 'zh' ? `${month}/${day}` : `${day}/${month}`;
  }

  // Older - show full date
  const year = msgDate.getFullYear();
  const month = msgDate.getMonth() + 1;
  const day = msgDate.getDate();
  return lang === 'zh' ? `${year}/${month}/${day}` : `${day}/${month}/${year}`;
};
