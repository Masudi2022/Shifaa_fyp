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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "@env";
import { useRouter } from "expo-router";

export default function BookingHistory() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/my-appointments/`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setBookings(response.data);
    } catch (error) {
      console.error("Error fetching bookings:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteBooking = async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/appointment/${id}/delete/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        Alert.alert("Deleted successfully");
        fetchBookings(token);
      }
    } catch (error) {
      console.error("Delete error:", error.response?.data || error.message);
      Alert.alert("Failed to delete", error.response?.data?.detail || error.message);
    }
  };

  const renderBooking = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>
        Dr. {item.doctor_name || item.doctor || "Unknown"}
      </Text>
      <Text style={styles.time}>
        {item.date} at {item.time}
      </Text>
      {item.reason && <Text style={styles.notes}>Reason: {item.reason}</Text>}

      {/* Show confirmation status */}
      <Text style={styles.status}>
        Confirmation:{" "}
        <Text style={{ color: item.is_confirmed ? "green" : "red" }}>
          {item.is_confirmed ? "Confirmed" : "Not Confirmed"}
        </Text>
      </Text>

      {/* Show appointment status */}
      <Text style={styles.status}>
        Status:{" "}
        <Text style={{ fontWeight: "bold", color: "#007BFF" }}>
          {item.status || "Pending"}
        </Text>
      </Text>

      {/* Delete button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#EF4444" }]}
        onPress={() =>
          Alert.alert("Delete Appointment", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteBooking(item.id) },
          ])
        }
      >
        <Text style={styles.buttonText}>Delete</Text>
        <Ionicons name="trash" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#4E8CFF" />
        </TouchableOpacity>
        <Text style={styles.title}>My Booking History</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4E8CFF" />
      ) : bookings.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
          No bookings found
        </Text>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#4E8CFF" },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
    borderLeftWidth: 5,
    borderLeftColor: "#10B981",
  },
  name: { fontSize: 16, fontWeight: "bold" },
  time: { fontSize: 14, color: "#4E8CFF" },
  notes: { fontSize: 13, color: "#888", marginVertical: 4 },
  status: { fontSize: 14, marginTop: 4 },
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
});
