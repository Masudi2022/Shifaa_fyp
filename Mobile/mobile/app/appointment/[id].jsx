import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Image,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const VOICE_NOTE_WIDTH = 250;
const EMPTY_STATE_IMAGE_URL = 'https://cdn-icons-png.flaticon.com/512/4110/4110575.png';

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [appointment, setAppointment] = useState(null);
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [progress, setProgress] = useState({});
  const [durations, setDurations] = useState({});

  useEffect(() => {
    fetchAppointment();
    fetchVoiceNotes();
  }, [id]);

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

  const fetchVoiceNotes = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`${BASE_URL}/api/voice-notes/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setVoiceNotes(data);

      // Preload durations
      data.forEach(async (note) => {
        const { sound } = await Audio.Sound.createAsync({ uri: note.audio_file });
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setDurations((prev) => ({
            ...prev,
            [note.id]: (status.durationMillis / 1000).toFixed(1),
          }));
        }
        await sound.unloadAsync();
      });
    } catch (error) {
      console.error('Error fetching voice notes:', error);
    }
  };

  const startRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission to record voice notes.');
        return;
      }
      await Audio.setAudioModeAsync({ 
        allowsRecordingIOS: true, 
        playsInSilentModeIOS: true 
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Recording Error', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      sendVoiceNote(uri);
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  };

  const sendVoiceNote = async (uri) => {
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('audio_file', {
        uri,
        type: 'audio/m4a',
        name: `voice-${Date.now()}.m4a`,
      });

      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Authentication Required', 'Please sign in to send voice notes.');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/voice-notes/send/${id}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        fetchVoiceNotes();
      } else {
        const errorData = await response.json();
        Alert.alert('Upload Failed', errorData?.detail || 'Failed to send voice note. Please try again.');
      }
    } catch (error) {
      console.error('Error sending voice note:', error);
      Alert.alert('Network Error', 'Could not connect to the server. Please check your connection.');
    } finally {
      setIsSending(false);
    }
  };

  const playAudio = async (note) => {
    try {
      Haptics.selectionAsync();
      setPlayingId(note.id);
      const { sound } = await Audio.Sound.createAsync({ uri: note.audio_file });

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.durationMillis) {
          setProgress((prev) => ({
            ...prev,
            [note.id]: status.positionMillis / status.durationMillis,
          }));
        }
        if (status.didJustFinish) {
          setPlayingId(null);
          setProgress((prev) => ({ ...prev, [note.id]: 0 }));
        }
      });

      await sound.playAsync();
    } catch (error) {
      console.error('Error playing audio', error);
      Alert.alert('Playback Error', 'Could not play this voice note.');
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      
      {/* Header with appointment info */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Appointment Details</Text>
          {appointment && (
            <Text style={styles.headerSubtitle}>
              {formatDateTime(appointment.created_at)}
            </Text>
          )}
        </View>
      </View>

      {/* Main content */}
      <View style={styles.container}>
        {/* Appointment info card */}
        {appointment && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={20} color="#4F46E5" />
              <Text style={styles.infoText}>
                <Text style={styles.labelText}>Patient: </Text>
                {appointment.user_name}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="medical-services" size={18} color="#4F46E5" />
              <Text style={styles.infoText}>
                <Text style={styles.labelText}>Doctor: </Text>
                {appointment.doctor_name}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="calendar-today" size={18} color="#4F46E5" />
              <Text style={styles.infoText}>
                <Text style={styles.labelText}>Date: </Text>
                {new Date(appointment.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="access-time" size={18} color="#4F46E5" />
              <Text style={styles.infoText}>
                <Text style={styles.labelText}>Time: </Text>
                {appointment.time}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="info" size={18} color="#4F46E5" />
              <Text style={styles.infoText}>
                <Text style={styles.labelText}>Reason: </Text>
                {appointment.reason || 'No reason provided'}
              </Text>
            </View>
          </View>
        )}

        {/* Voice notes section */}
        <Text style={styles.sectionTitle}>Voice Notes</Text>
        
        {voiceNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Image 
              source={{ uri: EMPTY_STATE_IMAGE_URL }} 
              style={styles.emptyImage}
            />
            <Text style={styles.emptyText}>No voice notes yet</Text>
            <Text style={styles.emptySubtext}>Tap the microphone to record</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.notesContainer}
            showsVerticalScrollIndicator={false}
          >
            {voiceNotes.map((note) => {
              const isSender = note.sender_email === user?.email;
              const displayName = isSender ? 'You' : note.sender_name;
              
              return (
                <View
                  key={note.id}
                  style={[
                    styles.noteContainer,
                    isSender ? styles.senderNote : styles.receiverNote
                  ]}
                >
                  <Text style={[
                    styles.senderName,
                    isSender ? styles.senderNameYou : styles.senderNameOther
                  ]}>
                    {displayName}
                  </Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.voiceNote,
                      isSender ? styles.senderVoiceNote : styles.receiverVoiceNote
                    ]}
                    onPress={() => playAudio(note)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.playButton}>
                      {playingId === note.id ? (
                        <Ionicons name="pause" size={16} color="white" />
                      ) : (
                        <Ionicons name="play" size={16} color="white" />
                      )}
                    </View>
                    
                    <View style={styles.noteContent}>
                      <View style={styles.progressBarBackground}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${(progress[note.id] || 0) * 100}%`,
                              backgroundColor: isSender ? '#4F46E5' : '#6B7280',
                            }
                          ]}
                        />
                      </View>
                      
                      <Text style={styles.durationText}>
                        {durations[note.id] ? `${durations[note.id]}s` : '...'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  <Text style={styles.timestamp}>
                    {formatDateTime(note.timestamp)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Floating microphone button */}
      <TouchableOpacity
        style={[
          styles.micButton,
          isRecording && styles.recordingButton,
          isSending && styles.sendingButton
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isSending}
        activeOpacity={0.7}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons 
            name={isRecording ? 'stop' : 'mic'} 
            size={24} 
            color="white" 
          />
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB'
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: StatusBar.currentHeight + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  backButton: {
    marginRight: 12,
    padding: 4
  },
  headerContent: {
    flex: 1
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2
  },
  headerSubtitle: {
    color: '#E0E7FF',
    fontSize: 14
  },
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 20
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  labelText: {
    fontWeight: '600',
    color: '#4B5563'
  },
  infoText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#374151'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    marginTop: 8
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: 16,
    opacity: 0.7
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF'
  },
  notesContainer: {
    paddingBottom: 80
  },
  noteContainer: {
    marginBottom: 20,
    maxWidth: '85%'
  },
  senderNote: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end'
  },
  receiverNote: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start'
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6
  },
  senderNameYou: {
    color: '#4F46E5'
  },
  senderNameOther: {
    color: '#111827'
  },
  voiceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: VOICE_NOTE_WIDTH
  },
  senderVoiceNote: {
    backgroundColor: '#E0E7FF',
    borderTopRightRadius: 4
  },
  receiverVoiceNote: {
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 4
  },
  playButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  noteContent: {
    flex: 1
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2
  },
  durationText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500'
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    marginLeft: 8
  },
  micButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  recordingButton: {
    backgroundColor: '#DC2626'
  },
  sendingButton: {
    backgroundColor: '#7C3AED'
  }
});