// shifaa.jsx (updated with backend advice integration — bot response is blue)
import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet,
  TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, TouchableWithoutFeedback, Keyboard,
  ActivityIndicator, ScrollView, Animated, Easing,
  FlatList
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { BASE_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconFeather from 'react-native-vector-icons/Feather';
import { Card } from 'react-native-paper';
import { useRouter } from 'expo-router';

// ---------- CONFIG ----------
const PRIMARY_COLOR = '#4E8CFF';
const SECONDARY_COLOR = '#6c757d';
const SUCCESS_COLOR = '#28a745';
const DANGER_COLOR = '#dc3545';
const WARNING_COLOR = '#ffc107';
const router = useRouter();

// How much vertical space the bottom diagnosis area should take.
const REPORT_BOTTOM_FLEX = 0.8;
// ----------------------------

const ALL_SYMPTOMS = [ /* ... keep same symptom array ... */ 'homa','homa_kali','baridi','maumivu ya kichwa','maumivu ya misuli','maumivu_ya_viungo','upele','macho_kuwasha_na_wekundu','kikohozi','kikohozi_kisichoisha','kupumua_kwa_shida','maumivu_ya_kifua','kutokwa_na_jasho_usiku','kupungua_uzito','kukosa_hamu_ya_kula','maumivu_ya_tumbo','kuhara_kwa_maji_mengi','kuhara_kunaodamu','kutapika','kichefuchefu','upungufu_wa_maji_mwilini','manjano_ya_macho_na_mwili','mkojo_mweusi','mara_nyingi_kwenda_choo_kidogo','maumivu_wakati_wa_kukojoa','maumivu_ya_ubavu','uchafu_kutoka_sehemu_za_siri','kidonda_kisicho_na_maumivu','uvimbe_wa_tezi','shingo_kuganda','kuogopa_mwangaza','degedege','mkojo_unaodamu','michubuko_ya_mwili','muwasho_sehemu_za_siri','kutokwa_na_damu_kiraisi','upungufu_wa_damu','kuvimbiwa_au_kuhara','kuhara','ugonjwa' ];

const ChatDemo = () => {
  const { refreshAccessToken, user } = useContext(AuthContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // chat state
  const [currentQuestion, setCurrentQuestion] = useState('Tafadhali taja dalili mbili kwanza (mf. homa, kikohozi)...');
  const [newMessage, setNewMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // possibleDiseases will hold enriched predictions (with advice) if backend provides it
  const [possibleDiseases, setPossibleDiseases] = useState([]);
  const [topAdvice, setTopAdvice] = useState(null); // object or null
  const [symptoms, setSymptoms] = useState([]);
  const [isFinalDiagnosis, setIsFinalDiagnosis] = useState(false);
  const [answerCount, setAnswerCount] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(100));
  const [isMounted, setIsMounted] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const deviceId = 'my-device-id-123';

  // UI: modal & notification
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState('info'); // 'success' | 'error' | 'info'
  const notifAnim = useRef(new Animated.Value(-120)).current; // slide from top

  useEffect(() => {
    if (notifVisible) {
      Animated.timing(notifAnim, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.cubic) }).start();
      const t = setTimeout(() => hideNotification(), 3000);
      return () => clearTimeout(t);
    } else {
      Animated.timing(notifAnim, { toValue: -120, duration: 240, useNativeDriver: true }).start();
    }
  }, [notifVisible]);

  // small helpers to show modal / notification
  const showErrorModal = (title, message) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const showNotification = (message, type = 'info') => {
    setNotifMessage(message);
    setNotifType(type);
    setNotifVisible(true);
  };

  const hideNotification = () => {
    setNotifVisible(false);
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.exp), useNativeDriver: true }),
    ]).start();
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (newMessage.trim().length > 1) {
      const filtered = ALL_SYMPTOMS.filter(symptom =>
        symptom.replace(/_/g, ' ').toLowerCase().includes(newMessage.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [newMessage]);

  const addDebugEntry = (entry) => setDebugLog(prev => [entry, ...prev].slice(0, 50));
  const updateDebugEntry = (id, patch) => setDebugLog(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));

  // validate same as before
  const validateHealthInput = (input) => {
    if (!input || !input.trim()) return false;
    const hasHealthTerm = ALL_SYMPTOMS.some(symptom =>
      input.toLowerCase().includes(symptom.replace(/_/g, ' ').toLowerCase())
    );
    const healthKeywords = ['umwa', 'maumivu', 'dalili', 'mgonjwa', 'tiba', 'dawa', 'hospitali', 'daktari', 'chanjo', 'ugonjwa', 'kuhisi'];
    const hasHealthKeyword = healthKeywords.some(keyword => input.toLowerCase().includes(keyword));
    return hasHealthTerm || hasHealthKeyword;
  };

  // startNewSession
  const startNewSession = async () => {
    if (!isMounted) return;
    try {
      setIsLoading(true);
      setIsFinalDiagnosis(false);
      setPossibleDiseases([]);
      setTopAdvice(null);
      setSymptoms([]);
      setAnswerCount(0);
      setNewMessage('');
      setCurrentQuestion('Tafadhali taja dalili mbili kwanza (mf. homa, kikohozi)...');

      const token = await AsyncStorage.getItem('access_token') || await refreshAccessToken();
      if (!token) throw new Error('Authentication token not available');

      const res = await axios.post(`${BASE_URL}/sessions/create/`, { device_id: deviceId, first_message: 'Mazungumzo mapya' }, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 });
      if (!isMounted) return;
      const sid = res.data?.session_id;
      setSessionId(sid);
      const starter = res.data?.response || res.data?.topic || 'Taja dalili mbili kwanza.';
      setCurrentQuestion(starter);
    } catch (err) {
      const errorMessage = err.response?.data?.message || (err.request ? 'Taarifa ya mtandao imekosekana. Angalia mtandao wako.' : 'Imeshindikana kuanza kikao.');
      showErrorModal('Samahani, haikuweza kuanza kikao', `Daktari AI: ${errorMessage}\n\nJaribu tena au angalia muunganisho wako wa intaneti.`);
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  // main send handler (updated to process advice from backend)
  const handleSend = async (messageOverride = null, meta = null) => {
    if (!isMounted) return;
    const finalMessage = (messageOverride !== null) ? messageOverride : newMessage;
    if (!finalMessage || !finalMessage.toString().trim() || !sessionId) {
      showErrorModal('Kosa la Ingizo', 'Tafadhali ingiza dalili kabla ya kutuma.');
      return;
    }

    if (messageOverride === null && answerCount < 2 && !validateHealthInput(finalMessage)) {
      showErrorModal('Dalili Zisizo Sahihi', 'Tafadhali taja dalili za kiafya (mfano: homa, kikohozi). Ikiwa huna dalili,andika "sina dalili".');
      return;
    }

    let logId = `req_${Date.now()}`;
    try {
      setIsLoading(true);
      setShowSuggestions(false);

      await new Promise(resolve => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
        ]).start(resolve);
      });

      const token = await AsyncStorage.getItem('access_token') || await refreshAccessToken();
      const email = user?.email || (await AsyncStorage.getItem('user_email'));
      if (!email) {
        showErrorModal('Taarifa Haipo', 'Barua pepe ya mtumiaji haipatikani. Tafadhali ingia tena.');
        return;
      }

      const payload = { message: finalMessage, device_id: deviceId, user_email: email, session_id: sessionId };
      if (meta && meta.selected_symptom) {
        payload.message = meta.selected_symptom;
        payload.symptoms = [meta.selected_symptom];
        payload.only_selected = true;
      }

      addDebugEntry({ id: logId, time: new Date().toISOString(), url: `${BASE_URL}/smart-doctor/chat/`, payload, status: 'pending', response: null, error: null });

      const res = await axios.post(`${BASE_URL}/smart-doctor/chat/`, payload, { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 });
      updateDebugEntry(logId, { status: 'ok', response: res.data, error: null });

      if (!isMounted) return;
      const data = res.data || {};
      const hasNext = Boolean(data.next_question);
      // prefer enriched predictions (with advice) from backend if provided
      const enriched = Array.isArray(data.enriched_predictions) && data.enriched_predictions.length ? data.enriched_predictions : (Array.isArray(data.possible_diseases) ? data.possible_diseases : []);

      if (data.response && !hasNext) setCurrentQuestion(data.response);

      if (hasNext) {
        setIsFinalDiagnosis(false);
        setPossibleDiseases(enriched || []);
        setTopAdvice(data.top_advice || null);
        setCurrentQuestion(`Je, una dalili ya '${data.next_question.replace(/_/g, ' ')}'? (ndio/hapana)`);
      } else if (enriched && enriched.length > 0) {
        // final diagnosis stage: enriched predictions (each may contain .advice)
        setPossibleDiseases(enriched);
        setTopAdvice(data.top_advice || (enriched[0] && enriched[0].advice ? enriched[0].advice : null));
        setIsFinalDiagnosis(true);
        if (data.response) setCurrentQuestion(data.response);
        showNotification('Uchunguzi umekamilika. Angalia ripoti hapa chini.', 'info');
      } else {
        setPossibleDiseases([]);
        setTopAdvice(null);
        setIsFinalDiagnosis(false);
        if (data.response) setCurrentQuestion(data.response);
      }

      if (Array.isArray(data.symptoms)) setSymptoms(data.symptoms);
      setAnswerCount(prev => Math.min(prev + 1, 1000));
      if (meta && meta.selected_symptom) setNewMessage('');
      else if (messageOverride === null) setNewMessage('');
    } catch (err) {
      updateDebugEntry(logId, { status: 'error', response: null, error: (err.response?.data || err.message || 'Network error') });
      const msg = err.response?.data?.message || (err.request ? 'Mtandao haupatikani' : err.message || 'Kosa la seva');
      showErrorModal('Hakuna Muunganisho / Server', `Daktari AI: ${msg}\n\nTafadhali jaribu tena baada ya sekunde chache.`);
    } finally {
      if (isMounted) setIsLoading(false);
      fadeAnim.setValue(0);
      slideAnim.setValue(100);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.exp), useNativeDriver: true }),
        ]).start();
      });
    }
  };

  const handleSuggestionSelect = (symptom) => {
    const token = symptom.replace(/\s+/g, '_').replace(/__+/g, '_').trim();
    const label = token.replace(/_/g, ' ');
    Keyboard.dismiss();
    setShowSuggestions(false);
    setNewMessage(label);
    showErrorModal('Tuma dalili?', `Unataka kutuma dalili: "${label}"?\nGonga "Sawa" ili kuendelea.`, );
    // If you want "Sawa" to auto-send the selected symptom, add a callback on the modal "Sawa" button (not implemented here).
  };

  // render suggestion item
  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity style={styles.suggestionItem} onPress={() => {
      const token = item.replace(/\s+/g,'_').replace(/__+/g,'_').trim();
      showNotification(`Kutuma: ${item.replace(/_/g,' ')}`, 'info');
      handleSend(token, { selected_symptom: token });
    }}>
      <Text style={styles.suggestionText}>{item.replace(/_/g, ' ')}</Text>
    </TouchableOpacity>
  );

  // helper to render advice object as readable text in report HTML and UI
  const adviceObjectToHtml = (adv) => {
    if (!adv) return '';
    if (typeof adv === 'string') return `<div>${adv}</div>`;
    // adv is object
    const lines = [];
    if (adv.maelezo_fupi) lines.push(`<div><strong>Maelezo:</strong> ${adv.maelezo_fupi}</div>`);
    if (adv.dalili_za_kuangalia && adv.dalili_za_kuangalia.length) lines.push(`<div><strong>Dalili za kuangalia:</strong> ${adv.dalili_za_kuangalia.join('; ')}</div>`);
    if (adv.vipimo && adv.vipimo.length) lines.push(`<div><strong>Vipimo:</strong> ${adv.vipimo.join('; ')}</div>`);
    if (adv.tiba && adv.tiba.length) lines.push(`<div><strong>Tiba:</strong> ${adv.tiba.join('; ')}</div>`);
    if (adv.ushauri_wa_nyumbani && adv.ushauri_wa_nyumbani.length) lines.push(`<div><strong>Ushauri wa nyumbani:</strong> ${adv.ushauri_wa_nyumbani.join('; ')}</div>`);
    return lines.join('');
  };

  // buildReportHTML and handleSaveReport (use showNotification & showErrorModal)
  const buildReportHTML = (reportData) => {
    const symptomsHtml = Array.isArray(reportData.symptoms) && reportData.symptoms.length
      ? reportData.symptoms.map(s => `<li>${s.replace(/_/g, ' ')}</li>`).join('')
      : '<li>Hakuna dalili</li>';

    const possibleHtml = Array.isArray(reportData.possible_diseases) && reportData.possible_diseases.length
      ? reportData.possible_diseases.map(d => {
          const adviceSection = d.advice ? adviceObjectToHtml(d.advice) : '';
          const prob = (typeof d.probability === 'number') ? `${(d.probability * 100).toFixed(0)}%` : (d.probability || '—');
          return `
            <div class="disease">
              <strong>${d.disease}</strong>
              ${prob ? `<div>Uwezekano: ${prob}</div>` : ''}
              ${d.treatment ? `<div>Tiba: ${d.treatment}</div>` : ''}
              ${adviceSection}
            </div>
          `;
        }).join('')
      : '<li>Hakuna</li>';

    // show top advice summary if provided
    const topAdviceHtml = reportData.top_advice ? `<div class="section"><h2>Ushauri wa juu</h2>${adviceObjectToHtml(reportData.top_advice)}</div>` : '';

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
          ${topAdviceHtml}
          <div style="margin-top:30px; font-size:12px; color:#666;">
            <div>This report is generated by Smart Doctor AI Assistant</div>
            <div>Note: This is not a substitute for professional medical advice</div>
          </div>
        </body>
      </html>
    `;
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleSaveReport = async () => {
    if (!isFinalDiagnosis) {
      showErrorModal('Hakuna Ripoti', 'Uchunguzi haujakamilika hivyo hakuna ripoti kuokoa.');
      return;
    }
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('access_token') || await refreshAccessToken();
      if (!token) throw new Error('Authentication token not available');
      const reportData = {
        session_id: sessionId,
        symptoms,
        possible_diseases: possibleDiseases,
        summary: currentQuestion,
        user_name: user?.name || '',
        user_email: user?.email || '',
        top_advice: topAdvice || null,
      };
      const html = buildReportHTML(reportData);
      const { uri: pdfUri } = await Print.printToFileAsync({ html });
      const fileInfo = await FileSystem.getInfoAsync(pdfUri);
      if (!fileInfo.exists) throw new Error('PDF was not created');
      const formData = new FormData();
      formData.append('pdf', { uri: pdfUri, name: `report_${Date.now()}.pdf`, type: 'application/pdf' });
      formData.append('session_id', String(reportData.session_id || ''));
      formData.append('summary', reportData.summary || '');
      formData.append('symptoms', JSON.stringify(reportData.symptoms || []));
      formData.append('possible_diseases', JSON.stringify(reportData.possible_diseases || []));
      // include advice - backend model should have advice JSONField to persist this
      formData.append('advice', JSON.stringify(reportData.top_advice || {}));

      const uploadRes = await fetch(`${BASE_URL}/reports/`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`Upload failed: ${uploadRes.status} ${errText}`);
      }
      await uploadRes.json();
      showNotification('Ripoti imehifadhiwa kwa mafanikio', 'success');
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Kosa wakati wa kutunza ripoti';
      showErrorModal('Hakikisha', `Kosa: ${msg}\nTafadhali jaribu tena.`);
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  // UI render helpers: ErrorModal and NotificationBanner components (in-file)
  const ErrorModal = () => {
    if (!errorModalVisible) return null;
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.avatarCircle}>
              <IconFeather name="user-check" size={24} color="#fff" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.modalTitle}>{errorTitle || 'Ujumbe kutoka kwa Daktari'}</Text>
              <Text style={styles.modalSubtitle}>Smart Doctor AI</Text>
            </View>
            <TouchableOpacity onPress={() => setErrorModalVisible(false)} style={{ padding: 6 }}>
              <Icon name="close" size={22} color={SECONDARY_COLOR} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalText}>{errorMessage}</Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: PRIMARY_COLOR }]} onPress={() => {
              setErrorModalVisible(false);
            }}>
              <Text style={styles.modalButtonText}>Sawa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalButton, { backgroundColor: WARNING_COLOR }]} onPress={() => setErrorModalVisible(false)}>
              <Text style={styles.modalButtonText}>Funga</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const NotificationBanner = () => {
    if (!notifMessage) return null;
    const color = notifType === 'success' ? SUCCESS_COLOR : (notifType === 'error' ? DANGER_COLOR : PRIMARY_COLOR);
    const icon = notifType === 'success' ? 'check-circle' : (notifType === 'error' ? 'error' : 'info');
    return (
      <Animated.View style={[styles.notifWrapper, { transform: [{ translateY: notifAnim }] }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => hideNotification()}>
          <View style={[styles.notifCard, { backgroundColor: color }]}>
            <Icon name={icon} size={18} color="#fff" />
            <Text style={styles.notifText}>{notifMessage}</Text>
            <TouchableOpacity onPress={() => hideNotification()} style={{ marginLeft: 8 }}>
              <Icon name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // UI states
  if (isLoading && !sessionId) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={{ marginTop: 20 }}>Starting session...</Text>
        </View>
        <NotificationBanner />
        <ErrorModal />
      </SafeAreaView>
    );
  }

  if (!sessionId) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom, 12) }}>
          <Animated.View style={[styles.centerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }] }>
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

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: SUCCESS_COLOR }]} onPress={() => navigation.navigate('ReportScreen')}>
              <IconFeather name="file-text" size={20} color="#fff" />
              <Text style={styles.actionButtonText}> Get Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]} onPress={startNewSession} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : (<><Icon name="chat" size={20} color="#fff" /><Text style={styles.actionButtonText}> Start New Session</Text></>)}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
        <NotificationBanner />
        <ErrorModal />
      </SafeAreaView>
    );
  }

  // FINAL DIAGNOSIS / REPORT SCREEN — anchored with insets so system bars don't overlap
  if (isFinalDiagnosis) {
    const topFlex = 1 - REPORT_BOTTOM_FLEX;
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView style={styles.reportContainer} contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom, 12) }} showsVerticalScrollIndicator={false}>
          {/* header + patient info (top area) */}
          <View style={[styles.reportTop, { flex: topFlex }]}>
            <View style={styles.reportHeader}>
              <TouchableOpacity onPress={() => router.push('/shifaa')}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
              <Text style={styles.reportTitle}>Ripoti kutokana na uchunguzi</Text>
              <Text style={styles.reportDate}>{formatDate()}</Text>
            </View>

            <Card style={styles.reportSection}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Icon name="person" size={24} color={PRIMARY_COLOR} />
                  <Text style={styles.sectionTitle}>Taarifa za Mgonjwa</Text>
                </View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Jina:</Text><Text style={styles.infoValue}>{user?.name || 'Not Provided'}</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Email:</Text><Text style={styles.infoValue}>{user?.email || 'Not Provided'}</Text></View>
              </Card.Content>
            </Card>
          </View>

          {/* bottom area - diagnosis anchored near bottom */}
          <View style={[styles.reportBottomWrapper, { flex: REPORT_BOTTOM_FLEX, paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.reportBottom}>
              {/* reported symptoms */}
              <Card style={styles.reportSection}>
                <Card.Content>
                  <View style={styles.sectionHeader}>
                    <Icon name="warning" size={24} color={WARNING_COLOR} />
                    <Text style={styles.sectionTitle}>Dalili Ziliripotiwa</Text>
                  </View>
                  <View style={styles.symptomsContainer}>
                    {Array.isArray(symptoms) && symptoms.length > 0 ? symptoms.map((symptom, idx) => (
                      <View key={idx} style={styles.symptomItem}><Icon name="fiber-manual-record" size={12} color={PRIMARY_COLOR} /><Text style={styles.symptomText}>{String(symptom).replace(/_/g, ' ')}</Text></View>
                    )) : (<Text style={styles.smallText}>Hakuna dalili</Text>)}
                  </View>
                </Card.Content>
              </Card>

              {/* top advice summary (if present) */}
              {topAdvice ? (
                <Card style={styles.reportSection}>
                  <Card.Content>
                    <View style={styles.sectionHeader}>
                      <Icon name="info" size={24} color={PRIMARY_COLOR} />
                      <Text style={styles.sectionTitle}>Ushauri Muhimu (Kwa Utabiri Bora)</Text>
                    </View>
                    {typeof topAdvice === 'string' ? (
                      <Text style={styles.summaryText}>{topAdvice}</Text>
                    ) : (
                      <>
                        {topAdvice.maelezo_fupi ? <Text style={styles.summaryText}>{topAdvice.maelezo_fupi}</Text> : null}
                        {topAdvice.dalili_za_kuangalia ? <Text style={[styles.smallText, { marginTop: 8 }]}>Dalili za kuangalia: {topAdvice.dalili_za_kuangalia.join('; ')}</Text> : null}
                        {topAdvice.vipimo ? <Text style={[styles.smallText, { marginTop: 8 }]}>Vipimo: {topAdvice.vipimo.join('; ')}</Text> : null}
                      </>
                    )}
                  </Card.Content>
                </Card>
              ) : null}

              {/* diagnosis summary */}
              <Card style={styles.reportSection}>
                <Card.Content>
                  <View style={styles.sectionHeader}>
                    <Icon name="healing" size={24} color={DANGER_COLOR} />
                    <Text style={styles.sectionTitle}>Muhtasari wa Uchunguzi</Text>
                  </View>
                  <Text style={styles.summaryText}>{currentQuestion}</Text>
                </Card.Content>
              </Card>

              {/* possible conditions */}
              <Card style={styles.reportSection}>
                <Card.Content>
                  <View style={styles.sectionHeader}>
                    <Icon name="coronavirus" size={24} color={DANGER_COLOR} />
                    <Text style={styles.sectionTitle}>Ugonjwa Unaowezekana</Text>
                  </View>
                  {Array.isArray(possibleDiseases) && possibleDiseases.length > 0 ? possibleDiseases.map((d, i) => (
                    <View key={i} style={styles.diseaseCard}>
                      <Text style={styles.diseaseName}>{d?.disease || '—'}</Text>
                      {d?.probability ? <Text style={styles.detailValue}>Uwezekano: {(d.probability*100).toFixed(0)}%</Text> : null}
                      {/* show advice fields if available */}
                      {d?.advice && typeof d.advice === 'object' ? (
                        <>
                          {d.advice.maelezo_fupi ? <Text style={styles.detailValue}>Maelezo: {d.advice.maelezo_fupi}</Text> : null}
                          {d.advice.tiba ? <Text style={styles.detailValue}>Tiba: {Array.isArray(d.advice.tiba) ? d.advice.tiba.join('; ') : d.advice.tiba}</Text> : null}
                          {d.advice.ushauri_wa_nyumbani ? <Text style={styles.detailValue}>Ushauri: {Array.isArray(d.advice.ushauri_wa_nyumbani) ? d.advice.ushauri_wa_nyumbani.join('; ') : d.advice.ushauri_wa_nyumbani}</Text> : null}
                        </>
                      ) : d?.advice && typeof d.advice === 'string' ? (
                        <Text style={styles.detailValue}>Ushauri: {d.advice}</Text>
                      ) : null}
                    </View>
                  )) : (<Text style={styles.smallText}>Hakuna</Text>)}
                </Card.Content>
              </Card>

              <Card style={styles.reportSection}>
                <Card.Content>
                  <View style={styles.sectionHeader}>
                    <Icon name="lightbulb-outline" size={24} color={SUCCESS_COLOR} />
                    <Text style={styles.sectionTitle}>Mapendekezo</Text>
                  </View>
                  <View style={styles.recommendationItem}><Icon name="check-circle" size={18} color={SUCCESS_COLOR} /><Text style={styles.recommendationText}>Wasiliana na mtaalamu wa afya kwa uhakiki</Text></View>
                  <View style={styles.recommendationItem}><Icon name="check-circle" size={18} color={SUCCESS_COLOR} /><Text style={styles.recommendationText}>Fuata mwongozo ukihisi dalili zinaendelea</Text></View>
                </Card.Content>
              </Card>

              <View style={styles.reportFooter}><Text style={styles.footerText}>Ripoti imeandaliwa Shifaa AI</Text><Text style={styles.footerNote}>Si mbadala wa dhana ya daktari wa kweli</Text></View>

              <View style={styles.reportActions}>
                <TouchableOpacity style={[styles.reportButton, { backgroundColor: PRIMARY_COLOR }]} onPress={() => { setSessionId(null); setIsFinalDiagnosis(false); setAnswerCount(0); setPossibleDiseases([]); setTopAdvice(null); }}>
                  <Icon name="refresh" size={20} color="#fff" /><Text style={styles.reportButtonText}> New Diagnosis</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.reportButton, { backgroundColor: SUCCESS_COLOR }]} onPress={handleSaveReport}>
                  <IconFeather name="download" size={20} color="#fff" /><Text style={styles.reportButtonText}> Save Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
        <NotificationBanner />
        <ErrorModal />
      </SafeAreaView>
    );
  }

  // Chat UI while diagnosing (unchanged except uses showErrorModal / showNotification)
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 10}>
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowSuggestions(false); }}>
          <View style={styles.chatContainer}>
            <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="android" size={20} color={PRIMARY_COLOR} />
                <Text style={[styles.messageTitle, { marginLeft: 8 }]}> Smart Doctor</Text>
              </View>
    
            </View>

            <Animated.View style={[styles.chatContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Card style={[styles.messageCard, styles.botMessage]}>
                <Card.Content><Text style={styles.questionText}>{currentQuestion}</Text></Card.Content>
              </Card>

              {debugVisible && (
                <View style={styles.debugPanel}>
                  <Text style={styles.debugTitle}>Requests (latest first)</Text>
                  {debugLog.length === 0 ? (<Text style={styles.debugEmpty}>No requests yet</Text>) : (
                    <FlatList data={debugLog} keyExtractor={(item) => item.id} renderItem={({ item }) => (
                      <View style={styles.debugItem}>
                        <View style={styles.debugRow}>
                          <Text style={styles.debugTime}>{new Date(item.time).toLocaleTimeString()}</Text>
                          <Text style={[styles.debugStatus, item.status === 'error' ? { color: DANGER_COLOR } : { color: item.status === 'pending' ? WARNING_COLOR : SUCCESS_COLOR }]}>{item.status.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.debugLabel}>URL:</Text><Text style={styles.debugText}>{item.url}</Text>
                        <Text style={styles.debugLabel}>Payload:</Text><Text style={styles.debugText}>{JSON.stringify(item.payload)}</Text>
                        {item.response ? (<><Text style={styles.debugLabel}>Response:</Text><Text style={styles.debugText}>{JSON.stringify(item.response)}</Text></>) : null}
                        {item.error ? (<><Text style={styles.debugLabel}>Error:</Text><Text style={[styles.debugText, { color: DANGER_COLOR }]}>{JSON.stringify(item.error)}</Text></>) : null}
                      </View>
                    )} />
                  )}
                </View>
              )}

              {answerCount < 2 ? (
                <View style={styles.inputContainer}>
                  <TextInput style={styles.input} value={newMessage} onChangeText={setNewMessage} placeholder="Type your symptoms..." placeholderTextColor="#999" returnKeyType="send" onSubmitEditing={() => handleSend()} editable={!isLoading} onFocus={() => newMessage.length > 1 && setShowSuggestions(true)} />
                  <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()} disabled={isLoading}><Icon name="send" size={20} color="#fff" /></TouchableOpacity>
                  {showSuggestions && suggestions.length > 0 && (<View style={styles.suggestionsContainer}><FlatList data={suggestions} renderItem={renderSuggestionItem} keyExtractor={(item) => item} keyboardShouldPersistTaps="always" /></View>)}
                </View>
              ) : (
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={[styles.choiceButton, { backgroundColor: SUCCESS_COLOR }]} onPress={() => handleSend('ndio')} disabled={isLoading}><Icon name="check" size={20} color="#fff" /><Text style={styles.choiceButtonText}> Ndiyo</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.choiceButton, { backgroundColor: DANGER_COLOR }]} onPress={() => handleSend('hapana')} disabled={isLoading}><Icon name="close" size={20} color="#fff" /><Text style={styles.choiceButtonText}> Hapana</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.choiceButton, { backgroundColor: WARNING_COLOR }]} onPress={() => navigation.navigate('UnknownSymptom', { symptom: currentQuestion })} disabled={isLoading}><Icon name="help" size={20} color="#fff" /><Text style={styles.choiceButtonText}> Sijui</Text></TouchableOpacity>
                </View>
              )}

              <View style={styles.stateRow}><Text style={styles.smallText}>Dalili: {symptoms?.length || 0}</Text><Text style={styles.smallText}>Majibu: {answerCount}</Text></View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <NotificationBanner />
      <ErrorModal />
    </SafeAreaView>
  );
};

// ---------- styles (updated bot response color) ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginLeft: 8 },
  cardText: { color: SECONDARY_COLOR },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, marginVertical: 6, width: '90%' },
  actionButtonText: { color: '#fff', fontWeight: '600', marginLeft: 8 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8 },
  messageTitle: { fontWeight: '700', fontSize: 16 },
  debugToggle: { marginRight: 8, backgroundColor: SECONDARY_COLOR, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  debugToggleText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
  refreshButton: { backgroundColor: PRIMARY_COLOR, padding: 8, borderRadius: 8, marginLeft: 8 },

  chatContainer: { flex: 1, padding: 12 },
  chatContent: { flex: 1, justifyContent: 'flex-end', minHeight: '70%' }, // keep bot area lower on screen
  messageCard: { marginBottom: 12, borderRadius: 12 },
  // BOT MESSAGE: now blue background
  botMessage: { backgroundColor: PRIMARY_COLOR, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, elevation: 2 },
  messageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  questionText: { fontSize: 16, lineHeight: 22, color: '#fff' }, // white text for contrast on blue

  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, position: 'relative' },
  input: { flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, paddingRight: 48, backgroundColor: '#fff' },
  sendButton: { position: 'absolute', right: 6, top: 6, backgroundColor: PRIMARY_COLOR, padding: 10, borderRadius: 8 },

  suggestionsContainer: { position: 'absolute', left: 0, right: 0, top: 54, maxHeight: 200, backgroundColor: '#fff', borderRadius: 8, elevation: 6, zIndex: 999, padding: 6 },
  suggestionItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  suggestionText: { fontSize: 14 },

  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  choiceButton: { flex: 1, marginHorizontal: 6, padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  choiceButtonText: { color: '#fff', fontWeight: '700', marginLeft: 8 },

  stateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  smallText: { color: SECONDARY_COLOR, fontSize: 12 },

  

  // REPORT / layout updates
  reportContainer: { flex: 1, paddingHorizontal: 12, backgroundColor: '#fff' },
  reportTop: { justifyContent: 'flex-start' },
  reportHeader: { marginBottom: 12 },
  reportTitle: { fontSize: 20, fontWeight: '700', color: PRIMARY_COLOR },
  reportDate: { color: SECONDARY_COLOR, fontSize: 12 },

  reportBottomWrapper: {
    justifyContent: 'flex-end',
  },

  reportBottom: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingTop: 12,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
  },

  reportSection: { marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontWeight: '700', marginLeft: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  infoLabel: { color: SECONDARY_COLOR },
  infoValue: { fontWeight: '600' },

  symptomsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  symptomItem: { flexDirection: 'row', alignItems: 'center', marginRight: 8, marginBottom: 6 },
  symptomText: { marginLeft: 6 },
  summaryText: { lineHeight: 20 },

  diseaseCard: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 8 },
  diseaseName: { fontWeight: '700', marginBottom: 6 },
  detailSection: { marginBottom: 6 },
  detailTitle: { fontWeight: '700' },
  detailValue: { color: SECONDARY_COLOR },

  recommendationItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  recommendationText: { marginLeft: 8 },
  reportFooter: { alignItems: 'center', marginTop: 12 },
  footerText: { color: SECONDARY_COLOR },
  footerNote: { color: SECONDARY_COLOR, fontSize: 12 },
  reportActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  reportButton: { flex: 1, marginHorizontal: 6, padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  reportButtonText: { color: '#fff', fontWeight: '700', marginLeft: 8 },

  // Modal styles
  modalOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modalCard: { width: '86%', backgroundColor: '#fff', borderRadius: 12, padding: 12, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatarCircle: { width: 46, height: 46, borderRadius: 24, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalSubtitle: { color: SECONDARY_COLOR, fontSize: 12 },
  modalBody: { marginVertical: 8 },
  modalText: { color: SECONDARY_COLOR, lineHeight: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginLeft: 8 },
  modalButtonText: { color: '#fff', fontWeight: '700' },

  // Notification banner
  notifWrapper: { position: 'absolute', left: 8, right: 8, top: Platform.OS === 'ios' ? 10 : 6, zIndex: 99999 },
  notifCard: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12 },
  notifText: { color: '#fff', marginLeft: 8, fontWeight: '600' },
});

export default ChatDemo;
