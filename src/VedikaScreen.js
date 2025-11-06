import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from './utils/responsive';

export default function VedikaScreen() {
  const [activeTab, setActiveTab] = useState('Community');
  const insets = useSafeAreaInsets();

  const tabs = ['Community', 'Questions', 'Tips', 'Events'];

  const communityPosts = [
    {
      id: 1,
      user: 'Rajesh Kumar',
      location: 'Punjab',
      time: '2 hours ago',
      title: 'Best practices for organic farming',
      content: 'Sharing my experience with organic farming techniques that have increased my yield by 30%...',
      likes: 24,
      comments: 8,
      image: '🌾',
    },
    {
      id: 2,
      user: 'Priya Sharma',
      location: 'Haryana',
      time: '4 hours ago',
      title: 'Tomato farming tips for beginners',
      content: 'New to tomato farming? Here are some essential tips that helped me get started...',
      likes: 18,
      comments: 12,
      image: '🍅',
    },
    {
      id: 3,
      user: 'Amit Singh',
      location: 'Uttar Pradesh',
      time: '6 hours ago',
      title: 'Weather forecast and crop planning',
      content: 'How I use weather forecasts to plan my crop cycles and maximize productivity...',
      likes: 31,
      comments: 15,
      image: '🌤️',
    },
  ];

  const questions = [
    {
      id: 1,
      user: 'Suresh Patel',
      question: 'What is the best fertilizer for wheat crops?',
      answers: 5,
      time: '1 hour ago',
    },
    {
      id: 2,
      user: 'Meera Devi',
      question: 'How to prevent pest attacks on brinjal plants?',
      answers: 3,
      time: '3 hours ago',
    },
    {
      id: 3,
      user: 'Vikram Reddy',
      question: 'Best irrigation methods for rice farming?',
      answers: 7,
      time: '5 hours ago',
    },
  ];

  const tips = [
    {
      id: 1,
      title: 'Soil Testing',
      description: 'Regular soil testing helps determine nutrient requirements',
      category: 'Soil Management',
      icon: '🧪',
    },
    {
      id: 2,
      title: 'Crop Rotation',
      description: 'Rotate crops to maintain soil fertility and prevent diseases',
      category: 'Crop Planning',
      icon: '🔄',
    },
    {
      id: 3,
      title: 'Water Conservation',
      description: 'Use drip irrigation to save water and improve efficiency',
      category: 'Irrigation',
      icon: '💧',
    },
  ];

  const events = [
    {
      id: 1,
      title: 'Agricultural Expo 2024',
      date: 'March 15-17, 2024',
      location: 'Delhi',
      attendees: 150,
      type: 'Exhibition',
    },
    {
      id: 2,
      title: 'Organic Farming Workshop',
      date: 'March 20, 2024',
      location: 'Online',
      attendees: 75,
      type: 'Workshop',
    },
  ];

  const renderCommunityPosts = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {communityPosts.map((post) => (
        <TouchableOpacity key={post.id} style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{post.user.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{post.user}</Text>
                <Text style={styles.userLocation}>{post.location} • {post.time}</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.moreIcon}>⋯</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postContent}>{post.content}</Text>
          
          <View style={styles.postImage}>
            <Text style={styles.postEmoji}>{post.image}</Text>
          </View>
          
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionItem}>
              <Text style={styles.actionIcon}>👍</Text>
              <Text style={styles.actionText}>{post.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>{post.comments}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderQuestions = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {questions.map((question) => (
        <TouchableOpacity key={question.id} style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{question.user.charAt(0)}</Text>
            </View>
            <View style={styles.questionInfo}>
              <Text style={styles.questionUser}>{question.user}</Text>
              <Text style={styles.questionTime}>{question.time}</Text>
            </View>
          </View>
          <Text style={styles.questionText}>{question.question}</Text>
          <View style={styles.questionStats}>
            <Text style={styles.answersCount}>{question.answers} answers</Text>
            <TouchableOpacity style={styles.answerButton}>
              <Text style={styles.answerButtonText}>Answer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTips = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {tips.map((tip) => (
        <TouchableOpacity key={tip.id} style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Text style={styles.tipEmoji}>{tip.icon}</Text>
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            <Text style={styles.tipDescription}>{tip.description}</Text>
            <Text style={styles.tipCategory}>{tip.category}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderEvents = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {events.map((event) => (
        <TouchableOpacity key={event.id} style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={styles.eventType}>
              <Text style={styles.eventTypeText}>{event.type}</Text>
            </View>
          </View>
          <View style={styles.eventDetails}>
            <Text style={styles.eventDetail}>📅 {event.date}</Text>
            <Text style={styles.eventDetail}>📍 {event.location}</Text>
            <Text style={styles.eventDetail}>👥 {event.attendees} attendees</Text>
          </View>
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join Event</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Community': return renderCommunityPosts();
      case 'Questions': return renderQuestions();
      case 'Tips': return renderTips();
      case 'Events': return renderEvents();
      default: return renderCommunityPosts();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vedika</Text>
        <Text style={styles.headerSubtitle}>Connect with farming community</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts, questions, tips..."
            placeholderTextColor="#999999"
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={[styles.fab, { bottom: 80 + (insets?.bottom || 0) }]}>
        <Text style={styles.fabIcon}>✏️</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: ms(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: ms(13),
    color: '#E8F5E8',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
    color: '#666666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  activeTab: {
    backgroundColor: '#2E7D32',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  userLocation: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  moreIcon: {
    fontSize: 20,
    color: '#666666',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    height: 120,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  postEmoji: {
    fontSize: 48,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#666666',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionInfo: {
    marginLeft: 12,
  },
  questionUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  questionTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  questionText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
    marginBottom: 12,
  },
  questionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answersCount: {
    fontSize: 14,
    color: '#666666',
  },
  answerButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  answerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 8,
  },
  tipCategory: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  eventType: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventTypeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventDetail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  joinButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: ms(22),
    color: '#FFFFFF',
  },
});
