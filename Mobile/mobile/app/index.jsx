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
        console.error("Reminder fetch error:", error.response?.data || error.message);
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
    <View style={styles.page}>
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
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideUpAnim }] 
            }
          ]}
        >
          <View style={styles.doctorHeader}>
            <Image
              source={{ uri: 'https://img.freepik.com/free-photo/doctor-with-his-arms-crossed-white-background_1368-5790.jpg' }}
              style={styles.doctorImage}
            />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>Dkt. Johan Jenson</Text>
              <Text style={styles.specialty}>Daktari wa Magonjwa ya Ndani</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>4.9 (tathmini 128)</Text>
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
        <View style={[
          styles.infoBanner,
          reminderMessage ? styles.urgentBanner : null
        ]}>
          <Ionicons 
            name={reminderMessage ? "alert-circle-outline" : "information-circle-outline"} 
            size={20} 
            color={reminderMessage ? "#DC2626" : "#1E40AF"} 
            style={{ marginRight: 8 }} 
          />
          {reminderMessage ? (
            (() => {
              const now = new Date();
              const diffInMinutes = reminderTimestamp
                ? Math.floor((now - new Date(reminderTimestamp)) / 60000)
                : 0;

              const isClickable = appointmentInfo &&
                !appointmentInfo.isMissed &&
                diffInMinutes <= 30;

              return isClickable ? (
                <TouchableOpacity
                  onPress={() => {
                    if (appointmentInfo?.id) {
                      router.push(`/appointment/${appointmentInfo.id}`);
                    }
                  }}
                >
                  <Text style={styles.urgentText}>
                    {reminderMessage}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.urgentText}>
                  {reminderMessage}
                </Text>
              );
            })()
          ) : (
            <Text style={styles.infoText}>
              Karibu kwenye <Text style={styles.brandText}>Shifaa</Text> — msaidizi wako wa kiafya kwa lugha ya Kiswahili.
            </Text>
          )}
        </View>

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
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tipsScroll}
          contentContainerStyle={styles.tipsContainer}
        >
          <View style={styles.tipCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b' }}
              style={styles.tipImage}
            />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Kunywa Maji Kwa Wingi</Text>
              <Text style={styles.tipText}>Kunywa lita 2 za maji kila siku kwa afya njema</Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b' }}
              style={styles.tipImage}
            />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Mazoezi ya Kila Siku</Text>
              <Text style={styles.tipText}>Dakika 30 za mazoezi kila siku kudumisha afya</Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }}
              style={styles.tipImage}
            />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Lishe Bora</Text>
              <Text style={styles.tipText}>Kula mboga na matunda kwa wingi kwa afya bora</Text>
            </View>
          </View>
        </ScrollView>

        {/* Services Section */}
        <Text style={styles.sectionTitle}>Huduma Zingine</Text>
        <View style={styles.servicesGrid}>
          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => handlePress('/Record/records')}
          >
            <View style={[styles.serviceIcon, styles.recordsIcon]}>
              <Ionicons name="document-text-outline" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.serviceTitle}>Kumbukumbu Zako</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => handlePress('/lab')}
          >
            <View style={[styles.serviceIcon, styles.labIcon]}>
              <MaterialCommunityIcons name="test-tube" size={24} color="#10B981" />
            </View>
            <Text style={styles.serviceTitle}>Uchunguzi wa Maabara</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => handlePress('/emergency')}
          >
            <View style={[styles.serviceIcon, styles.emergencyIcon]}>
              <Ionicons name="medkit-outline" size={24} color="#EF4444" />
            </View>
            <Text style={styles.serviceTitle}>Dharura</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => handlePress('/articles')}
          >
            <View style={[styles.serviceIcon, styles.articlesIcon]}>
              <Ionicons name="newspaper-outline" size={24} color="#8B5CF6" />
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

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => handlePress('/shifaa')}
        >
          <Ionicons name="chatbubbles" size={24} color="#94A3B8" />
          <Text style={styles.navText}>Mazungumzo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => handlePress('/appointments')}
        >
          <Ionicons name="calendar" size={24} color="#94A3B8" />
          <Text style={styles.navText}>Miadi</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => handlePress('/profile')}
        >
          <Ionicons name="person" size={24} color="#94A3B8" />
          <Text style={styles.navText}>Akaunti</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 16,
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
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    shadowColor: '#4E8CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  urgentBanner: {
    backgroundColor: '#FEE2E2',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  urgentText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    lineHeight: 20,
  },
  brandText: {
    fontWeight: '700',
    color: '#1E40AF',
  },
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
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
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