import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import { BASE_URL } from '@env';

const baseUrl = BASE_URL;

const Appointments = () => {
  const router = useRouter();
  const { refreshAccessToken } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notes Modal State
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notesText, setNotesText] = useState('');

  const fetchAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');

      const response = await axios.get(`${baseUrl}/doctor-appointments/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAppointments(response.data);
    } catch (error) {
      console.error('Fetch error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) fetchAppointments();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateAppointment = async (id, updates) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      await axios.patch(`${baseUrl}/appointment/${id}/update-status/`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAppointments();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    }
  };

  // Open Notes Modal
  const openNotesModal = (appointment) => {
    setSelectedAppointment(appointment);
    setNotesText(appointment.notes || '');
    setNotesModalVisible(true);
  };

  // Save Notes
  const saveNotes = () => {
    if (!selectedAppointment) return;
    updateAppointment(selectedAppointment.id, { notes: notesText });
    setNotesModalVisible(false);
  };

  const renderAppointment = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>Patient: {item.user_name || 'Unknown'}</Text>
      <Text style={styles.subtitle}>
        {item.date} at {item.time}
      </Text>
      <Text style={styles.reason}>Reason: {item.reason || 'Not specified'}</Text>
      <Text style={styles.status}>
        Status: {item.status} | {item.is_confirmed ? 'Confirmed' : 'Not Confirmed'}
      </Text>

      {item.notes ? (
        <Text style={styles.notes}>📝 Notes: {item.notes}</Text>
      ) : (
        <Text style={styles.noNotes}>No notes yet</Text>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: item.is_confirmed ? '#EF4444' : '#10B981' }]}
          onPress={() => updateAppointment(item.id, { is_confirmed: !item.is_confirmed })}
        >
          <Text style={styles.buttonText}>{item.is_confirmed ? 'Unconfirm' : 'Confirm'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#3B82F6' }]}
          onPress={() => updateAppointment(item.id, { status: 'Ongoing' })}
        >
          <Text style={styles.buttonText}>Ongoing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#F59E0B' }]}
          onPress={() => updateAppointment(item.id, { status: 'Pending' })}
        >
          <Text style={styles.buttonText}>Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#8B5CF6' }]}
          onPress={() => updateAppointment(item.id, { status: 'Completed' })}
        >
          <Text style={styles.buttonText}>Completed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#6B7280' }]}
          onPress={() => openNotesModal(item)}
        >
          <Text style={styles.buttonText}>Add/Edit Notes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerText}>My Appointments</Text>
        <TouchableOpacity
          onPress={() => router.push('/availability')}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="timetable" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAppointment}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Notes Modal */}
      <Modal
        visible={notesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add/Edit Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Write notes here..."
              value={notesText}
              onChangeText={setNotesText}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#10B981' }]} onPress={saveNotes}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#EF4444' }]} onPress={() => setNotesModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Appointments;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#007BFF',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  reason: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
  },
  status: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  notes: {
    marginTop: 8,
    fontSize: 14,
    color: '#16A34A',
    fontStyle: 'italic',
  },
  noNotes: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#007BFF',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
});
