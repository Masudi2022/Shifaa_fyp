import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "@env";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

export default function BookingPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [reason, setReason] = useState("");
  const [token, setToken] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const storedToken = await AsyncStorage.getItem("access_token");
      setToken(storedToken);
      if (!storedToken) {
        console.error("No token found — user might not be logged in");
        setLoadingDoctors(false);
        return;
      }
      fetchDoctors(storedToken);
    };
    initialize();
  }, []);

  const fetchDoctors = async (authToken) => {
    setLoadingDoctors(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/availability/available-doctors/`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setDoctors(response.data);
    } catch (error) {
      console.error("Error fetching doctors:", error.response?.data || error.message);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const openBookingModal = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate(null);
    setSelectedTime(new Date());
    setReason("");
    setModalVisible(true);
  };

  const onDateSelect = (day) => setSelectedDate(day.dateString);

  const onTimeChange = (event, selected) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selected) setSelectedTime(selected);
  };

  const submitBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedDoctor) {
      Alert.alert("Please fill all booking details.");
      return;
    }
    const timeStr = selectedTime.toTimeString().split(" ")[0];
    try {
      await axios.post(
        `${BASE_URL}/appointment/book/`,
        {
          doctor: selectedDoctor.doctor_email,
          date: selectedDate,
          time: timeStr,
          reason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Success", "Appointment booked successfully!");
      setModalVisible(false);
    } catch (error) {
      Alert.alert(
        "Booking failed",
        error.response?.data ? JSON.stringify(error.response.data) : error.message
      );
    }
  };

  const renderDoctor = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>
            {item.doctor_name || item.doctor_email || "Unknown Doctor"}
          </Text>
          <Text style={styles.specialty}>
            {item.specialization || "General Practitioner"}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#4E8CFF" />
          <Text style={styles.infoText}>{item.day_of_week || "Flexible schedule"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#4E8CFF" />
          <Text style={styles.infoText}>{item.start_time} - {item.end_time}</Text>
        </View>
        {item.notes && (
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={16} color="#4E8CFF" />
            <Text style={styles.notes}>{item.notes}</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => openBookingModal(item)}
      >
        <Text style={styles.buttonText}>Panga Miadi</Text>
        <Ionicons name="arrow-forward" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" paddingTop={StatusBar.currentHeight} />

      {/* Header */}
      <LinearGradient
        colors={['#f8f9fa', '#e9f2ff']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity 
          onPress={() => router.push("/")}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#4E8CFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Daktari wanao patikana</Text>
        <TouchableOpacity 
          onPress={() => router.push("/bookingHistory")}
          style={styles.headerButton}
        >
          <Ionicons name="time-outline" size={24} color="#4E8CFF" />
        </TouchableOpacity>
      </LinearGradient>

      {loadingDoctors ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4E8CFF" />
          <Text style={styles.loadingText}>Loading available doctors...</Text>
        </View>
      ) : doctors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="medkit-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No doctors available at the moment</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => fetchDoctors(token)}
          >
            <Ionicons name="refresh" size={20} color="#4E8CFF" />
            <Text style={styles.refreshText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={doctors}
          renderItem={renderDoctor}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.listHeader}>Wataalamu wanopatikana</Text>
          }
        />
      )}

      {/* Booking Modal */}
      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.modalTitle}>
                Book with Dr. {selectedDoctor?.doctor_name || selectedDoctor?.doctor_email || ""}
              </Text>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Date</Text>
                <Calendar
                  onDayPress={onDateSelect}
                  markedDates={
                    selectedDate
                      ? { 
                          [selectedDate]: { 
                            selected: true, 
                            selectedColor: "#4E8CFF",
                            selectedTextColor: "#fff"
                          } 
                        }
                      : {}
                  }
                  theme={{
                    backgroundColor: '#fff',
                    calendarBackground: '#fff',
                    textSectionTitleColor: '#4E8CFF',
                    selectedDayBackgroundColor: '#4E8CFF',
                    selectedDayTextColor: '#fff',
                    todayTextColor: '#4E8CFF',
                    dayTextColor: '#2d4150',
                    textDisabledColor: '#d9e1e8',
                    dotColor: '#4E8CFF',
                    selectedDotColor: '#fff',
                    arrowColor: '#4E8CFF',
                    monthTextColor: '#4E8CFF',
                    indicatorColor: '#4E8CFF',
                    textDayFontFamily: 'System',
                    textMonthFontFamily: 'System',
                    textDayHeaderFontFamily: 'System',
                    textDayFontWeight: '400',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '400',
                    textDayFontSize: 14,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 14
                  }}
                />
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Time</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time" size={20} color="#4E8CFF" />
                  <Text style={styles.timePickerText}>
                    {selectedTime ? selectedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Select Time"}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display="spinner"
                    onChange={onTimeChange}
                    minuteInterval={15}
                    textColor="#4E8CFF"
                  />
                )}
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reason for Visit</Text>
                <TextInput
                  placeholder="Briefly describe your reason for the appointment"
                  placeholderTextColor="#999"
                  value={reason}
                  onChangeText={setReason}
                  style={styles.input}
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={submitBooking}
                  disabled={!selectedDate || !selectedTime}
                >
                  <Text style={styles.modalButtonText}>Confirm Booking</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 45,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(78, 140, 255, 0.1)'
  },
  title: {
    fontSize: 22,
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
  emptyText: {
    marginTop: 15,
    color: "#95a5a6",
    fontSize: 16,
    textAlign: "center",
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(78, 140, 255, 0.1)'
  },
  refreshText: {
    marginLeft: 8,
    color: "#4E8CFF",
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4E8CFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  specialty: {
    fontSize: 14,
    color: "#4E8CFF",
    fontWeight: '500',
  },
  cardBody: {
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#34495e",
    marginLeft: 8,
  },
  notes: {
    fontSize: 13,
    color: "#7f8c8d",
    marginLeft: 8,
    fontStyle: "italic",
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#4E8CFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: width * 0.9,
    maxHeight: '80%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalScrollContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4E8CFF',
    marginBottom: 10,
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e1e5e9",
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  timePickerText: {
    fontSize: 16,
    color: "#2c3e50",
    marginLeft: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e1e5e9",
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    fontSize: 14,
    color: '#2c3e50',
    textAlignVertical: "top",
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f2f6",
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: "#4E8CFF",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});