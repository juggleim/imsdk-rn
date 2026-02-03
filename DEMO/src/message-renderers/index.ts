/**
 * 消息渲染器统一注册入口
 *
 * 在应用启动时调用此文件，注册所有内置渲染器
 *
 * @example
 * ```ts
 * // 在 App.tsx 或入口文件中
 * import './message-renderers';
 * ```
 */

import { messageRendererRegistry } from './MessageRendererRegistry';

// SDK 内置消息渲染器
import { TextMessageRenderer } from './renderers/TextMessageRenderer';
import { ImageMessageRenderer } from './renderers/ImageMessageRenderer';
import { VoiceMessageRenderer } from './renderers/VoiceMessageRenderer';
import { FileMessageRenderer } from './renderers/FileMessageRenderer';
import { VideoMessageRenderer } from './renderers/VideoMessageRenderer';
import { RecallMessageRenderer } from './renderers/RecallMessageRenderer';
import { MergeMessageRenderer } from './renderers/MergeMessageRenderer';
import { CallFinishNotifyRenderer } from './renderers/CallFinishNotifyRenderer';
import { StreamTextMessageRenderer } from './renderers/StreamTextMessageRenderer';

// Demo 自定义消息渲染器
import { TextCardMessageRenderer } from './renderers/TextCardMessageRenderer';
import { BusinessCardMessageRenderer } from './renderers/BusinessCardMessageRenderer';
import { SystemMessageRenderer } from './renderers/SystemMessageRenderer';

/**
 * 注册所有内置渲染器
 *
 * 注意：
 * - SDK 内置类型优先级较高（10-40）
 * - 自定义类型优先级中等（50-60）
 * - 系统消息优先级较低（90-100）
 * - 如需覆盖，使用 override: true
 */
export function registerBuiltinRenderers() {
  // SDK 内置消息（优先级 10-40）
  messageRendererRegistry.register({ renderer: new TextMessageRenderer() });
  messageRendererRegistry.register({ renderer: new ImageMessageRenderer() });
  messageRendererRegistry.register({ renderer: new VoiceMessageRenderer() });
  messageRendererRegistry.register({ renderer: new FileMessageRenderer() });
  messageRendererRegistry.register({ renderer: new VideoMessageRenderer() });
  messageRendererRegistry.register({ renderer: new CallFinishNotifyRenderer() });
  messageRendererRegistry.register({ renderer: new MergeMessageRenderer() });
  messageRendererRegistry.register({ renderer: new RecallMessageRenderer() });
  messageRendererRegistry.register({ renderer: new StreamTextMessageRenderer() });

  // Demo 自定义消息（优先级 50-60）
  messageRendererRegistry.register({ renderer: new TextCardMessageRenderer() });
  messageRendererRegistry.register({ renderer: new BusinessCardMessageRenderer() });

  // 系统消息（优先级 90-100）
  messageRendererRegistry.register({ renderer: new SystemMessageRenderer() });

  console.log(`[MessageRenderers] Registered ${messageRendererRegistry.size} builtin renderers`);
}

// 自动注册（当导入此模块时）
registerBuiltinRenderers();

// 导出核心类和类型
export { messageRendererRegistry } from './MessageRendererRegistry';
export { BaseMessageRenderer } from './BaseMessageRenderer';
export { MessageBubbleContainer } from './MessageBubbleContainer';
export * from './types';

// 导出所有渲染器类（供外部扩展使用）
export { TextMessageRenderer } from './renderers/TextMessageRenderer';
export { ImageMessageRenderer } from './renderers/ImageMessageRenderer';
export { VoiceMessageRenderer } from './renderers/VoiceMessageRenderer';
export { FileMessageRenderer } from './renderers/FileMessageRenderer';
export { VideoMessageRenderer } from './renderers/VideoMessageRenderer';
export { RecallMessageRenderer } from './renderers/RecallMessageRenderer';
export { MergeMessageRenderer } from './renderers/MergeMessageRenderer';
export { CallFinishNotifyRenderer } from './renderers/CallFinishNotifyRenderer';
export { StreamTextMessageRenderer } from './renderers/StreamTextMessageRenderer';
export { TextCardMessageRenderer } from './renderers/TextCardMessageRenderer';
export { BusinessCardMessageRenderer } from './renderers/BusinessCardMessageRenderer';
export { SystemMessageRenderer } from './renderers/SystemMessageRenderer';
