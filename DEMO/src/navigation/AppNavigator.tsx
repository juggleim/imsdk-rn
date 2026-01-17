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
import DiscoverScreen from '../screens/DiscoverScreen';
import MomentScreen from '../screens/MomentScreen';
import PublishMomentScreen from '../screens/PublishMomentScreen';
import ConversationInfoScreen from '../screens/ConversationInfoScreen';
import GroupAnnouncementScreen from '../screens/GroupAnnouncementScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import VideoCallScreen from '../screens/VideoCallScreen';
import CallSelectMemberScreen from '../screens/CallSelectMemberScreen';
import { Image } from 'react-native';
import AddButton from '../components/AddButton';
import { useNavigation } from '@react-navigation/native';
// i18n support
import { t } from '../i18n/config';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const navigation = useNavigation<any>();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconSource;
          if (route.name === 'Chats') {
            iconSource = require('../assets/icons/chat.png');
          } else if (route.name === 'Contacts') {
            iconSource = require('../assets/icons/avatar.png');
          } else if (route.name === 'Discover') {
            iconSource = require('../assets/icons/discover.png');
          } else if (route.name === 'Me') {
            iconSource = require('../assets/icons/me.png');
          }
          return <Image source={iconSource} style={{ width: size, height: size, tintColor: color }} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}>
      <Tab.Screen
        name="Chats"
        component={ConversationListScreen}
        options={{
          headerShown: true,
          title: t('nav.conversation'),
          headerRight: () => (
            <AddButton
              onAddFriend={() => navigation.navigate('SearchFriends')}
              onCreateGroup={() => navigation.navigate('CreateGroup')}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{ title: t('nav.contacts') }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ title: t('nav.settings') }}
      />
      <Tab.Screen
        name="Me"
        component={ProfileScreen}
        options={{ title: t('nav.profile') }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = ({ initialRouteName }: { initialRouteName: string }) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="MessageList" component={MessageListScreen} />
      <Stack.Screen
        name="SearchFriends"
        component={SearchFriendsScreen}
        options={{ headerShown: true, title: t('contacts.searchFriends') }}
      />
      <Stack.Screen
        name="NewFriends"
        component={NewFriendsScreen}
        options={{ headerShown: true, title: t('contacts.newFriends') }}
      />
      <Stack.Screen
        name="Moment"
        component={MomentScreen}
        options={{ headerShown: true, title: 'Moments' }}
      />
      <Stack.Screen
        name="PublishMoment"
        component={PublishMomentScreen}
        options={{ headerShown: true, title: '发朋友圈' }}
      />
      <Stack.Screen
        name="ConversationInfo"
        component={ConversationInfoScreen}
        options={{ headerShown: true, title: t('conversationInfo.title') }}
      />
      <Stack.Screen
        name="GroupAnnouncement"
        component={GroupAnnouncementScreen}
        options={{ headerShown: true, title: t('group.announcement') }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ headerShown: true, title: t('group.create') }}
      />
      <Stack.Screen
        name="VideoCall"
        component={VideoCallScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="CallSelectMember"
        component={CallSelectMemberScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
