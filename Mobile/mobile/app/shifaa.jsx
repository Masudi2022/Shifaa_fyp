import React, { useRef, useState, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  TextInput, TouchableOpacity, Animated, KeyboardAvoidingView,
  Platform, TouchableWithoutFeedback, Keyboard, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { BASE_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';

const ChatDemo = () => {
  const { refreshAccessToken, user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const deviceId = 'my-device-id-123';

  const loadUserSessions = async () => {
    try {
      const token = (await AsyncStorage.getItem('access_token')) || (await refreshAccessToken());
      const res = await axios.get(`${BASE_URL}/sessions/user/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data);
    } catch (err) {
      console.error('Error loading sessions:', err.response?.data || err.message);
    }
  };

  const loadSessionMessages = async (id) => {
    try {
      setIsLoading(true);
      const token = (await AsyncStorage.getItem('access_token')) || (await refreshAccessToken());
      const res = await axios.get(`${BASE_URL}/sessions/${id}/messages/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formatted = res.data.map((msg) => ({
        id: msg.id.toString(),
        text: msg.text,
        sender: msg.is_user ? 'me' : 'other',
        time: new Date(msg.timestamp).toLocaleTimeString(),
        type: msg.type || 'text',
      }));
      setMessages(formatted.reverse());
    } catch (err) {
      console.error('Error loading messages:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    if (!sidebarOpen) loadUserSessions();
    Animated.timing(slideAnim, {
      toValue: sidebarOpen ? -300 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setSidebarOpen(!sidebarOpen);
  };

  const startNewSession = async () => {
    try {
      setIsLoading(true);
      const token = (await AsyncStorage.getItem('access_token')) || (await refreshAccessToken());
      const res = await axios.post(
        `${BASE_URL}/sessions/create/`,
        { device_id: deviceId, first_message: 'Mazungumzo mapya' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessionId(res.data.session_id);
      setMessages([]);
      Alert.alert('✅ Session Started', `Topic: ${res.data.topic}`);
      loadUserSessions();
      toggleSidebar();
    } catch (err) {
      console.error('Session creation error:', err.response?.data || err.message);
      Alert.alert('❌ Error', 'Failed to start a new session');
    } finally {
      setIsLoading(false);
    }
  };

  const selectSession = (session) => {
    setSessionId(session.session_id);
    loadSessionMessages(session.session_id);
    toggleSidebar();
  };

  const handleSend = async (customMessage) => {
    const messageToSend = customMessage || newMessage;
    if (!messageToSend.trim() || !sessionId) return;

    const token = (await AsyncStorage.getItem('access_token')) || (await refreshAccessToken());
    let email = user?.email || (await AsyncStorage.getItem('user_email'));

    if (!email) {
      Alert.alert('Error', 'User email is missing. Please log in again.');
      return;
    }

    const tempMsg = {
      id: Date.now().toString(),
      text: messageToSend,
      sender: 'me',
      time: new Date().toLocaleTimeString(),
      type: 'text'
    };
    setMessages((prev) => [tempMsg, ...prev]);

    try {
      const res = await axios.post(
        `${BASE_URL}/chat/`,
        { message: messageToSend, device_id: deviceId, user_email: email, session_id: sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.response) {
        const botMsg = {
          id: (Date.now() + 1).toString(),
          text: res.data.response,
          sender: 'other',
          time: new Date().toLocaleTimeString(),
          type: res.data.type || 'text'
        };
        setMessages((prev) => [botMsg, ...prev]);
      }
    } catch (err) {
      console.error('Chat error:', err.response?.data || err.message);
      Alert.alert('❌ Error', 'Failed to send message');
    }

    if (!customMessage) {
      setNewMessage('');
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === 'me';

    if (item.type === 'buttons') {
      return (
        <View style={styles.otherMessageContainer}>
          <Text style={styles.otherMessageText}>{item.text}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.optionButton} onPress={() => handleSend('Ndiyo')}>
              <Text style={styles.optionButtonText}>Ndiyo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={() => handleSend('Hapana')}>
              <Text style={styles.optionButtonText}>Hapana</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessageContainer : styles.otherMessageContainer]}>
        <View style={[styles.messageBubble, isMe ? styles.myMessageBubble : styles.otherMessageBubble]}>
          <Text style={isMe ? styles.myMessageText : styles.otherMessageText}>{item.text}</Text>
          <Text style={isMe ? styles.myMessageTime : styles.otherMessageTime}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sidebar */}
      <Animated.View pointerEvents={sidebarOpen ? 'auto' : 'none'} style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Mazungumzo</Text>
        </View>
        <View style={styles.sidebarContent}>
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.session_id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.sessionItem} onPress={() => selectSession(item)}>
                <Text style={styles.sessionTopic}>{item.topic || 'No Topic'}</Text>
                <Text style={styles.sessionDate}>{new Date(item.created_at).toLocaleString()}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.newConversationButton} onPress={startNewSession}>
            <Text style={styles.newConversationButtonText}>➕ Mazungumzo Mapya</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Overlay */}
      {sidebarOpen && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={toggleSidebar}
          activeOpacity={1}
          pointerEvents={sidebarOpen ? 'auto' : 'none'}
        />
      )}

      {/* Main Chat */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
                <Text style={styles.menuButtonText}>☰</Text>
              </TouchableOpacity>
              <Text style={styles.chatTitle}>Maongezi</Text>
              <View style={styles.headerSpacer} />
            </View>

            {isLoading ? (
              <View style={styles.loadingMessages}>
                <ActivityIndicator size="large" color="#4E8CFF" />
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.emptyMessages}>
                <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyMessagesText}>Hakuna ujumbe bado</Text>
                <Text style={styles.emptyMessagesSubtext}>Anza mazungumzo kwa kubonyeza kitufe hapo chini</Text>
              </View>
            ) : (
              <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                inverted
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              />
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Andika ujumbe..."
              />
              <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()}>
                <Text style={styles.sendButtonText}>Tuma</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  sidebar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 300, backgroundColor: '#fff', zIndex: 10, elevation: 10, padding: 16 },
  sidebarHeader: { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  sidebarTitle: { fontSize: 18, fontWeight: 'bold' },
  sidebarContent: { flex: 1, marginTop: 10 },
  sessionItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sessionTopic: { fontSize: 16, fontWeight: '600' },
  sessionDate: { fontSize: 12, color: '#666' },
  newConversationButton: { backgroundColor: '#4E8CFF', padding: 12, borderRadius: 8, marginTop: 15 },
  newConversationButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  chatContainer: { flex: 1 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f8f8f8' },
  menuButton: { padding: 8 },
  menuButtonText: { fontSize: 20 },
  chatTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  headerSpacer: { width: 30 },
  messagesList: { padding: 16 },
  messageContainer: { marginVertical: 4 },
  myMessageContainer: { alignSelf: 'flex-end' },
  otherMessageContainer: { alignSelf: 'flex-start', backgroundColor: '#eee', padding: 10, borderRadius: 10, maxWidth: '80%', marginVertical: 4 },
  messageBubble: { padding: 10, borderRadius: 10, maxWidth: '80%' },
  myMessageBubble: { backgroundColor: '#4E8CFF' },
  otherMessageBubble: { backgroundColor: '#eee' },
  myMessageText: { color: '#fff' },
  otherMessageText: { color: '#000' },
  myMessageTime: { fontSize: 10, color: '#fff', textAlign: 'right' },
  otherMessageTime: { fontSize: 10, color: '#555', textAlign: 'right' },
  inputContainer: { flexDirection: 'row', padding: 8, backgroundColor: '#f8f8f8' },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16 },
  sendButton: { paddingHorizontal: 16, justifyContent: 'center' },
  sendButtonText: { color: '#4E8CFF', fontWeight: 'bold' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 5 },
  buttonRow: { flexDirection: 'row', marginTop: 8 },
  optionButton: { backgroundColor: '#4E8CFF', padding: 10, borderRadius: 8, marginHorizontal: 5 },
  optionButtonText: { color: '#fff', fontWeight: 'bold' },
  loadingMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyMessagesText: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: '80%',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navItem: { alignItems: 'center' },
  navItemActive: { alignItems: 'center' },
  navText: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  navTextActive: { fontSize: 12, color: '#4E8CFF', fontWeight: 'bold', marginTop: 4 },
});

export default ChatDemo;