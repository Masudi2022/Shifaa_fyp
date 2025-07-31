import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@env'; // Ensure you have this set up in your .

const { width, height } = Dimensions.get('window');
const MENU_WIDTH = width * 0.9;

// List of random topics in Swahili
const RANDOM_TOPICS = [
  "Dalili za Moto",
  "Maumivu ya Kichwa",
  "Ugonjwa wa Tumbo",
  "Kuhara",
  "Kichefuchefu",
  "Maumivu ya Miguu",
  "Homa",
  "Kukohoa",
  "Maumivu ya Mgongo",
  "Matatizo ya Kulala"
];

const ApiBase = {
  baseUrl: BASE_URL,
  endpoints: {
    chat: '/chat/',
    chatSessions: '/sessions/user/',
    messages: (sessionId) => `/sessions/${sessionId}/messages/`,
    createSession: '/sessions/create/',
  },
};

const Shifaa = () => {
  // State initialization
  const [messages, setMessages] = useState([
    { id: '1', text: 'Karibu! Unaweza kuniambia unavyojisikia leo?', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  
  
  // Refs and animations
  const menuPosition = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const keyboardDidShowListener = useRef(null);
  const keyboardDidHideListener = useRef(null);

  // Get a random topic for sessions without one
  const getRandomTopic = () => {
    return RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
  };

  const handleScroll = ({ nativeEvent }) => {
  const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
  const paddingToBottom = 20;

  const atBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
  setIsAtBottom(atBottom);
};


  // Toggle menu with animation
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    Animated.parallel([
      Animated.timing(menuPosition, {
        toValue: menuOpen ? -MENU_WIDTH : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: menuOpen ? 0.5 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Close menu when clicking overlay
  const closeMenu = () => {
    if (menuOpen) {
      toggleMenu();
    }
  };

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx > 0 && !menuOpen) {
          menuPosition.setValue(Math.min(gestureState.dx - MENU_WIDTH, 0));
          overlayOpacity.setValue(Math.min(gestureState.dx / MENU_WIDTH, 0.5));
        } else if (gestureState.dx < 0 && menuOpen) {
          menuPosition.setValue(Math.max(gestureState.dx, -MENU_WIDTH));
          overlayOpacity.setValue(Math.max(0.5 + (gestureState.dx / MENU_WIDTH), 0));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > MENU_WIDTH / 3 && !menuOpen) {
          toggleMenu();
        } else if (gestureState.dx < -MENU_WIDTH / 3 && menuOpen) {
          toggleMenu();
        } else {
          Animated.parallel([
            Animated.spring(menuPosition, {
              toValue: menuOpen ? 0 : -MENU_WIDTH,
              useNativeDriver: true,
            }),
            Animated.spring(overlayOpacity, {
              toValue: menuOpen ? 0.5 : 0,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Auto-scroll to bottom when messages change or keyboard appears
 useEffect(() => {
  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, messages.length * 50); // Delay for smooth scroll after new message
    }
  };

  scrollToBottom();

  if (Platform.OS === 'ios') {
    keyboardDidShowListener.current = Keyboard.addListener('keyboardDidShow', scrollToBottom);
    keyboardDidHideListener.current = Keyboard.addListener('keyboardDidHide', scrollToBottom);
  }

  return () => {
    if (keyboardDidShowListener.current) {
      keyboardDidShowListener.current.remove();
    }
    if (keyboardDidHideListener.current) {
      keyboardDidHideListener.current.remove();
    }
  };
}, [messages]);




  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        let savedId = await AsyncStorage.getItem('device_id');
        if (!savedId) {
          savedId = 'device-' + Math.random().toString(36).substring(7);
          await AsyncStorage.setItem('device_id', savedId);
        }
        setDeviceId(savedId);

        const lastSession = await AsyncStorage.getItem('session_id');
        if (lastSession) {
          setSessionId(lastSession);
          await loadSessionMessages(lastSession);
        }
        
        // Load sessions history on initial load
        await fetchSessions();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    loadInitialData();
  }, []);

  // Create new diagnosis session with topic
  const handleNewDiagnosis = async () => {
    try {
      setIsLoading(true);
      const access = await AsyncStorage.getItem('access_token');
      const userData = await AsyncStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;

      const response = await fetch(`${ApiBase.baseUrl}${ApiBase.endpoints.createSession}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(access && { Authorization: `Bearer ${access}` }),
        },
        body: JSON.stringify({
          device_id: deviceId,
          user_email: user?.email || 'anonymous@guest.com',
          first_message: input || "Habari, naomba msaada" // Send first message for topic extraction
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Imeshindwa kuunda mazungumzo mapya');
      }

      setSessionId(responseData.session_id);
      await AsyncStorage.setItem('session_id', responseData.session_id);
      setMessages([{ id: '1', text: 'Karibu! Unaweza kuniambia unavyojisikia leo?', sender: 'bot' }]);
      setInput('');
      
      // Refresh the sessions list
      await fetchSessions();
      toggleMenu();
    } catch (error) {
      Alert.alert('Hitilafu', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch session history with topics
  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const access = await AsyncStorage.getItem('access_token');
      const response = await fetch(`${ApiBase.baseUrl}${ApiBase.endpoints.chatSessions}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(access && { Authorization: `Bearer ${access}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Imeshindwa kupakua historia');
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        // Add random topics to sessions without one and sort by date
        const processedSessions = data.map(session => ({
          ...session,
          topic: session.topic || getRandomTopic()
        })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        setSessions(processedSessions);
      } else {
        throw new Error('Data si sahihi');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      Alert.alert('Hitilafu', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load messages for selected session
  const loadSessionMessages = async (selectedSessionId) => {
    try {
      setIsLoading(true);
      const access = await AsyncStorage.getItem('access_token');
      const response = await fetch(`${ApiBase.baseUrl}${ApiBase.endpoints.messages(selectedSessionId)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(access && { Authorization: `Bearer ${access}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Imeshindwa kupakua ujumbe');
      }

      const data = await response.json();
      const formatted = data.map((msg) => ({
        id: msg.id.toString(),
        text: msg.text,
        sender: msg.is_user ? 'user' : 'bot',
      }));

      setMessages(formatted);
      setSessionId(selectedSessionId);
      await AsyncStorage.setItem('session_id', selectedSessionId);
    } catch (error) {
      Alert.alert('Hitilafu', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message to API
  const sendMessageToAPI = async (message) => {
    try {
      setIsLoading(true);
      const access = await AsyncStorage.getItem('access_token');
      const userData = await AsyncStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;

      const response = await fetch(`${ApiBase.baseUrl}${ApiBase.endpoints.chat}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(access && { Authorization: `Bearer ${access}` }),
        },
        body: JSON.stringify({
          message,
          device_id: deviceId,
          user_email: user?.email || 'anonymous@guest.com',
          session_id: sessionId,
        }),
      });

      if (!response.ok) throw new Error('Maombi ya API yameshindwa');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return {
        response: 'Samahani, kuna tatizo la kiufundi. Tafadhali jaribu tena baadaye.',
        possible_diseases: [],
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Format bot response
  const formatBotResponse = (res) => {
    const { response, possible_diseases = [] } = res;
    if (!possible_diseases.length) return response;

    return `${response}\n\n${possible_diseases.map(
      d => `🔹 ${d.disease.toUpperCase()}:\nMatibabu: ${d.treatment}\nUshauri: ${d.advice}`
    ).join('\n\n')}`;
  };

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const response = await sendMessageToAPI(input);
      const botMsg = {
        id: Date.now().toString() + '_bot',
        text: formatBotResponse(response),
        sender: 'bot',
      };
      setMessages(prev => [...prev, botMsg]);
      
      // Refresh session list after new message
      await fetchSessions();
    } catch (error) {
      Alert.alert('Hitilafu', 'Imeshindwa kutuma ujumbe');
    }
  };

  // Render message item
  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userContainer : styles.botContainer
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.botBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.sender === 'user' ? styles.userText : styles.botText
        ]}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  // Render history item with topic
  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => {
        loadSessionMessages(item.session_id);
        closeMenu();
      }}
    >
      <Text style={styles.historyTopic} numberOfLines={1}>
        {item.topic || 'Mazungumzo ya Afya'}
      </Text>
      <Text style={styles.historyDate}>
        {new Date(item.created_at).toLocaleDateString('sw-TZ', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })}
      </Text>
      <Text style={styles.historyPreview} numberOfLines={1}>
        {item.last_message || 'Bila ujumbe'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container} {...panResponder.panHandlers}>
        {/* Sliding Menu */}
        <Animated.View style={[
          styles.menu,
          { transform: [{ translateX: menuPosition }] }
        ]}>
          <View style={styles.menuContent}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Historia ya Mazungumzo</Text>
              <TouchableOpacity onPress={toggleMenu}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={handleNewDiagnosis}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#4E8CFF" size="small" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#4E8CFF" />
                  <Text style={styles.newChatText}>Uchunguzi Mpya</Text>
                </>
              )}
            </TouchableOpacity>
            
            <FlatList
              data={sessions}
              renderItem={renderHistoryItem}
              keyExtractor={item => item.session_id}
              contentContainerStyle={styles.historyList}
              refreshing={isLoading}
              onRefresh={fetchSessions}
            />
          </View>
        </Animated.View>



        {/* Main Content */}
        <KeyboardAvoidingView
          style={styles.mainContent}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.select({ ios: 0, android: 25 })}
        >
          <View style={styles.contentContainer}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={toggleMenu}>
                <Ionicons name="menu" size={24} color="#4E8CFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Daktari Mahiri</Text>
              <View style={{ width: 24 }} />
            </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatContainer}
            style={styles.chatList}
            maintainVisibleContentPosition={{
              minIndexForVisible: 10,
              autoscrollToTopThreshold: 1000,
            }}
            onScrollBeginDrag={() => setAutoScroll(false)} // Optional: disables auto scroll when user scrolls
          />


            {/* Input Area */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Andika dalili zako..."
                value={input}
                onChangeText={setInput}
                placeholderTextColor="#999"
                multiline
                editable={!isLoading}
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                onPress={handleSend}
                style={[styles.sendButton, isLoading && styles.disabledButton]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fe',
  },
  menu: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: '#fff',
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 2, height: 0 },
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  menuContent: {
    flex: 1,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  newChatText: {
    marginLeft: 10,
    color: '#4E8CFF',
    fontSize: 16,
    fontWeight: '500',
  },
  historyList: {
    paddingBottom: 20,
  },
  historyItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyTopic: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  historyPreview: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 99,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f8f9fe',
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  chatList: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  botContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#4E8CFF',
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  messageText: {
    fontSize: 16,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.select({ ios: 16, android: 8 }),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    maxHeight: 120,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4E8CFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default Shifaa; 