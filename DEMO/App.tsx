import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { APP_KEY, SERVER_URLS } from './src/api/config';
import { getToken } from './src/utils/auth';
import { ActivityIndicator, View } from 'react-native';
import JuggleIM, { JuggleIMCall } from 'juggleim-rnsdk';
import { TextCardMessage } from './src/messages/TextCardMessage';
import { BusinessCardMessage } from './src/messages/BusinessCardMessage';
import { GroupNotifyMessage } from './src/messages/GroupNotifyMessage';
import { FriendNotifyMessage } from './src/messages/FriendNotifyMessage';
// 注册消息渲染器
import './src/message-renderers';

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    const init = async () => {
      JuggleIM.setServerUrls(SERVER_URLS);
      JuggleIM.init(APP_KEY);
      const session = await getToken();
      if (session) {
        JuggleIM.connect(session.token);
        setInitialRoute('Main');
      }
      JuggleIM.registerCustomMessageType('demo:textcard', TextCardMessage);
      JuggleIM.registerCustomMessageType('demo:businesscard', BusinessCardMessage);
      JuggleIM.registerCustomMessageType('jgd:grpntf', GroupNotifyMessage);
      JuggleIM.registerCustomMessageType('jgd:friendntf', FriendNotifyMessage);
      JuggleIMCall.initZegoEngine(1881186044);
      setInitializing(false);
    };

    init();
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator initialRouteName={initialRoute} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
