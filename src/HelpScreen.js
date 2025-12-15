import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen() {
  const navigation = useNavigation();

  const faqs = [
    { q: 'How do I update my profile?', a: 'Go to the drawer > My Profile, edit your details, and tap Save.' },
    { q: 'How do I place an order?', a: 'Browse products, add items to cart, and proceed to checkout from My Orders.' },
    { q: 'How do AI Tools help?', a: 'Use Crop Doctor or Crop Recommendation to get tailored guidance.' },
    { q: 'How can I change app language?', a: 'Open the drawer > Language to select your preferred language.' },
  ];

  const PHONE = '6261118789';
  const EMAIL = 'kisanoneoffice@gmail.com';
  const ADDRESS = 'Kalchuri LNCT Incubation Centre (KLIC), Lakshmi Narain College of Technology (LNCT Group), Kalchuri Nagar, Raisen Road, Bhopal – 462022, Madhya Pradesh, India';

  const handleCall = () => Linking.openURL(`tel:${PHONE}`);
  const handleEmail = () => Linking.openURL(`mailto:${EMAIL}`);
  const handleMap = () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, styles.contactCard]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.headerIconPill}>
              <Ionicons name="chatbubbles-outline" size={18} color="#2E7D32" />
            </View>
            <Text style={styles.sectionTitle}>Contact Us</Text>
          </View>
          <View style={styles.row}><Ionicons name="call-outline" size={20} color="#2E7D32" /><Text style={styles.rowText}>  6261118789</Text></View>
          <View style={styles.row}><Ionicons name="mail-outline" size={20} color="#2E7D32" /><Text style={styles.rowText}>  kisanoneoffice@gmail.com</Text></View>
          <View style={[styles.row, { alignItems: 'flex-start' }]}>
            <Ionicons name="location-outline" size={20} color="#2E7D32" />
            <Text style={[styles.rowText, { flex: 1 }]}>  Kalchuri LNCT Incubation Centre (KLIC), Lakshmi Narain College of Technology (LNCT Group), Kalchuri Nagar, Raisen Road, Bhopal – 462022, Madhya Pradesh, India</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall}>
              <Ionicons name="call" size={16} color="#FFFFFF" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.emailBtn]} onPress={handleEmail}>
              <Ionicons name="mail" size={16} color="#FFFFFF" />
              <Text style={styles.actionText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.mapBtn]} onPress={handleMap}>
              <Ionicons name="navigate" size={16} color="#FFFFFF" />
              <Text style={styles.actionText}>Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, styles.faqCard]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.headerIconPill, { backgroundColor: '#ECFDF5', borderColor: '#34A853' }]}>
              <Ionicons name="help-circle-outline" size={18} color="#34A853" />
            </View>
            <Text style={styles.sectionTitle}>FAQs</Text>
          </View>
          {faqs.map((f, idx) => (
            <View key={idx} style={styles.faqItem}>
              <View style={styles.faqQRow}>
                <Ionicons name="help-circle-outline" size={18} color="#2E7D32" />
                <Text style={styles.faqQ}>{f.q}</Text>
              </View>
              <Text style={styles.faqA}>{f.a}</Text>
              {idx !== faqs.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: '#2E7D32',
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  content: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  contactCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  faqCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#34A853',
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  headerIconPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rowText: { fontSize: 14, color: '#374151' },
  actionsRow: { flexDirection: 'row', marginTop: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  callBtn: { backgroundColor: '#2E7D32' },
  emailBtn: { backgroundColor: '#2563EB' },
  mapBtn: { backgroundColor: '#F59E0B' },
  actionText: { color: '#FFFFFF', fontWeight: '700', marginLeft: 6 },
  faqItem: { marginBottom: 8 },
  faqQRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  faqQ: { fontSize: 14, fontWeight: '700', color: '#111827', marginLeft: 6 },
  faqA: { fontSize: 14, color: '#374151', lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginTop: 8 },
});
