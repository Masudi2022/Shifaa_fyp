import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '@env'; // Make sure you set this in .env

export default function AvailableDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/availability/`);
      // Filter only available doctors
      const available = response.data.filter(avail => avail.status === 'available');
      setDoctors(available);
    } catch (error) {
      console.error('Error fetching doctors:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const renderDoctor = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.doctor?.profile_image || 'https://via.placeholder.com/150' }}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.doctor?.full_name || 'Unknown Doctor'}</Text>
        <Text style={styles.specialty}>{item.doctor?.specialty || 'Specialty not set'}</Text>
        <Text style={styles.price}>{item.doctor?.price || '$0/session'}</Text>
        <Text style={styles.time}>
          {item.date || item.day_of_week} | {item.start_time} - {item.end_time}
        </Text>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Book Now</Text>
          <Ionicons name="calendar" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E8CFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Text style={styles.title}>Available Doctors</Text>
      <FlatList
        data={doctors}
        renderItem={renderDoctor}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#4E8CFF',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#10B981',
  },
  image: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ddd' },
  info: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: 'bold' },
  specialty: { fontSize: 14, color: '#555' },
  price: { fontSize: 14, color: '#333', marginVertical: 4 },
  time: { fontSize: 13, color: '#4E8CFF' },
  notes: { fontSize: 13, color: '#888', fontStyle: 'italic', marginVertical: 4 },
  button: {
    flexDirection: 'row',
    backgroundColor: '#4E8CFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  buttonText: { color: '#fff', marginRight: 6 },
});
