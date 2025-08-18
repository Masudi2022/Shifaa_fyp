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
  TextInput,
  RefreshControl,
  ScrollView
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import { BASE_URL } from '@env';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';

const Appointments = () => {
  const router = useRouter();
  const { refreshAccessToken } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notesText, setNotesText] = useState('');

  const fetchAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');

      const response = await axios.get(`${BASE_URL}/doctor-appointments/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Sort by date (newest first) and then by time
      const sortedAppointments = response.data.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA - dateB;
      });

      setAppointments(sortedAppointments);
    } catch (error) {
      console.error('Fetch error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) fetchAppointments();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const updateAppointment = async (id, updates) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      await axios.patch(`${BASE_URL}/appointment/${id}/update-status/`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchAppointments();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    }
  };

  const openNotesModal = (appointment) => {
    setSelectedAppointment(appointment);
    setNotesText(appointment.notes || '');
    setNotesModalVisible(true);
  };

  const saveNotes = async () => {
    if (!selectedAppointment) return;
    await updateAppointment(selectedAppointment.id, { notes: notesText });
    setNotesModalVisible(false);
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return '#10B981';
      case 'confirmed': return '#3B82F6';
      case 'cancelled': return '#EF4444';
      case 'pending': return '#F59E0B';
      case 'ongoing': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const renderAppointment = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color="#fff" />
        </View>
        <View>
          <Text style={styles.title}>{item.user_name || 'Unknown Patient'}</Text>
          <Text style={styles.subtitle}>
            {moment(item.date).format('ddd, MMM D')} at {item.time}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        {item.reason && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={16} color="#6B7280" />
            <Text style={styles.reason}>{item.reason}</Text>
          </View>
        )}

        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status || 'Pending'}</Text>
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
          <TouchableOpacity 
            style={styles.notesContainer}
            onPress={() => openNotesModal(item)}
          >
            <Ionicons name="document-text" size={16} color="#3B82F6" />
            <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.addNotesButton}
            onPress={() => openNotesModal(item)}
          >
            <Ionicons name="add-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.addNotesText}>Add notes</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
          onPress={() => updateAppointment(item.id, { status: 'Ongoing' })}
        >
          <Feather name="clock" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Ongoing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#10B981' }]}
          onPress={() => updateAppointment(item.id, { is_confirmed: !item.is_confirmed })}
        >
          <Ionicons 
            name={item.is_confirmed ? "close-circle" : "checkmark-circle"} 
            size={16} 
            color="#fff" 
          />
          <Text style={styles.actionButtonText}>
            {item.is_confirmed ? 'Unconfirm' : 'Confirm'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
          onPress={() => updateAppointment(item.id, { status: 'Completed' })}
        >
          <Feather name="check-circle" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <LinearGradient
        colors={['#4E8CFF', '#6A5ACD']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>My Appointments</Text>
        <TouchableOpacity
          onPress={() => router.push('/availability')}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="timetable" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4E8CFF" />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : appointments.length === 0 ? (
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
          <Text style={styles.emptyTitle}>No Appointments Scheduled</Text>
          <Text style={styles.emptyText}>You don't have any upcoming appointments.</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAppointment}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#4E8CFF']}
            />
          }
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {appointments.length} upcoming appointment{appointments.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      )}

      {/* Notes Modal */}
      <Modal
        visible={notesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Notes for {selectedAppointment?.user_name || 'Patient'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedAppointment?.date} at {selectedAppointment?.time}
            </Text>
            
            <TextInput
              style={styles.notesInput}
              placeholder="Enter your clinical notes here..."
              placeholderTextColor="#9CA3AF"
              value={notesText}
              onChangeText={setNotesText}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setNotesModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveNotes}
              >
                <Text style={styles.modalButtonText}>Save Notes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 5,
  },
  listContainer: {
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
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4E8CFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  cardBody: {
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reason: {
    fontSize: 14,
    color: '#4B5563',
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
  notesContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  notes: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
  addNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  addNotesText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    fontSize: 14,
    color: '#2c3e50',
    minHeight: 150,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f2f6',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#4E8CFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Appointments;