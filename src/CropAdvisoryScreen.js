import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';

export default function CropAdvisoryScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Voice recognition handlers with null-guard
    try {
      if (Voice && typeof Voice === 'object') {
        Voice.onSpeechStart = () => setIsListening(true);
        Voice.onSpeechEnd = () => setIsListening(false);
        Voice.onSpeechError = (e) => {
          setIsListening(false);
          console.error('Voice error:', e);
        };
        Voice.onSpeechResults = (e) => {
          const text = (e && e.value && e.value[0]) ? e.value[0] : '';
          if (text) setInputText(text);
        };
      } else {
        console.warn('Voice module is null. Skipping listener registration.');
      }
    } catch (err) {
      console.warn('Voice setup error:', err);
    }

    return () => {
      try {
        if (Voice && typeof Voice.destroy === 'function') {
          Voice.destroy().then(() => {
            if (typeof Voice.removeAllListeners === 'function') Voice.removeAllListeners();
          }).catch(() => {});
        }
      } catch (_) {}
    };
  }, []);

  const startVoiceRecognition = async () => {
    try {
      if (Platform.OS === 'android') {
        const { PermissionsAndroid } = require('react-native');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission required', 'Microphone permission is needed to use voice input.');
          return;
        }
      }
      if (!Voice || typeof Voice.start !== 'function') {
        Alert.alert('Voice Not Available', 'Please rebuild the app to enable voice recognition.');
        return;
      }
      await Voice.start('en-US');
    } catch (error) {
      console.error('Voice recognition error:', error);
      Alert.alert('Error', 'Unable to start voice recognition.');
    }
  };

  const stopVoiceRecognition = async () => {
    try {
      if (Voice && typeof Voice.stop === 'function') {
        await Voice.stop();
      }
    } catch (error) {
      console.error('Stop voice error:', error);
    }
  };

  const handleMicPress = () => {
    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  const getBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Simple response logic - in real app, this would call an API
    if (lowerMessage.includes('fertilizer') || lowerMessage.includes('fertilize')) {
      return 'For best results, I recommend applying organic fertilizer like compost or vermicompost. Apply it 2-3 weeks before planting and mix it well with the soil.';
    } else if (lowerMessage.includes('watering') || lowerMessage.includes('water') || lowerMessage.includes('irrigation')) {
      return 'Water your crops early in the morning or late in the evening to minimize evaporation. Most crops need about 1-2 inches of water per week. Check soil moisture regularly.';
    } else if (lowerMessage.includes('pest') || lowerMessage.includes('insect') || lowerMessage.includes('disease')) {
      return 'To prevent pests and diseases, practice crop rotation, use natural pesticides like neem oil, and maintain proper spacing between plants for good air circulation.';
    } else if (lowerMessage.includes('soil') || lowerMessage.includes('ph')) {
      return 'Test your soil pH regularly. Most crops prefer a pH between 6.0 and 7.0. Add lime to raise pH or sulfur to lower it based on your test results.';
    } else if (lowerMessage.includes('season') || lowerMessage.includes('when to plant')) {
      return 'The best planting season depends on your crop and location. Generally, cool-season crops are planted in spring/fall, while warm-season crops go in late spring/early summer.';
    } else if (lowerMessage.includes('harvest') || lowerMessage.includes('harvesting')) {
      return 'Harvest timing varies by crop. Check for maturity signs like color change, size, and firmness. Most vegetables taste best when harvested at peak ripeness.';
    } else {
      return 'Thank you for your question! I\'m here to help with crop advisory. You can ask me about fertilization, watering, pests, soil management, planting seasons, or harvesting. How can I assist you further?';
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    try { const { Keyboard } = require('react-native'); Keyboard.dismiss(); } catch (_) {}

    // Simulate bot response after a short delay
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputText),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  useEffect(() => {
    // Scroll to bottom when new message is added
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.botMessageContainer]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.botMessageText]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crop Advisory</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>Start a conversation</Text>
              <Text style={styles.emptyStateSubtext}>Ask me anything about crop advisory</Text>
            </View>
          }
        />

        {/* Sticky Search Bar */}
        <View style={[styles.searchBarContainer, { paddingBottom: (Platform.OS === 'ios' ? 20 : 10) + (insets?.bottom || 0) }]}>
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={handleMicPress}
          >
            <Ionicons
              name={isListening ? 'mic' : 'mic-outline'}
              size={24}
              color={isListening ? '#FFFFFF' : '#22A06B'}
            />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Ask about crop advisory..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={() => { handleSend(); try { const { Keyboard } = require('react-native'); Keyboard.dismiss(); } catch (_) {} }}
          />

          {inputText.trim() ? (
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginTop: 30,

  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: '#22A06B',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#111827',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  micButtonActive: {
    backgroundColor: '#22A06B',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22A06B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

