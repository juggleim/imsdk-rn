import { Message } from 'juggleim-rnsdk';
import {
  IMessageRenderer,
  RendererRegistration,
  RendererLookupResult,
  MessageRenderContext,
} from './types';

/**
 * 消息渲染器注册中心
 *
 * 单例模式，全局统一管理所有消息类型的渲染器
 *
 * @example
 * ```ts
 * // 注册渲染器
 * registry.register(new TextMessageRenderer());
 *
 * // 查找渲染器
 * const renderer = registry.findRenderer(message);
 * ```
 */
export class MessageRendererRegistry {
  private static instance: MessageRendererRegistry;

  /** 渲染器映射表：contentType -> renderer */
  private renderers = new Map<string, IMessageRenderer>();

  /** 优先级排序的渲染器列表（用于模糊匹配） */
  private sortedRenderers: IMessageRenderer[] = [];

  private constructor() {}

  static getInstance(): MessageRendererRegistry {
    if (!MessageRendererRegistry.instance) {
      MessageRendererRegistry.instance = new MessageRendererRegistry();
    }
    return MessageRendererRegistry.instance;
  }

  /**
   * 注册单个渲染器
   */
  register(config: RendererRegistration): void {
    const { renderer, override = false } = config;

    if (!override && this.renderers.has(renderer.contentType)) {
      console.warn(
        `[MessageRendererRegistry] Renderer for "${renderer.contentType}" already exists. ` +
          `Use override: true to replace it.`,
      );
      return;
    }

    this.renderers.set(renderer.contentType, renderer);
    this.updateSortedRenderers();

    console.log(
      `[MessageRendererRegistry] Registered renderer: ${renderer.contentType} ` +
        `(mode: ${renderer.renderMode}, priority: ${renderer.priority || 100})`,
    );
  }

  /**
   * 批量注册渲染器
   */
  registerBatch(renderers: RendererRegistration[]): void {
    renderers.forEach((config) => this.register(config));
  }

  /**
   * 注销渲染器
   */
  unregister(contentType: string): boolean {
    const deleted = this.renderers.delete(contentType);
    if (deleted) {
      this.updateSortedRenderers();
      console.log(`[MessageRendererRegistry] Unregistered renderer: ${contentType}`);
    }
    return deleted;
  }

  /**
   * 查找渲染器（精确匹配）
   */
  findRenderer(contentType: string): IMessageRenderer | null {
    return this.renderers.get(contentType) || null;
  }

  /**
   * 查找渲染器（智能匹配）
   *
   * 1. 首先尝试精确匹配
   * 2. 如果未找到，遍历所有渲染器的 canRender 方法
   * 3. 返回第一个匹配的渲染器（按优先级排序）
   */
  findBestRenderer(message: Message): RendererLookupResult {
    const contentType = message.content.contentType;

    // 1. 精确匹配
    const exactRenderer = this.renderers.get(contentType);
    if (exactRenderer) {
      return {
        renderer: exactRenderer,
        contentType,
        isExactMatch: true,
      };
    }

    // 2. 模糊匹配（遍历所有渲染器的 canRender）
    for (const renderer of this.sortedRenderers) {
      if (renderer.canRender && renderer.canRender(message)) {
        return {
          renderer,
          contentType: renderer.contentType,
          isExactMatch: false,
        };
      }
    }

    // 3. 未找到
    return {
      renderer: null,
      contentType,
      isExactMatch: false,
    };
  }

  /**
   * 获取所有已注册的渲染器
   */
  getAllRenderers(): IMessageRenderer[] {
    return Array.from(this.renderers.values());
  }

  /**
   * 清空所有渲染器（主要用于测试）
   */
  clear(): void {
    this.renderers.clear();
    this.sortedRenderers = [];
    console.warn('[MessageRendererRegistry] All renderers cleared');
  }

  /**
   * 更新优先级排序的渲染器列表
   */
  private updateSortedRenderers(): void {
    this.sortedRenderers = Array.from(this.renderers.values()).sort(
      (a, b) => (a.priority || 100) - (b.priority || 100),
    );
  }

  /**
   * 检查渲染器是否已注册
   */
  has(contentType: string): boolean {
    return this.renderers.has(contentType);
  }

  /**
   * 获取已注册渲染器数量
   */
  get size(): number {
    return this.renderers.size;
  }
}

// 导出单例实例
export const messageRendererRegistry = MessageRendererRegistry.getInstance();
