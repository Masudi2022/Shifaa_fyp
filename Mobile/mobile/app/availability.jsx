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
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext'; 
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '@env'; // ✅ Use environment variable for base URL

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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4E8CFF" />
        </TouchableOpacity>
        <Text style={styles.heading}>Manage Availability</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <TouchableOpacity 
            style={styles.dateInput} 
            onPress={() => setShowCalendar(!showCalendar)}
          >
            <Text style={styles.dateInputText}>
              {form.date || 'Select a date'}
            </Text>
            <Ionicons name="calendar" size={20} color="#4E8CFF" />
          </TouchableOpacity>

          {showCalendar && (
            <View style={styles.calendarContainer}>
              <Calendar
  markedDates={markedDates}
  onDayPress={(day) => {
    const date = day.dateString;
    const weekday = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

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


          <View style={styles.timePickerContainer}>
            <Text style={styles.timeLabel}>Start Time</Text>
            <TouchableOpacity 
              style={styles.timeInput}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text>{formatTime(form.start_time)}</Text>
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

          <View style={styles.timePickerContainer}>
            <Text style={styles.timeLabel}>End Time</Text>
            <TouchableOpacity 
              style={styles.timeInput}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text>{formatTime(form.end_time)}</Text>
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

          <TextInput
            placeholder="Additional notes (optional)"
            style={styles.input}
            value={form.notes}
            onChangeText={(text) => setForm({ ...form, notes: text })}
            multiline
          />

          <TouchableOpacity 
            style={[styles.button, editingId ? styles.updateButton : styles.createButton]} 
            onPress={handleSave}
          >
            <Text style={styles.buttonText}>
              {editingId ? 'Update Availability' : 'Create Availability'}
            </Text>
          </TouchableOpacity>

          {editingId && (
            <TouchableOpacity 
              style={styles.cancelButton}
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
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Your Scheduled Availability</Text>

        {availabilities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#CBD5E0" />
            <Text style={styles.emptyStateText}>No availability slots added yet</Text>
          </View>
        ) : (
          <FlatList
            data={availabilities}
            scrollEnabled={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>{item.date}</Text>
                  <Text style={styles.cardTime}>
                    {item.start_time} - {item.end_time}
                  </Text>
                </View>
                {item.notes && (
                  <Text style={styles.cardNotes}>{item.notes}</Text>
                )}
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => handleEdit(item)}
                  >
                    <Ionicons name="create-outline" size={18} color="#4E8CFF" />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => handleDelete(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'white',
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
    paddingBottom: 80,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  dateInputText: {
    fontSize: 16,
    color: '#1E293B',
  },
  calendarContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  timePickerContainer: {
    marginBottom: 16,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyStateText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  cardTime: {
    fontSize: 14,
    color: '#4E8CFF',
    fontWeight: '500',
  },
  cardNotes: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  actionText: {
    marginLeft: 4,
    color: '#4E8CFF',
    fontWeight: '500',
  },
});