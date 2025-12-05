import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from '../screens/LoginScreen';
import ConversationListScreen from '../screens/ConversationListScreen';
import MessageListScreen from '../screens/MessageListScreen';
import ContactsScreen from '../screens/ContactsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchFriendsScreen from '../screens/SearchFriendsScreen';
import NewFriendsScreen from '../screens/NewFriendsScreen';
import { Image, Text } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          // You can replace these with actual icons or images
          if (route.name === 'Chats') {
            return <TextIcon text="💬" color={color} />;
          } else if (route.name === 'Contacts') {
            return <TextIcon text="👥" color={color} />;
          } else if (route.name === 'Me') {
            return <TextIcon text="👤" color={color} />;
          }
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}>
      <Tab.Screen name="Chats" component={ConversationListScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="Me" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const TextIcon = ({ text, color }: { text: string; color: string }) => (
  <Text style={{ color, fontSize: 24 }}>{text}</Text>
);

const AppNavigator = ({ initialRouteName }: { initialRouteName: string }) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="MessageList" component={MessageListScreen} />
      <Stack.Screen name="SearchFriends" component={SearchFriendsScreen} options={{ headerShown: true, title: 'Search Friends' }} />
      <Stack.Screen name="NewFriends" component={NewFriendsScreen} options={{ headerShown: true, title: 'New Friends' }} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
