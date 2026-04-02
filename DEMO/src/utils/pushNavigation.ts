export interface PushExtras {
  [key: string]: string | undefined;
}

export interface PushNavigationTarget {
  routeName: string;
  params?: Record<string, unknown>;
}

/**
 * 根据推送 extras 构建页面跳转目标
 * @param extras 推送附带的原始参数
 * @returns 跳转目标，不支持的页面返回 null
 */
export function buildPushNavigationTarget(
  extras: PushExtras
): PushNavigationTarget | null {
  if (extras.page === 'MessageList' && extras.targetId && extras.conversationType) {
    return {
      routeName: 'MessageList',
      params: {
        conversation: {
          conversationType: Number(extras.conversationType),
          conversationId: extras.targetId,
        },
        title: extras.title || extras.targetId,
        unreadCount: 0,
      },
    };
  }

  if (extras.page === 'SearchFriends') {
    return { routeName: 'SearchFriends' };
  }

  if (extras.page === 'Moment') {
    return { routeName: 'Moment' };
  }

  return null;
}
