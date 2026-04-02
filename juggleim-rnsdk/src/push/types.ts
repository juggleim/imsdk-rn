export interface PushExtras {
  [key: string]: string;
}

export interface NotificationClickListener {
  /**
   * 通知点击回调
   * @param extras 推送附带的原始参数
   */
  (extras: PushExtras): void;
}
