// app/records.jsx
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { BASE_URL } from "@env";
import { AuthContext } from "../../context/AuthContext"; // adjust path if needed

export default function Records() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { refreshAccessToken } = useContext(AuthContext);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        let token = await AsyncStorage.getItem("access_token");

        if (!token) {
          console.log("No token found, trying refresh...");
          token = await refreshAccessToken();
          if (!token) {
            setLoading(false);
            return;
          }
        }

        const res = await axios.get(`${BASE_URL}/reports/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setReports(res.data);
      } catch (err) {
        console.error("Error fetching reports:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const openPDF = (url) => {
    if (!url) {
      console.warn("No PDF available for this report");
      return;
    }
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open PDF:", err)
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/reportdetails",
            params: { id: item.id },
          })
        }
      >
        <Text style={styles.title}>
          {item.disease || "Unknown Disease"}
        </Text>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {item.summary}
        </Text>
      </TouchableOpacity>

      {item.pdf && (
        <TouchableOpacity
          style={styles.pdfButton}
          onPress={() => openPDF(item.pdf)}
        >
          <Text style={styles.pdfButtonText}>📄 View PDF</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Medical Reports</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : reports.length === 0 ? (
        <Text style={styles.emptyText}>No reports found</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    paddingHorizontal: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 15,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
  },
  date: {
    fontSize: 12,
    color: "#888",
    marginVertical: 4,
  },
  summary: {
    fontSize: 14,
    color: "#555",
  },
  emptyText: {
    marginTop: 30,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  pdfButton: {
    marginTop: 10,
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: "center",
  },
  pdfButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
