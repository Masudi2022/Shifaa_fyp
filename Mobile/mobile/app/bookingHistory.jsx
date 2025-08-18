import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "@env";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';

export default function BookingHistory() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const init = async () => {
      const storedToken = await AsyncStorage.getItem("access_token");
      setToken(storedToken);
      if (!storedToken) return;
      fetchBookings(storedToken);
    };
    init();
  }, []);

  const fetchBookings = async (authToken) => {
    try {
      const response = await axios.get(`${BASE_URL}/my-appointments/`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      // Sort bookings by date (newest first)
      const sortedBookings = response.data.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      setBookings(sortedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings(token);
  };

  const deleteBooking = async (id) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to cancel this appointment?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${BASE_URL}/appointment/${id}/delete/`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert("Success", "Appointment cancelled successfully");
              fetchBookings(token);
            } catch (error) {
              console.error("Delete error:", error.response?.data || error.message);
              Alert.alert(
                "Error", 
                error.response?.data?.detail || "Failed to cancel appointment"
              );
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return '#10B981';
      case 'confirmed': return '#3B82F6';
      case 'cancelled': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderBooking = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color="#fff" />
        </View>
        <View>
          <Text style={styles.name}>
            Dr. {item.doctor_name || item.doctor || "Unknown Doctor"}
          </Text>
          <Text style={styles.specialty}>
            {item.specialization || "General Practitioner"}
          </Text>
        </View>
      </View>

      <View style={styles.timeContainer}>
        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
        <Text style={styles.time}>
          {moment(item.date).format('ddd, MMM D, YYYY')} at {item.time}
        </Text>
      </View>

      {item.reason && (
        <View style={styles.infoRow}>
          <Ionicons name="document-text-outline" size={16} color="#6B7280" />
          <Text style={styles.notes}>Reason: {item.reason}</Text>
        </View>
      )}

      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status || "Pending"}</Text>
        </View>
        <View style={[styles.confirmationBadge, { 
          backgroundColor: item.is_confirmed ? '#D1FAE5' : '#FEE2E2'
        }]}>
          <Ionicons 
            name={item.is_confirmed ? "checkmark-circle" : "close-circle"} 
            size={16} 
            color={item.is_confirmed ? '#10B981' : '#EF4444'} 
          />
          <Text style={[styles.confirmationText, {
            color: item.is_confirmed ? '#10B981' : '#EF4444'
          }]}>
            {item.is_confirmed ? "Confirmed" : "Not Confirmed"}
          </Text>
        </View>
      </View>

      {item.notes ? (
        <View style={styles.doctorNotesContainer}>
          <Ionicons name="medical" size={16} color="#3B82F6" />
          <Text style={styles.doctorNotes}>Doctor's notes: {item.notes}</Text>
        </View>
      ) : (
        <View style={styles.noNotesContainer}>
          <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
          <Text style={styles.noNotes}>No notes from doctor</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteBooking(item.id)}
      >
        <Text style={styles.deleteButtonText}>Cancel Appointment</Text>
        <Ionicons name="trash-outline" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f8f9fa', '#e9f2ff']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#4E8CFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Appointment History</Text>
        <View style={styles.headerButton} />
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4E8CFF" />
          <Text style={styles.loadingText}>Loading your appointments...</Text>
        </View>
      ) : bookings.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#4E8CFF']}
            />
          }
        >
          <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Appointments Found</Text>
          <Text style={styles.emptyText}>You don't have any appointments yet.</Text>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => router.push('/booking')}
          >
            <Text style={styles.bookButtonText}>Book an Appointment</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#4E8CFF']}
            />
          }
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              You have {bookings.length} appointment{bookings.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  headerButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2c3e50",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#7f8c8d",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 15,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 5,
  },
  bookButton: {
    backgroundColor: '#4E8CFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  listHeader: {
    fontSize: 16,
    color: '#6B7280',
    marginVertical: 15,
    paddingLeft: 5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4E8CFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  specialty: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  time: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  confirmationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  confirmationText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  doctorNotesContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  doctorNotes: {
    fontSize: 14,
    color: "#1E40AF",
    marginLeft: 8,
    flex: 1,
  },
  noNotesContainer: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  noNotes: {
    fontSize: 14,
    color: "#9CA3AF",
    marginLeft: 8,
    fontStyle: "italic",
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    marginRight: 8,
  },
});