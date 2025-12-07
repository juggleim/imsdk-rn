import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { APP_KEY, SERVER_URLS } from './src/api/config';
import { getToken } from './src/utils/auth';
import { ActivityIndicator, View } from 'react-native';
import JuggleIM from 'juggleim-rnsdk';

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    const init = async () => {
      // Initialize SDK
      JuggleIM.setServerUrls(SERVER_URLS);
      JuggleIM.init(APP_KEY);
      JuggleIM.addConnectionStatusListener(
        'connectionStatusListener',
        status => {
          console.log('Connection status:', status);
        },
      );

      // Check for cached token
      const session = await getToken();
      if (session) {
        // Connect if token exists
        JuggleIM.connect(session.token);
        setInitialRoute('Main');
      }
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
