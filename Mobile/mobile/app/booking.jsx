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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "@env";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";

export default function BookingPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
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
    setSelectedTime(null);
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
      Alert.alert("Appointment booked successfully!");
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
      <View style={styles.info}>
        <Text style={styles.name}>
          {item.doctor_name || item.doctor_email || "Unknown Doctor"}
        </Text>
        <Text style={styles.specialty}>
          {item.specialization || "Specialization not set"}
        </Text>
        <Text style={styles.time}>
          {item.day_of_week || "Day not set"} | {item.start_time} - {item.end_time}
        </Text>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
        <TouchableOpacity
          style={styles.button}
          onPress={() => openBookingModal(item)}
        >
          <Text style={styles.buttonText}>Book Now</Text>
          <Ionicons name="calendar" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header with Back and Booking History */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Ionicons name="arrow-back" size={28} color="#4E8CFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Available Doctors</Text>
        <TouchableOpacity onPress={() => router.push("/bookingHistory")}>
          <Ionicons name="time-outline" size={28} color="#4E8CFF" />
        </TouchableOpacity>
      </View>

      {loadingDoctors ? (
        <ActivityIndicator size="large" color="#4E8CFF" />
      ) : doctors.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
          No doctors available
        </Text>
      ) : (
        <FlatList
          data={doctors}
          renderItem={renderDoctor}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Booking Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Book Appointment with Dr.{" "}
              {selectedDoctor?.doctor_name || selectedDoctor?.doctor_email || ""}
            </Text>
            <Text style={{ marginBottom: 8 }}>Select Date:</Text>
            <Calendar
              onDayPress={onDateSelect}
              markedDates={
                selectedDate
                  ? { [selectedDate]: { selected: true, selectedColor: "#4E8CFF" } }
                  : {}
              }
              style={{ marginBottom: 8 }}
            />
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.timePickerText}>
                {selectedTime ? selectedTime.toLocaleTimeString() : "Select Time"}
              </Text>
              <Ionicons name="time" size={20} color="#4E8CFF" />
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={selectedTime || new Date()}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
            <TextInput
              placeholder="Reason (optional)"
              value={reason}
              onChangeText={setReason}
              style={styles.input}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, { marginRight: 10 }]}
                onPress={submitBooking}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#EF4444" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#4E8CFF" },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
    borderLeftWidth: 5,
    borderLeftColor: "#10B981",
  },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: "bold" },
  specialty: { fontSize: 14, color: "#555", marginBottom: 4 },
  time: { fontSize: 13, color: "#4E8CFF" },
  notes: { fontSize: 13, color: "#888", fontStyle: "italic", marginVertical: 4 },
  button: {
    flexDirection: "row",
    backgroundColor: "#4E8CFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 6,
  },
  buttonText: { color: "#fff", marginRight: 6 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 10, width: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  timePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
  },
  timePickerText: { fontSize: 14, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    textAlignVertical: "top",
  },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end" },
});
