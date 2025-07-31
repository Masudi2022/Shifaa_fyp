// app/(tabs)/availability.js
import React, { useContext, useEffect, useState } from 'react';
import {
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext'; 
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '@env';

const baseUrl = BASE_URL;

export default function Availability() {
  const authContext = useContext(AuthContext);
  const { refreshAccessToken, user } = authContext || {};
  const router = useRouter();

  const [availabilities, setAvailabilities] = useState([]);
  const [form, setForm] = useState({
    date: '',
    day_of_week: '',
    start_time: new Date(new Date().setHours(8, 0, 0, 0)),
    end_time: new Date(new Date().setHours(17, 0, 0, 0)),
    notes: '',
  });

  const [editingId, setEditingId] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const getAuthAxios = async () => {
    let token = await AsyncStorage.getItem('access_token');
    if (!token && refreshAccessToken) {
      token = await refreshAccessToken();
    }

    return axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  useEffect(() => {
    const marked = {};
    availabilities.forEach(avail => {
      marked[avail.date] = { marked: true, dotColor: '#4E8CFF' };
    });
    if (form.date) {
      marked[form.date] = { ...marked[form.date], selected: true, selectedColor: '#4E8CFF' };
    }
    setMarkedDates(marked);
  }, [availabilities, form.date]);

  const fetchAvailabilities = async () => {
    try {
      const authAxios = await getAuthAxios();
      const response = await authAxios.get(`/availability/`);
      setAvailabilities(response.data);
    } catch (error) {
      console.error('Error fetching availability:', error.response?.data || error.message);
      Alert.alert('Error', 'Could not fetch availabilities');
    }
  };

  const handleSave = async () => {
    const { date, start_time, end_time } = form;
    if (!date) {
      Alert.alert('Validation Error', 'Please select a date');
      return;
    }

    const startTimeStr = `${start_time.getHours().toString().padStart(2, '0')}:${start_time.getMinutes().toString().padStart(2, '0')}`;
    const endTimeStr = `${end_time.getHours().toString().padStart(2, '0')}:${end_time.getMinutes().toString().padStart(2, '0')}`;

    try {
      const authAxios = await getAuthAxios();

      const payload = {
        ...form,
        start_time: startTimeStr,
        end_time: endTimeStr,
      };

      if (!form.day_of_week && form.date) {
        const weekday = new Date(form.date).toLocaleDateString('en-US', { weekday: 'long' });
        payload.day_of_week = weekday;
      }

      if (editingId) {
        await authAxios.put(`/availability/${editingId}/`, payload);
        setEditingId(null);
      } else {
        await authAxios.post(`/availability/`, payload);
      }

      setForm({ 
        date: '', 
        day_of_week: '',
        start_time: new Date(new Date().setHours(8, 0, 0, 0)),
        end_time: new Date(new Date().setHours(17, 0, 0, 0)),
        notes: '', 
      });
      setShowCalendar(false);
      fetchAvailabilities();
    } catch (error) {
      console.error('Error saving availability:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to save availability');
    }
  };

  const handleEdit = (availability) => {
    const [startHours, startMinutes] = availability.start_time.split(':').map(Number);
    const [endHours, endMinutes] = availability.end_time.split(':').map(Number);
    
    const startTime = new Date();
    startTime.setHours(startHours, startMinutes);
    
    const endTime = new Date();
    endTime.setHours(endHours, endMinutes);
    
    setForm({
      date: availability.date,
      start_time: startTime,
      end_time: endTime,
      notes: availability.notes,
    });
    setEditingId(availability.id);
    setShowCalendar(false);
  };

  const handleDelete = async (id) => {
    try {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this availability?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: async () => {
              const authAxios = await getAuthAxios();
              await authAxios.delete(`/availability/${id}/`);
              fetchAvailabilities();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting availability:', error.message);
    }
  };

  const onStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setForm({...form, start_time: selectedTime});
    }
  };

  const onEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setForm({...form, end_time: selectedTime});
    }
  };

  const formatTime = (date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#4E8CFF" />
          </TouchableOpacity>
          <Text style={styles.heading}>Manage Availability</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Form Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add New Availability</Text>
            
            {/* Date Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity 
                style={styles.inputField} 
                onPress={() => setShowCalendar(!showCalendar)}
              >
                <Text style={styles.inputText}>
                  {form.date || 'Select a date'}
                </Text>
                <Ionicons name="calendar" size={20} color="#4E8CFF" />
              </TouchableOpacity>
            </View>

            {showCalendar && (
              <View style={styles.calendarContainer}>
                <Calendar
                  markedDates={markedDates}
                  onDayPress={(day) => {
                    const date = day.dateString;
                    const weekday = new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                    });
                    setForm({ ...form, date, day_of_week: weekday });
                    setShowCalendar(false);
                  }}
                  theme={{
                    selectedDayBackgroundColor: '#4E8CFF',
                    todayTextColor: '#4E8CFF',
                    arrowColor: '#4E8CFF',
                    monthTextColor: '#1E293B',
                    textDayFontFamily: 'System',
                  }}
                />
              </View>
            )}

            {/* Time Pickers */}
            <View style={styles.timePickersRow}>
              <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TouchableOpacity
                  style={styles.inputField}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={styles.inputText}>{formatTime(form.start_time)}</Text>
                  <Ionicons name="time-outline" size={20} color="#4E8CFF" />
                </TouchableOpacity>
                {showStartTimePicker && (
                  <DateTimePicker
                    value={form.start_time}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={onStartTimeChange}
                  />
                )}
              </View>

              <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TouchableOpacity
                  style={styles.inputField}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={styles.inputText}>{formatTime(form.end_time)}</Text>
                  <Ionicons name="time-outline" size={20} color="#4E8CFF" />
                </TouchableOpacity>
                {showEndTimePicker && (
                  <DateTimePicker
                    value={form.end_time}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={onEndTimeChange}
                  />
                )}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                placeholder="Any additional information..."
                style={[styles.inputField, styles.textArea]}
                value={form.notes}
                onChangeText={(text) => setForm({ ...form, notes: text })}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.button,
                  editingId ? styles.updateButton : styles.createButton,
                ]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>
                  {editingId ? 'Update Availability' : 'Save Availability'}
                </Text>
              </TouchableOpacity>

              {editingId && (
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setEditingId(null);
                    setForm({
                      date: '',
                      start_time: new Date(new Date().setHours(8, 0, 0, 0)),
                      end_time: new Date(new Date().setHours(17, 0, 0, 0)),
                      notes: '',
                    });
                  }}
                >
                  <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Availabilities List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Availability Slots</Text>
              <Text style={styles.sectionSubtitle}>{availabilities.length} scheduled</Text>
            </View>

            {availabilities.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#CBD5E0" />
                <Text style={styles.emptyStateText}>
                  No availability slots added yet
                </Text>
              </View>
            ) : (
              <FlatList
                data={availabilities}
                scrollEnabled={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardDate}>{item.date}</Text>
                        <Text style={styles.cardDay}>{item.day_of_week}</Text>
                      </View>
                      <Text style={styles.cardTime}>
                        {item.start_time} - {item.end_time}
                      </Text>
                      {item.notes && (
                        <Text style={styles.cardNotes}>{item.notes}</Text>
                      )}
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => handleEdit(item)}
                      >
                        <Ionicons name="create-outline" size={18} color="#ffffff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(item.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  inputField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#ffffff',
  },
  inputText: {
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    alignItems: 'flex-start',
  },
  timePickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  buttonGroup: {
    marginTop: 8,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  createButton: {
    backgroundColor: '#4E8CFF',
  },
  updateButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  cardDay: {
    fontSize: 14,
    color: '#64748B',
  },
  cardTime: {
    fontSize: 14,
    color: '#4E8CFF',
    fontWeight: '500',
    marginBottom: 8,
  },
  cardNotes: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#4E8CFF',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
});