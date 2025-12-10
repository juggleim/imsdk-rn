import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import JuggleIM from 'juggleim-rnsdk';
import { saveToken, saveUserInfo } from '../utils/auth';
import { useNavigation } from '@react-navigation/native';
import { login } from '../api/auth';
import CryptoJS from 'crypto-js';

const LoginScreen = () => {
  const [userId, setUserId] = useState('opopop');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const handleLogin = async (userId: string, password: string) => {
    if (!userId) {
      Alert.alert('Error', 'Please enter a User ID');
      return;
    }

    setLoading(true);
    try {
      console.log('Logging in with', userId, password);
      const hash = CryptoJS.MD5(password).toString();
      const response = await login(userId, hash);
      console.log('Login response:', response);
      const token = response.im_token;
      const userName = response.nickname;
      const userAvatar = response.avatar;
      saveUserInfo(userName, userAvatar);
      onConnect(token, userId);
    } catch (error) {
      console.error(error);
      Alert.alert('Login Failed', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onConnect = async (token: string, uid: string) => {
    setLoading(true);
    try {
      JuggleIM.connect(token);
      await saveToken(token, uid);
      navigation.replace('Main');
    } catch (e) {
      Alert.alert('Error', 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>JuggleIM Chat</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>User ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter User ID"
          value={userId}
          onChangeText={setUserId}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Password"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />
      </View>

      {/* For simplicity in sample, we might need a token input if we don't have a backend to generate it */}
      {/* But usually sample apps have a hardcoded token or a way to get it. */}
      {/* I will add a Token input for now. */}

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleLogin(userId, password)}>
        {/* Using userId as token for now, assuming test env or user inputs token as ID */}
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
