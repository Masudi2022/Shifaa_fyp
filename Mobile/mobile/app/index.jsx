import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BASE_URL } from '@env';

const { width } = Dimensions.get('window');

export default function Home() {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const [reminderMessage, setReminderMessage] = useState(null);
  const [reminderTimestamp, setReminderTimestamp] = useState(null);
  const [appointmentInfo, setAppointmentInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

useEffect(() => {
  const fetchReminder = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        // No token = user not logged in, skip silently
        setReminderMessage(null);
        setAppointmentInfo(null);
        setReminderTimestamp(null);
        return;
      }

      const response = await axios.get(`${BASE_URL}/appointments/check-reminder/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      if (data.upcoming || data.missed) {
        setReminderMessage(data.message);
        setAppointmentInfo({
          id: data.id ?? null,
          isMissed: data.missed || false,
          minutesLate: data.minutes_late ?? null,
        });
        setReminderTimestamp(new Date());
      } else {
        setReminderMessage(null);
        setAppointmentInfo(null);
        setReminderTimestamp(null);
      }
    } catch (error) {
      // Only log if it's NOT 401 (token missing/expired)
      if (error.response?.status !== 401) {
        console.error("Reminder fetch error:", error.response?.data || error.message);
      }
      setReminderMessage(null);
      setAppointmentInfo(null);
      setReminderTimestamp(null);
    }
  };

  fetchReminder();
  const interval = setInterval(fetchReminder, 60000);
  return () => clearInterval(interval);
}, []);


  const handlePress = (route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E8CFF" />
        <Text style={styles.loadingText}>Inapakia...</Text>
      </View>
    );
  }

  const role = user?.role?.toLowerCase();
  const isDoctor = role === 'doctor';

  const appointmentButtonText = isDoctor ? 'Angalia Miadi' : 'Panga Miadi';
  const appointmentButtonRoute = isDoctor ? '/appointments' : '/booking';

  return (
   <SafeAreaView style={styles.page} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.fixedHeader}>
        <View style={styles.profileContainer}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
            style={styles.profileImage}
          />
          <View>
            <Text style={styles.welcomeText}>Karibu tena,</Text>
            <Text style={styles.userName}>{user?.full_name || 'Mteja'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => handlePress('/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#4E8CFF" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Card */}
        <Animated.View 
          style={[
            styles.card, 
            { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
          ]}
        >
          <View style={styles.doctorHeader}>
            <Image
              source={{ uri: 'https://img.freepik.com/free-photo/doctor-with-his-arms-crossed-white-background_1368-5790.jpg' }}
              style={styles.doctorImage}
            />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>Karibu Shifaa</Text>
              <Text style={styles.specialty}>Pata kujua dalili zako kiganjani mwako</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>4.9 (tathmini 128)</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.availabilityContainer}>
            <View style={styles.priceContainer}>
              {/* <Text style={styles.priceLabel}>Gharama ya Ushauri</Text> */}
              {/* <Text style={styles.price}>Tsh 35,000 / kikao</Text> */}
            </View>

            <View style={styles.availability}>
              {['Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa'].map((day, index) => {
                const jsDay = new Date().getDay();
                const currentDayIndex = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }[jsDay];
                const isActive = index === currentDayIndex;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.day, isActive && styles.activeDay]}
                    onPress={() => Haptics.selectionAsync()}
                  >
                    <Text style={[styles.dayText, isActive && styles.activeDayText]}>
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => handlePress(appointmentButtonRoute)}
          >
            <Text style={styles.bookButtonText}>{appointmentButtonText}</Text>
            <Ionicons name="calendar-outline" size={18} color="white" />
          </TouchableOpacity>
        </Animated.View>

        {/* Info Banner */}
         <TouchableOpacity
            disabled={!appointmentInfo?.id} // only clickable if ID exists
            onPress={() => {
              if (appointmentInfo?.id) {
                router.push(`/appointment/${appointmentInfo.id}`);
              }
            }}
          >
            <View style={[styles.infoBanner, reminderMessage ? styles.urgentBanner : null]}>
              <Ionicons
                name={reminderMessage ? "alert-circle-outline" : "information-circle-outline"}
                size={20}
                color={reminderMessage ? "#DC2626" : "#1E40AF"}
                style={{ marginRight: 8 }}
              />
              {reminderMessage ? (
                <Text style={styles.urgentText}>{reminderMessage}</Text>
              ) : (
                <Text style={styles.infoText}>
                  Karibu kwenye <Text style={styles.brandText}>Shifaa</Text> — msaidizi wako wa kiafya kwa lugha ya Kiswahili.
                </Text>
              )}
            </View>
          </TouchableOpacity>

        {/* Quick Access */}
        <Text style={styles.sectionTitle}>Huduma za Haraka</Text>
        <View style={styles.quickAccessRow}>
          <TouchableOpacity 
            style={styles.quickAccessCard} 
            onPress={() => handlePress('/shifaa')}
          >
            <View style={[styles.quickAccessIcon, styles.aiIcon]}>
              <MaterialCommunityIcons name="robot-happy-outline" size={28} color="#4E8CFF" />
            </View>
            <Text style={styles.quickAccessTitle}>Shifaa AI</Text>
            <Text style={styles.quickAccessSubtitle}>Pata majibu haraka</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAccessCard} 
            onPress={() => handlePress('/pharmacy')}
          >
            <View style={[styles.quickAccessIcon, styles.pharmacyIcon]}>
              <FontAwesome5 name="pills" size={24} color="#10B981" />
            </View>
            <Text style={styles.quickAccessTitle}>Duka la Dawa</Text>
            <Text style={styles.quickAccessSubtitle}>Tafuta karibu nawe</Text>
          </TouchableOpacity>
        </View>

        {/* Health Tips */}
        <Text style={styles.sectionTitle}>Vidokezo vya Afya</Text>
        {/* Health Tips */}
{/* <Text style={styles.sectionTitle}>Vidokezo vya Afya</Text> */}
<ScrollView 
  horizontal 
  showsHorizontalScrollIndicator={false} 
  style={styles.tipsScroll}
  contentContainerStyle={styles.tipsContainer}
>
  
  
  <TouchableOpacity style={styles.tipCard} onPress={() => handlePress('/')}>
    <Image source={{ uri: 'https://img.freepik.com/free-photo/sporty-young-man-jogging-nature_23-2148137713.jpg' }} style={styles.tipImage} />
    <View style={styles.tipContent}>
      <Text style={styles.tipText}>Fanya mazoezi angalau dakika 30 kila siku</Text>
    </View>
  </TouchableOpacity>
  
  <TouchableOpacity style={styles.tipCard} onPress={() => handlePress('/')}>
    <Image source={{ uri: 'https://img.freepik.com/free-photo/assortment-vegetables-herbs-spices_123827-21867.jpg' }} style={styles.tipImage} />
    <View style={styles.tipContent}>
      <Text style={styles.tipText}>Kula mboga za majani na matunda mengi</Text>
    </View>
  </TouchableOpacity>
  
  <TouchableOpacity style={styles.tipCard} onPress={() => handlePress('/')}>
    <Image source={{ uri: 'https://img.freepik.com/free-photo/woman-sleeping-bed_1150-7006.jpg' }} style={styles.tipImage} />
    <View style={styles.tipContent}>
      <Text style={styles.tipText}>Lala usingizi wa saa 7-8 kila usiku</Text>
    </View>
  </TouchableOpacity>
  
  <TouchableOpacity style={styles.tipCard} onPress={() => handlePress('/')}>
    <Image source={{ uri: 'https://img.freepik.com/free-photo/young-woman-meditating-outdoor_23-2148657930.jpg' }} style={styles.tipImage} />
    <View style={styles.tipContent}>
      <Text style={styles.tipText}>Dhibiti msongo wa mawazo kwa kupumzika</Text>
    </View>
  </TouchableOpacity>

  <TouchableOpacity style={styles.tipCard} onPress={() => handlePress('/')}>
    <Image source={{ uri: 'https://img.freepik.com/free-photo/glass-water-with-lemon_23-2147694623.jpg' }} style={styles.tipImage} />
    <View style={styles.tipContent}>
      <Text style={styles.tipText}>Kunywa maji ya kutosha kila siku (lita 2-3)</Text>
    </View>
  </TouchableOpacity>
  
  <TouchableOpacity style={styles.tipCard} onPress={() => handlePress('/')}>
    <Image source={{ uri: 'https://img.freepik.com/free-photo/closeup-unrecognizable-person-washing-hands_53876-97689.jpg' }} style={styles.tipImage} />
    <View style={styles.tipContent}>
      <Text style={styles.tipText}>Osha mikono mara kwa mara kuepusha magonjwa</Text>
    </View>
  </TouchableOpacity>
  
  <TouchableOpacity style={styles.tipCard} onPress={() => handlePress('/')}>
    <Image source={{ uri: 'https://img.freepik.com/free-photo/doctor-with-syringe-jab_23-2149185518.jpg' }} style={styles.tipImage} />
    <View style={styles.tipContent}>
      <Text style={styles.tipText}>Pata chanjo zote muhimu kwa afya yako</Text>
    </View>
  </TouchableOpacity>
  
  <TouchableOpacity style={styles.tipCard} onPress={() => handlePress('/')}>
    <Image source={{ uri: 'https://img.freepik.com/free-photo/doctor-examining-patient-clinic_53876-14858.jpg' }} style={styles.tipImage} />
    <View style={styles.tipContent}>
      <Text style={styles.tipText}>Fanya uchunguzi wa mara kwa mara</Text>
    </View>
  </TouchableOpacity>
</ScrollView>

        {/* Services Section */}
        <Text style={styles.sectionTitle}>Huduma Zingine</Text>
        <View style={styles.servicesGrid}>
          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => handlePress('/Record/records')}
          >
            <View style={[styles.serviceIcon, styles.recordsIcon]}>
              <Ionicons name="heart-outline" size={28} color="#EF4444" />
            </View>
            <Text style={styles.serviceTitle}>Vipimo vya Afya</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => handlePress('/Elimu/elimu')}
          >
            <View style={[styles.serviceIcon, styles.labIcon]}>
              <Ionicons name="school-outline" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.serviceTitle}>Elimu ya Afya</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => handlePress('/')}
          >
            <View style={[styles.serviceIcon, styles.emergencyIcon]}>
              <Ionicons name="call-outline" size={28} color="#10B981" />
            </View>
            <Text style={styles.serviceTitle}>Huduma kwa Simu</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => handlePress('/')}
          >
            <View style={[styles.serviceIcon, styles.articlesIcon]}>
              <Ionicons name="document-text-outline" size={28} color="#8B5CF6" />
            </View>
            <Text style={styles.serviceTitle}>Makala za Afya</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <Ionicons name="home" size={24} color="#4E8CFF" />
          <Text style={styles.navTextActive}>Nyumbani</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => handlePress('/shifaa')}>
          <Ionicons name="chatbubbles" size={24} color="#94A3B8" />
          <Text style={styles.navText}>Mazungumzo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => handlePress('/Record/records')}>
          <Ionicons name="calendar-outline" size={24} color="#94A3B8" />
          <Text style={styles.navText}>Taarifa za afya</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => handlePress('/profile')}>
          <Ionicons name="person" size={24} color="#94A3B8" />
          <Text style={styles.navText}>Akaunti</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 20, paddingBottom: 180 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748B' },

  fixedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  profileContainer: { flexDirection: 'row', alignItems: 'center' },
  profileImage: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  welcomeText: { fontSize: 14, color: '#64748B' },
  userName: { fontSize: 16, fontWeight: '600', color: '#0F172A' },

  notificationButton: { position: 'relative' },
  notificationBadge: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  doctorHeader: { flexDirection: 'row', alignItems: 'center' },
  doctorImage: { width: 80, height: 80, borderRadius: 40, marginRight: 12 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 18, fontWeight: '600', color: '#111827' },
  specialty: { fontSize: 14, color: '#64748B', marginTop: 2 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { marginLeft: 4, fontSize: 12, color: '#475569' },

  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },

  availabilityContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  priceContainer: {},
  priceLabel: { fontSize: 12, color: '#94A3B8' },
  price: { fontSize: 14, fontWeight: '600', color: '#111827' },
  availability: { flexDirection: 'row' },
  day: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#F1F5F9', marginHorizontal: 2 },
  activeDay: { backgroundColor: '#4E8CFF' },
  dayText: { fontSize: 12, color: '#475569' },
  activeDayText: { color: '#fff', fontWeight: '600' },

  bookButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#4E8CFF', paddingVertical: 12, borderRadius: 10, marginTop: 12 },
  bookButtonText: { color: '#fff', fontWeight: '600', marginRight: 6 },

  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', padding: 12, borderRadius: 10, marginBottom: 16 },
  urgentBanner: { backgroundColor: '#FEE2E2' },
  infoText: { fontSize: 13, color: '#1E40AF' },
  urgentText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },
  brandText: { fontWeight: '700' },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    marginTop: 8,
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAccessCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickAccessIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiIcon: {
    backgroundColor: '#E0E7FF',
  },
  pharmacyIcon: {
    backgroundColor: '#D1FAE5',
  },
  quickAccessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  quickAccessSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  tipsScroll: {
    marginBottom: 24,
  },
  tipsContainer: {
    paddingBottom: 8,
  },
  tipCard: {
    width: width * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipImage: {
    width: '100%',
    height: 120,
  },
  tipContent: {
    padding: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordsIcon: {
    backgroundColor: '#EFF6FF',
  },
  labIcon: {
    backgroundColor: '#ECFDF5',
  },
  emergencyIcon: {
    backgroundColor: '#FEF2F2',
  },
  articlesIcon: {
    backgroundColor: '#F5F3FF',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    textAlign: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 45,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    // paddingBottom: 16,
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  navItemActive: {
    alignItems: 'center',
    padding: 8,
  },
  navText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  navTextActive: {
    fontSize: 12,
    color: '#4E8CFF',
    marginTop: 4,
    fontWeight: '600',
  },
});