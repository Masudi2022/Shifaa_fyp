// ChatDemo.jsx
import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, TouchableWithoutFeedback, Keyboard,
  ActivityIndicator, Alert, ScrollView, Animated, Easing
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { BASE_URL } from '@env';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconFeather from 'react-native-vector-icons/Feather';
import { Card } from 'react-native-paper';

const PRIMARY_COLOR = '#4E8CFF';
const SECONDARY_COLOR = '#6c757d';
const SUCCESS_COLOR = '#28a745';
const DANGER_COLOR = '#dc3545';
const WARNING_COLOR = '#ffc107';

const ChatDemo = () => {
  const { refreshAccessToken, user } = useContext(AuthContext);
  const navigation = useNavigation();

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [possibleDiseases, setPossibleDiseases] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [isFinalDiagnosis, setIsFinalDiagnosis] = useState(false);
  const [answerCount, setAnswerCount] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(100));
  const [isMounted, setIsMounted] = useState(true);
  const deviceId = 'my-device-id-123';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      setIsMounted(false);
    };
  }, []);

  const startNewSession = async () => {
    if (!isMounted) return;
    try {
      setIsLoading(true);
      setIsFinalDiagnosis(false);
      setPossibleDiseases([]);
      setSymptoms([]);
      setAnswerCount(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(100);

      const token = await AsyncStorage.getItem('access_token') || await refreshAccessToken();
      if (!token) throw new Error('Authentication token not available');

      const res = await axios.post(
        `${BASE_URL}/sessions/create/`,
        { device_id: deviceId, first_message: 'Mazungumzo mapya' },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );

      if (!isMounted) return;
      setSessionId(res.data.session_id);
      setCurrentQuestion(res.data.topic || 'Swali la kwanza litakuja hapa...');
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.exp), useNativeDriver: true }),
        ]).start();
      });
    } catch (err) {
      if (!isMounted) return;
      let errorMessage = 'Failed to start a new session';
      if (err.response) errorMessage = err.response.data?.message || errorMessage;
      else if (err.request) errorMessage = 'Network error - could not reach server';
      Alert.alert('❌ Error', errorMessage);
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  const handleSend = async (messageOverride = null) => {
    if (!isMounted) return;
    const finalMessage = messageOverride || newMessage;
    if (!finalMessage.trim() || !sessionId) return;

    try {
      setIsLoading(true);
      await new Promise(resolve => {
        if (!isMounted) return resolve();
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
        ]).start(resolve);
      });

      const token = await AsyncStorage.getItem('access_token') || await refreshAccessToken();
      const email = user?.email || (await AsyncStorage.getItem('user_email'));
      if (!email) {
        Alert.alert('Error', 'User email is missing. Please log in again.');
        return;
      }

      const res = await axios.post(
        `${BASE_URL}/smart-doctor/chat/`,
        { message: finalMessage, device_id: deviceId, user_email: email, session_id: sessionId },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );

      if (!isMounted) return;
      if (res.data) {
        setCurrentQuestion(res.data.response);
        setSymptoms(res.data.symptoms || []);
        if (res.data.possible_diseases?.length > 0) {
          setPossibleDiseases(res.data.possible_diseases);
          setIsFinalDiagnosis(true);
        }
      } else {
        setCurrentQuestion('Hakuna swali lingine.');
      }

      setNewMessage('');
      setAnswerCount(prev => prev + 1);

      fadeAnim.setValue(0);
      slideAnim.setValue(100);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.exp), useNativeDriver: true }),
        ]).start();
      });
    } catch (err) {
      if (!isMounted) return;
      let errorMessage = 'Failed to send message';
      if (err.response) errorMessage = err.response.data?.message || errorMessage;
      else if (err.request) errorMessage = 'Network error - could not reach server';
      Alert.alert('❌ Error', errorMessage);
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleString(); // simpler — change as needed
  };

  // --- New: build HTML for PDF
  const buildReportHTML = (reportData) => {
    const symptomsHtml = Array.isArray(reportData.symptoms) && reportData.symptoms.length
      ? reportData.symptoms.map(s => `<li>${s}</li>`).join('')
      : '<li>Hakuna dalili</li>';

    const possibleHtml = Array.isArray(reportData.possibleDiseases) && reportData.possibleDiseases.length
      ? reportData.possibleDiseases.map(d => `<li><strong>${d.disease}</strong><br/>${d.treatment ? 'Tiba: ' + d.treatment + '<br/>' : ''}${d.advice ? 'Ushauri: ' + d.advice : ''}</li>`).join('')
      : '<li>Hakuna</li>';

    // Minimal, clean HTML — you can style further
    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #333; }
            h1 { color: ${PRIMARY_COLOR}; text-align:center; }
            .section { margin-bottom: 18px; }
            .section h2 { color: ${PRIMARY_COLOR}; font-size: 16px; margin-bottom: 6px; }
            ul { margin: 0; padding-left: 18px; }
            .meta { font-size: 12px; color: #666; margin-bottom: 6px; text-align:center; }
            .disease { background: #f8f9fa; padding: 10px; border-radius: 6px; margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <h1>Ripoti kutokana na uchunguzi</h1>
          <div class="meta">Generated: ${formatDate()}</div>

          <div class="section">
            <h2>Patient Information</h2>
            <div>Name: ${reportData.user_name || 'Not Provided'}</div>
            <div>Email: ${reportData.user_email || 'Not Provided'}</div>
          </div>

          <div class="section">
            <h2>Reported Symptoms</h2>
            <ul>${symptomsHtml}</ul>
          </div>

          <div class="section">
            <h2>Diagnosis Summary</h2>
            <div>${reportData.summary || '—'}</div>
          </div>

          <div class="section">
            <h2>Possible Conditions</h2>
            ${possibleHtml}
          </div>

          <div style="margin-top:30px; font-size:12px; color:#666;">
            <div>This report is generated by Smart Doctor AI Assistant</div>
            <div>Note: This is not a substitute for professional medical advice</div>
          </div>
        </body>
      </html>
    `;
  };

  // --- New: create PDF and upload
  const handleSaveReport = async () => {
    if (!isFinalDiagnosis) {
      Alert.alert('Info', 'No final diagnosis to save.');
      return;
    }

    try {
      setIsLoading(true);

      const token = await AsyncStorage.getItem('access_token') || await refreshAccessToken();
      if (!token) throw new Error('Authentication token not available');

      const reportData = {
        user_name: user?.name || '',
        user_email: user?.email || (await AsyncStorage.getItem('user_email')) || '',
        session_id: sessionId,
        symptoms,
        possibleDiseases,
        summary: currentQuestion,
      };

      const html = buildReportHTML(reportData);

      // create PDF (expo-print)
      const { uri: pdfUri } = await Print.printToFileAsync({ html });
      // pdfUri is something like file:///.../ExpoPrint/xxxx.pdf

      // read file info if needed
      const fileInfo = await FileSystem.getInfoAsync(pdfUri);
      if (!fileInfo.exists) throw new Error('PDF was not created');

      // Build FormData
      const formData = new FormData();
      // Attach pdf file
      formData.append('pdf', {
        uri: pdfUri,
        name: `report_${Date.now()}.pdf`,
        type: 'application/pdf',
      });
      // Attach metadata fields
      formData.append('session_id', String(sessionId || ''));
      formData.append('user_email', reportData.user_email);
      formData.append('user_name', reportData.user_name);
      formData.append('summary', reportData.summary || '');
      formData.append('symptoms', JSON.stringify(reportData.symptoms || []));
      formData.append('possible_diseases', JSON.stringify(reportData.possibleDiseases || []));

      // Upload to backend
      const uploadRes = await fetch(`${BASE_URL}/reports/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // DO NOT set Content-Type — let fetch set boundary for multipart
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`Upload failed: ${uploadRes.status} ${errText}`);
      }

      const data = await uploadRes.json();
      Alert.alert('Success', 'Report saved successfully.');
      // optional: navigate or set state
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to save report');
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  if (isLoading && !sessionId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={{ marginTop: 20 }}>Starting session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!sessionId) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.centerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Icon name="medical-services" size={30} color={PRIMARY_COLOR} />
                <Text style={styles.cardTitle}>Smart Doctor Assistant</Text>
              </View>
              <Text style={styles.cardText}>
                Get personalized medical advice and possible diagnoses based on your symptoms.
              </Text>
            </Card.Content>
          </Card>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: SUCCESS_COLOR }]}
            onPress={() => navigation.navigate('ReportScreen')}
          >
            <IconFeather name="file-text" size={20} color="#fff" />
            <Text style={styles.actionButtonText}> Get Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]}
            onPress={startNewSession}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="chat" size={20} color="#fff" />
                <Text style={styles.actionButtonText}> Start New Session</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (isFinalDiagnosis) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.reportContainer}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>Ripoti kutokana na uchunguzi</Text>
            <Text style={styles.reportDate}>{formatDate()}</Text>
          </View>

          <Card style={styles.reportSection}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Icon name="person" size={24} color={PRIMARY_COLOR} />
                <Text style={styles.sectionTitle}>Patient Information</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{user?.name || 'Not Provided'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{user?.email || 'Not Provided'}</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.reportSection}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Icon name="warning" size={24} color={WARNING_COLOR} />
                <Text style={styles.sectionTitle}>Reported Symptoms</Text>
              </View>
              <View style={styles.symptomsContainer}>
                {Array.isArray(symptoms) && symptoms.map((symptom, index) => (
                  <View key={index} style={styles.symptomItem}>
                    <Icon name="fiber-manual-record" size={12} color={PRIMARY_COLOR} />
                    <Text style={styles.symptomText}>{symptom}</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.reportSection}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Icon name="healing" size={24} color={DANGER_COLOR} />
                <Text style={styles.sectionTitle}>Diagnosis Summary</Text>
              </View>
              <Text style={styles.summaryText}>{currentQuestion}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.reportSection}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Icon name="coronavirus" size={24} color={DANGER_COLOR} />
                <Text style={styles.sectionTitle}>Possible Conditions</Text>
              </View>

              {possibleDiseases.map((disease, index) => (
                <View key={index} style={styles.diseaseCard}>
                  <Text style={styles.diseaseName}>{disease.disease}</Text>

                  {disease.symptoms && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailTitle}>Associated Symptoms:</Text>
                      <Text style={styles.detailValue}>
                        {Array.isArray(disease.symptoms) ? disease.symptoms.join(', ') : String(disease.symptoms || '')}
                      </Text>
                    </View>
                  )}

                  {disease.tests && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailTitle}>Recommended Tests:</Text>
                      <Text style={styles.detailValue}>
                        {Array.isArray(disease.tests) ? disease.tests.join(', ') : String(disease.tests || '')}
                      </Text>
                    </View>
                  )}

                  {disease.treatment && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailTitle}>Treatment Options:</Text>
                      <Text style={styles.detailValue}>{disease.treatment}</Text>
                    </View>
                  )}

                  {disease.prevention && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailTitle}>Prevention Strategies:</Text>
                      <Text style={styles.detailValue}>{disease.prevention}</Text>
                    </View>
                  )}

                  {disease.advice && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailTitle}>Medical Advice:</Text>
                      <Text style={styles.detailValue}>{disease.advice}</Text>
                    </View>
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>

          <Card style={styles.reportSection}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Icon name="lightbulb-outline" size={24} color={SUCCESS_COLOR} />
                <Text style={styles.sectionTitle}>Recommendations</Text>
              </View>
              <View style={styles.recommendationItem}>
                <Icon name="check-circle" size={18} color={SUCCESS_COLOR} />
                <Text style={styles.recommendationText}>Consult with a healthcare professional for confirmation</Text>
              </View>
              <View style={styles.recommendationItem}>
                <Icon name="check-circle" size={18} color={SUCCESS_COLOR} />
                <Text style={styles.recommendationText}>Follow up if symptoms persist or worsen</Text>
              </View>
              <View style={styles.recommendationItem}>
                <Icon name="check-circle" size={18} color={SUCCESS_COLOR} />
                <Text style={styles.recommendationText}>Maintain a healthy lifestyle and diet</Text>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.reportFooter}>
            <Text style={styles.footerText}>This report is generated by Smart Doctor AI Assistant</Text>
            <Text style={styles.footerNote}>Note: This is not a substitute for professional medical advice</Text>
          </View>

          <View style={styles.reportActions}>
            <TouchableOpacity
              style={[styles.reportButton, { backgroundColor: PRIMARY_COLOR }]}
              onPress={() => {
                setSessionId(null);
                setIsFinalDiagnosis(false);
              }}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.reportButtonText}> New Diagnosis</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reportButton, { backgroundColor: SUCCESS_COLOR }]}
              onPress={handleSaveReport}
            >
              <IconFeather name="download" size={20} color="#fff" />
              <Text style={styles.reportButtonText}> Save Report</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ... rest unchanged: chat UI
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.chatContainer}>
            {isLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              </View>
            ) : (
              <Animated.View style={[styles.chatContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <Card style={[styles.messageCard, styles.botMessage]}>
                  <Card.Content>
                    <View style={styles.messageHeader}>
                      <Icon name="android" size={20} color={PRIMARY_COLOR} />
                      <Text style={styles.messageTitle}> Smart Doctor</Text>
                    </View>
                    <Text style={styles.questionText}>{currentQuestion}</Text>
                  </Card.Content>
                </Card>

                {answerCount < 2 ? (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={newMessage}
                      onChangeText={setNewMessage}
                      placeholder="Type your answer..."
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={() => handleSend()}
                      disabled={isLoading}
                    >
                      <Icon name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.choiceButton, { backgroundColor: SUCCESS_COLOR }]}
                      onPress={() => handleSend('ndio')}
                    >
                      <Icon name="check" size={20} color="#fff" />
                      <Text style={styles.choiceButtonText}> Ndiyo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.choiceButton, { backgroundColor: DANGER_COLOR }]}
                      onPress={() => handleSend('hapana')}
                    >
                      <Icon name="close" size={20} color="#fff" />
                      <Text style={styles.choiceButtonText}> Hapana</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.choiceButton, { backgroundColor: WARNING_COLOR }]}
                      onPress={() => navigation.navigate('UnknownSymptom', { symptom: currentQuestion })}
                    >
                      <Icon name="help" size={20} color="#fff" />
                      <Text style={styles.choiceButtonText}> Sijui</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    width: '90%',
    borderRadius: 12,
    marginBottom: 30,
    elevation: 4,
    backgroundColor: '#fff'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 10,
    width: '80%',
    elevation: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  chatContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16
  },
  chatContent: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  messageCard: {
    width: '85%',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
    backgroundColor: '#fff'
  },
  botMessage: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: PRIMARY_COLOR
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PRIMARY_COLOR
  },
  cardText: {
    fontSize: 16,
    color: SECONDARY_COLOR,
    lineHeight: 24
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    elevation: 2
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333'
  },
  sendButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 20,
    padding: 8,
    marginLeft: 8
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    flexWrap: 'wrap'
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 25,
    marginVertical: 6,
    elevation: 2,
    width: '48%',
  },
  choiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },

  // Report Styles
  reportContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa'
  },
  reportHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY_COLOR
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginBottom: 5
  },
  reportDate: {
    fontSize: 14,
    color: SECONDARY_COLOR
  },
  reportSection: {
    marginBottom: 20,
    borderRadius: 10,
    elevation: 3
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333'
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10
  },
  infoLabel: {
    fontWeight: '600',
    width: 80,
    color: SECONDARY_COLOR
  },
  infoValue: {
    flex: 1,
    color: '#333'
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f2ff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8
  },
  symptomText: {
    marginLeft: 5,
    color: PRIMARY_COLOR
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333'
  },
  diseaseCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: DANGER_COLOR
  },
  diseaseName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
    color: DANGER_COLOR
  },
  detailSection: {
    marginBottom: 10
  },
  detailTitle: {
    fontWeight: '600',
    color: SECONDARY_COLOR,
    marginBottom: 3
  },
  detailValue: {
    color: '#333',
    lineHeight: 20
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  recommendationText: {
    marginLeft: 10,
    flex: 1,
    color: '#333',
    lineHeight: 20
  },
  reportFooter: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center'
  },
  footerText: {
    fontWeight: '600',
    color: SECONDARY_COLOR
  },
  footerNote: {
    marginTop: 5,
    fontStyle: 'italic',
    color: SECONDARY_COLOR,
    textAlign: 'center'
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '48%',
    elevation: 2
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ChatDemo;
