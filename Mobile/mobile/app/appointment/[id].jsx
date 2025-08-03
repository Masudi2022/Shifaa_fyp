// app/appointment/[id].js

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const appointmentData = {
  id: 5,
  user: "johary@gmail.com",
  user_name: "johari abdallah",
  doctor: "salum@gmail.com",
  doctor_name: "salum",
  date: "2025-08-03",
  time: "15:00:07",
  reason: "Ninaumwa kichwa",
  created_at: "2025-07-31T13:56:42.096622+03:00",
  is_confirmed: true,
  notes: "Hey come quick"
};

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const handleVideoCall = () => {
    alert('Starting video call with Dr. ' + appointmentData.doctor_name);
    // Here you would implement actual video call functionality
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
        <View style={{ width: 24 }} /> {/* Spacer for alignment */}
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Patient:</Text>
            <Text style={styles.detailValue}>{appointmentData.user_name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Doctor:</Text>
            <Text style={styles.detailValue}>Dr. {appointmentData.doctor_name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{appointmentData.time}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason for Visit</Text>
            <Text style={styles.sectionContent}>{appointmentData.reason}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Doctor's Notes</Text>
            <Text style={styles.sectionContent}>{appointmentData.notes}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Video Call Button at Bottom */}
      <TouchableOpacity 
        style={styles.videoCallButton} 
        onPress={handleVideoCall}
      >
        <MaterialIcons name="video-call" size={28} color="white" />
        <Text style={styles.videoCallText}>Start Video Call</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a73e8',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginBottom: 80, // Space for the video call button
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailLabel: {
    color: '#555',
    fontSize: 16,
    fontWeight: '500',
  },
  detailValue: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#1a73e8',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionContent: {
    color: '#333',
    fontSize: 16,
    lineHeight: 24,
  },
  videoCallButton: {
    position: 'absolute',
    left: 20,
    top: '56%',
    right: 20,
    backgroundColor: '#1a73e8',
    borderRadius: 50,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  videoCallText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});