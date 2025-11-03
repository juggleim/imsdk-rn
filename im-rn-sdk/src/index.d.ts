declare module 'im-rn-sdk' {
  /**
   * 连接状态类型
   */
  export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'failure' | 'dbOpen' | 'dbClose';
  
  /**
   * 连接状态监听器回调函数
   * @param status 连接状态
   * @param code 错误码，在 failure 状态时有效，其它状态均为 0
   * @param extra 附加信息
   */
  export type ConnectionStatusListener = (status: ConnectionStatus, code: number, extra: string) => void;
  
  /**
   * Juggle IM React Native SDK
   * @class JuggleIM
   */
  export default class JuggleIM {
    /**
     * 设置服务器地址列表
     * @param urls 服务器地址列表
     */
    static setServerUrls(urls: string[]): void;

    /**
     * 初始化SDK
     * @param appKey 应用唯一标识
     */
    static init(appKey: string): void;
    
    /**
     * 连接到服务器
     * @param token 用户token
     */
    static connect(token: string): void;
    
    /**
     * 添加连接状态监听器
     * @param key 监听器标识
     * @param listener 监听器回调函数
     * @returns 返回取消监听的函数
     */
    static addConnectionStatusListener(key: string, listener: ConnectionStatusListener): () => void;
  }
}