import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '@env';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext'; // ✅ Correct import

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams(); // this should be appointment.id
  const router = useRouter();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext); // ✅ Ensure context is used properly

  // 🔁 Fetch appointment details
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await fetch(`${BASE_URL}/appointments/${id}/`);
        const data = await response.json();
        setAppointment(data);
      } catch (error) {
        console.error('Error fetching appointment details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  // 🎤 Upload voice note
  const sendVoiceNote = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const audio = result.assets[0];

    const formData = new FormData();
    formData.append('audio_file', {
      uri: audio.uri,
      type: audio.mimeType || 'audio/mpeg',
      name: audio.name || `voice-${Date.now()}.mp3`,
    });

    try {
      const token = await AsyncStorage.getItem('access_token'); // ✅ Get token from storage

      const response = await fetch(`${BASE_URL}/api/voice-notes/send/${id}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert('Success', 'Voice note sent successfully!');
      } else {
        const errorData = await response.json();
        console.error('Voice note error:', errorData);
        Alert.alert('Error', errorData?.detail || 'Failed to send voice note.');
      }
    } catch (error) {
      console.error('Error sending voice note:', error);
      Alert.alert('Error', 'An error occurred while sending the voice note.');
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 40 }} />;
  }

  if (!appointment) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Appointment not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Appointment Details</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Doctor</Text>
            <Text style={styles.value}>{appointment.doctor_name || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Patient</Text>
            <Text style={styles.value}>{appointment.user_name || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{appointment.date || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>{appointment.time || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text
              style={[
                styles.value,
                { color: appointment.status === 'Completed' ? 'green' : '#1E40AF' },
              ]}
            >
              {appointment.status || 'Pending'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Confirmed</Text>
            <Text style={styles.value}>{appointment.is_confirmed ? 'Yes' : 'No'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Reason</Text>
            <Text style={styles.value}>{appointment.reason || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.value}>{appointment.notes || 'N/A'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Voice Note Button */}
      <TouchableOpacity
        style={styles.videoCallButton}
        onPress={sendVoiceNote}
      >
        <Ionicons name="mic" size={20} color="white" />
        <Text style={styles.buttonText}>  Send Voice Note</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1E40AF',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 20,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 6,
  },
  label: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
  },
  value: {
    fontSize: 15,
    color: '#111827',
    textAlign: 'right',
    flex: 1,
  },
  errorText: {
    color: 'red',
    padding: 16,
    textAlign: 'center',
  },
  videoCallButton: {
    backgroundColor: '#1E40AF',
    padding: 16,
    borderRadius: 30,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
