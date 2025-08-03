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
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@env';

export default function Home() {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const [reminderMessage, setReminderMessage] = useState(null);
  const [reminderTimestamp, setReminderTimestamp] = useState(null);
  const [appointmentInfo, setAppointmentInfo] = useState(null);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
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
      const response = await axios.get(`${BASE_URL}/appointments/check-reminder/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      if (data.upcoming || data.missed) {
        setReminderMessage(data.message);

        // ✅ Safely include appointment ID and other info
        setAppointmentInfo({
          id: data.id ?? null, // fallback to null if not present
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
      console.error("Reminder fetch error:", error.response?.data || error.message);
      setReminderMessage(null);
      setAppointmentInfo(null);
      setReminderTimestamp(null);
    }
  };

  fetchReminder();
  const interval = setInterval(fetchReminder, 60000); // every minute
  return () => clearInterval(interval);
}, []);


  const handlePress = (route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route);
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E8CFF" />
      </View>
    );
  }

  const role = user?.role?.toLowerCase();
  const isDoctor = role === 'doctor';

  const appointmentButtonText = isDoctor ? 'Appointments' : 'Book Appointment';
  const appointmentButtonRoute = isDoctor ? '/appointments' : '/booking';

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.fixedHeader}>
        <View style={styles.profileContainer}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
            style={styles.profileImage}
          />
          <Text style={styles.subHeader}>
            Karibu {user?.full_name || 'Mtumiaji'}, Tunakusikiliza na kukusaidia
          </Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#4E8CFF" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Doctor Card */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
          <View style={styles.doctorHeader}>
            <Image
              source={{ uri: 'https://img.freepik.com/free-photo/doctor-with-his-arms-crossed-white-background_1368-5790.jpg' }}
              style={styles.doctorImage}
            />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>Dkt. Johan Jenson</Text>
              <Text style={styles.specialty}>Daktari wa Magonjwa Mbalimbali</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>4.9 (watu 128)</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.availabilityContainer}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Gharama ya Ushauri</Text>
              <Text style={styles.price}>Tsh 35,000 / kikao</Text>
            </View>

            <View style={styles.availability}>
              {['Jum', 'Jtt', 'Jnn', 'Alh', 'Ijm'].map((day, index) => {
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
                      {day}
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
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#1E40AF" style={{ marginRight: 8 }} />
          {reminderMessage ? (
            (() => {
              const now = new Date();
              const diffInMinutes = reminderTimestamp
                ? Math.floor((now - new Date(reminderTimestamp)) / 60000)
                : 0;

              const isClickable = appointmentInfo &&
                !appointmentInfo.isMissed &&
                diffInMinutes <= 10;

              return isClickable ? (
                <TouchableOpacity onPress={() => router.push(`/appointment/${appointmentInfo.id}`)}>
                <Text style={{ color: '#DC2626', fontWeight: 'bold' }}>
                  {reminderMessage}
                </Text>
              </TouchableOpacity>

              ) : (
                <Text style={[styles.infoText, { fontWeight: 'bold', color: '#DC2626' }]}>
                  {reminderMessage}
                </Text>
              );
            })()
          ) : (
            <Text style={styles.infoText}>
              Karibu kwenye <Text style={{ fontWeight: 'bold' }}>Shifaa</Text> — msaidizi wako wa kiafya kwa lugha ya Kiswahili. Uliza dalili zako, pata ushauri wa kitaalamu, na uweke miadi na madaktari kwa urahisi.
            </Text>
          )}
        </View>

        {/* Quick Access */}
        <Text style={styles.sectionTitle}>Huduma za Haraka</Text>
        <View style={styles.quickAccessRow}>
          <TouchableOpacity style={styles.quickAccessCard} onPress={() => handlePress('/shifaa')}>
            <View style={styles.quickAccessIcon}>
              <Ionicons name="chatbubble-ellipses" size={28} color="#4E8CFF" />
            </View>
            <Text style={styles.quickAccessTitle}>Ongea na Daktari AI</Text>
            <Text style={styles.quickAccessSubtitle}>Msaada masaa 24</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessCard} onPress={() => handlePress('/pharmacy')}>
            <View style={[styles.quickAccessIcon, { backgroundColor: '#D1FAE5' }]}>
              <FontAwesome5 name="clinic-medical" size={24} color="#10B981" />
            </View>
            <Text style={styles.quickAccessTitle}>Tafuta Duka la Dawa</Text>
            <Text style={styles.quickAccessSubtitle}>Karibu nawe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <Ionicons name="home" size={24} color="#4E8CFF" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => handlePress('/shifaa')}>
          <Ionicons name="chatbubbles" size={24} color="#94A3B8" />
          <Text style={styles.navText}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => handlePress('/pharmacy')}>
          <FontAwesome5 name="clinic-medical" size={24} color="#10B981" />
          <Text style={styles.navText}>Pharmacy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => handlePress('/profile')}>
          <Ionicons name="person" size={24} color="#94A3B8" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}





const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  fixedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    zIndex: 100,
  },
  infoBanner: {
  flexDirection: 'row',
  backgroundColor: '#DBEAFE',
  padding: 12,
  borderRadius: 12,
  marginBottom: 20,
  alignItems: 'flex-start',
},
infoText: {
  flex: 1,
  fontSize: 14,
  color: '#1E40AF',
},

  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748B',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  container: {
    padding: 10,
    paddingTop: 5,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: 16,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  specialty: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#64748B',
    fontSize: 13,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  availabilityContainer: {
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    color: '#64748B',
    fontSize: 14,
  },
  price: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
  },
  availability: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeDay: {
    backgroundColor: '#4E8CFF',
  },
  dayText: {
    color: '#64748B',
    fontWeight: '500',
    fontSize: 14,
  },
  activeDayText: {
    color: 'white',
  },
  bookButton: {
    backgroundColor: '#4E8CFF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
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
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
  tipCard: {
    width: 240,
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
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#64748B',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: 16,
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
