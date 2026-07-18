# JuggleIM React Native SDK

[English documentation](https://github.com/juggleim/imsdk-rn#readme) | [简体中文文档](https://github.com/juggleim/imsdk-rn/blob/main/README.zh-CN.md)

[![npm version](https://img.shields.io/npm/v/juggleim-rnsdk?logo=npm)](https://www.npmjs.com/package/juggleim-rnsdk)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/juggleim/imsdk-rn/blob/main/LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-%3E%3D0.60-61DAFB?logo=react)](https://reactnative.dev/)

JuggleIM is a React Native chat and instant messaging SDK for iOS and Android. It provides TypeScript definitions and native support for private chat, group chat, chat rooms, rich media messages, read receipts, reactions, conversation management, voice/video calls, social moments, and AI streaming messages.

## Features

- Private chat, group chat, chat rooms, and system conversations
- Text, image, file, voice, video, custom, merged, and streaming messages
- Message history, search, recall, deletion, reactions, and read receipts
- Unread counts, drafts, mute, pin, mentions, and conversation tags
- One-to-one and multi-party voice/video calls
- User/group profiles and social moments
- React Native 0.60+, Android 21+, iOS 9+, and TypeScript declarations

## Installation

```bash
npm install juggleim-rnsdk --legacy-peer-deps
```

Add the JuggleIM Maven repository to Android:

```groovy
allprojects {
    repositories {
        maven { url "https://repo.juggle.im/repository/maven-releases/" }
    }
}
```

For Android voice/video calls, also add:

```groovy
maven { url "https://storage.zego.im/maven" }
```

For iOS, run `pod install` from the `ios` directory after installing the npm package.

## Quick start

```javascript
import JuggleIM, { TextMessageContent } from 'juggleim-rnsdk';

JuggleIM.setServerUrls(['your_server_url']);
JuggleIM.init('your_app_key');
JuggleIM.connect('your_user_token');

JuggleIM.sendMessage(
  {
    conversationType: 1,
    conversationId: 'recipient_user_id',
    content: new TextMessageContent('Hello from React Native!')
  },
  {
    onSuccess: message => console.log('Sent:', message),
    onError: (message, errorCode) => console.error('Send failed:', errorCode)
  }
);
```

## Documentation and support

- [English documentation](https://github.com/juggleim/imsdk-rn#readme)
- [简体中文文档](https://github.com/juggleim/imsdk-rn/blob/main/README.zh-CN.md)
- [Complete API examples](https://github.com/juggleim/imsdk-rn/blob/main/docs/API.zh-CN.md)
- [Demo application](https://github.com/juggleim/imsdk-rn/tree/main/DEMO)
- [GitHub Issues](https://github.com/juggleim/imsdk-rn/issues)

## License

[Apache License 2.0](https://github.com/juggleim/imsdk-rn/blob/main/LICENSE)
