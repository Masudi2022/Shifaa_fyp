// shifaa.jsx (updated with backend advice integration — bot response is blue)
import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet,
  TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, TouchableWithoutFeedback, Keyboard,
  ActivityIndicator, ScrollView, Animated, Easing,
  FlatList, Image
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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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

const ALL_SYMPTOMS = [ 'homa','homa_kali','baridi','maumivu ya kichwa','maumivu ya misuli','maumivu_ya_viungo','upele','macho_kuwasha_na_wekundu','kikohozi','mafua','kikohozi_kisichoisha','kupumua_kwa_shida','maumivu_ya_kifua','kutokwa_na_jasho_usiku','kupungua_uzito','kukosa_hamu_ya_kula','maumivu_ya_tumbo','kuhara_kwa_maji_mengi','kuhara_kunaodamu','kutapika','kichefuchefu','upungufu_wa_maji_mwilini','manjano_ya_macho_na_mwili','mkojo_mweusi','mara_nyingi_kwenda_choo_kidogo','maumivu_wakati_wa_kukojoa','maumivu_ya_ubavu','uchafu_kutoka_sehemu_za_siri','kidonda_kisicho_na_maumivu','uvimbe_wa_tezi','shingo_kuganda','kuogopa_mwangaza','degedege','mkojo_unaodamu','michubuko_ya_mwili','muwasho_sehemu_za_siri','kutokwa_na_damu_kiraisi','upungufu_wa_damu','kuvimbiwa_au_kuhara','kuhara','ugonjwa' ];

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
      showErrorModal('Samahani, haikuweza kuanza kikao', `Shifaa AI: ${errorMessage}\n\nJaribu tena au angalia muunganisho wako wa intaneti.`);
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

      const router = useRouter();

    // call this when user taps "Sijui"
   // call when user taps "Sijui" — sends only the single symptom the question is about
const handleSijui = () => {
  // try to extract symptom text from the currentQuestion string.
  // common format in your code: `Je, una dalili ya 'symptom_name'? (ndio/hapana)`
  let symptom = null;

  if (typeof currentQuestion === 'string') {
    // 1) first try to find text between single or double quotes
    const qmatch = currentQuestion.match(/['"“](.+?)['"”]/);
    if (qmatch && qmatch[1]) {
      symptom = qmatch[1];
    } else {
      // 2) fallback: try to capture after 'dalili ya' until a ? or end
      const m = currentQuestion.match(/dalili ya\s+['"]?([^?']+?)['"]?\??$/i);
      if (m && m[1]) symptom = m[1].trim();
    }
  }

  // 3) if still not found, try useful fallbacks in order:
  // - if user tapped a suggestion (you may track lastTappedSuggestion in state)
  // - use newMessage (what user typed)
  // - lastly use the entire currentQuestion string (sanitized)
  if (!symptom) {
    // If you track the exact suggestion the user tapped, use that variable here:
    // symptom = lastTappedSuggestion || ...
    symptom = (newMessage && newMessage.trim()) || (currentQuestion && currentQuestion.trim()) || '';
  }

  // normalize (replace underscores with spaces) and ensure single string
  symptom = String(symptom).replace(/_/g, ' ').trim();

  // create payload as single-item array and encode for querystring
  const payload = [symptom];
  try {
    const q = encodeURIComponent(JSON.stringify(payload));
    router.push(`/symptomDetails?symptoms=${q}`);
  } catch (err) {
    // fallback in case of weird characters
    router.push(`/symptomDetails?symptoms=${encodeURIComponent(JSON.stringify([symptom]))}`);
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
            <div>Name: ${reportData.full_name || 'Not Provided'}</div>
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
          <TouchableOpacity 
                    onPress={() => router.back()}
                    style={styles.headerButton}
                  >
                    <Ionicons name="arrow-back" size={24} color="#4E8CFF" />
                  </TouchableOpacity>
          <Animated.View style={[styles.centerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }] }>
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Icon name="medical-services" size={30} color={PRIMARY_COLOR} />
                  <Text style={styles.cardTitle}>Shifaa AI</Text>
                </View>
                <Text style={styles.cardText}>
                  Pata Ushauri wa kitaalamu na dalili za ugonjwa kutokanan na dalili zako
                  
                </Text>
              </Card.Content>
            </Card>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: SUCCESS_COLOR }]} onPress={() => navigation.navigate('ReportScreen')}>
              <IconFeather name="file-text" size={20} color="#fff" />
              <Text style={styles.actionButtonText}> Pata Ripoti</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]} onPress={startNewSession} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : (<><Icon name="chat" size={20} color="#fff" /><Text style={styles.actionButtonText}> Anzisha maajadiliano upya</Text></>)}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
        <NotificationBanner />
        <ErrorModal />
      </SafeAreaView>
    );
  }
if (isFinalDiagnosis) {
  const topFlex = 1 - REPORT_BOTTOM_FLEX;
  return (
    <SafeAreaView style={[styles.reportContainer, { paddingTop: insets.top, backgroundColor: '#f5f9ff' }]}>
      {/* Header with Shifaa logo and close button */}
      <View style={styles.ReportHeader}>
        <Image 
          source={require('./../assets/shifaa.png')}
          style={styles.logo} 
          resizeMode="contain"
        />
        <TouchableOpacity 
          style={styles.reportCloseButton}
          onPress={() => router.push('/shifaa')}
        >
          <Ionicons name="close-circle" size={28} color={PRIMARY_COLOR} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.reportContainer} 
        contentContainerStyle={{ 
          flexGrow: 1, 
          paddingBottom: Math.max(insets.bottom, 16) 
        }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Main report card */}
        <View style={styles.mainReportCard}>
          {/* Report header with title and decorative elements */}
          <View style={styles.reportHeader}>
            <View style={styles.headerDecoration} />
            <Text style={styles.reportTitle}>Ripoti ya Afya - Shifaa</Text>
            <Text style={styles.reportSubtitle}>Uchambuzi wa kimatibabu</Text>
            <Text style={styles.reportDate}>{formatDate()}</Text>
            <View style={styles.headerDecoration} />
          </View>

          {/* Patient information section */}
          <Card style={[styles.reportSection, styles.patientInfoCard]}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Icon name="person" size={24} color="#fff" />
                <Text style={[styles.sectionTitle, { color: '#fff' }]}>Taarifa za Mgonjwa</Text>
              </View>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Jina:</Text>
                  <Text style={styles.infoValue}>{user?.full_name || 'Haijatolewa'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{user?.email || 'Haijatolewa'}</Text>
                </View>
                
              </View>
            </Card.Content>
          </Card>

          {/* Reported symptoms */}
          <Card style={styles.reportSection}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Icon name="warning" size={24} color={WARNING_COLOR} />
                <Text style={styles.sectionTitle}>Dalili Zilizoripotiwa</Text>
              </View>
              {Array.isArray(symptoms) && symptoms.length > 0 ? (
                <View style={styles.symptomsGrid}>
                  {symptoms.map((symptom, idx) => (
                    <View key={idx} style={styles.symptomPill}>
                      <Icon name="fiber-manual-record" size={10} color={DANGER_COLOR} />
                      <Text style={styles.symptomText}>{String(symptom).replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Hakuna dalili zilizoripotiwa</Text>
              )}
            </Card.Content>
          </Card>

          {/* Diagnosis summary */}
          <Card style={[styles.reportSection, styles.diagnosisCard]}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Icon name="healing" size={24} color="#fff" />
                <Text style={[styles.sectionTitle, { color: '#fff' }]}>Muhtasari wa Uchunguzi</Text>
              </View>
              <View style={styles.diagnosisSummaryBox}>
                <Text style={styles.summaryText}>{currentQuestion}</Text>
              </View>
            </Card.Content>
          </Card>

          {/* Top advice summary */}
          {topAdvice && (
            <Card style={styles.reportSection}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Icon name="info" size={24} color={PRIMARY_COLOR} />
                  <Text style={styles.sectionTitle}>Ushauri Muhimu</Text>
                </View>
                <View style={styles.adviceBox}>
                  {typeof topAdvice === 'string' ? (
                    <Text style={styles.adviceText}>{topAdvice}</Text>
                  ) : (
                    <>
                      {topAdvice.maelezo_fupi && (
                        <Text style={styles.adviceText}>{topAdvice.maelezo_fupi}</Text>
                      )}
                      {topAdvice.dalili_za_kuangalia && (
                        <View style={styles.adviceDetail}>
                          <Icon name="remove-red-eye" size={16} color={WARNING_COLOR} />
                          <Text style={styles.adviceDetailText}>
                            <Text style={{ fontWeight: 'bold' }}>Dalili za kuangalia:</Text> {topAdvice.dalili_za_kuangalia.join('; ')}
                          </Text>
                        </View>
                      )}
                      {topAdvice.vipimo && (
                        <View style={styles.adviceDetail}>
                          <Icon name="medical-services" size={16} color={PRIMARY_COLOR} />
                          <Text style={styles.adviceDetailText}>
                            <Text style={{ fontWeight: 'bold' }}>Vipimo vinapendekezwa:</Text> {topAdvice.vipimo.join('; ')}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Possible conditions */}
          <Card style={styles.reportSection}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Icon name="coronavirus" size={24} color={DANGER_COLOR} />
                <Text style={styles.sectionTitle}>Magonjwa Yanayowezekana</Text>
              </View>
              
              {Array.isArray(possibleDiseases) && possibleDiseases.length > 0 ? (
                <View style={styles.diseasesContainer}>
                  {possibleDiseases.map((d, i) => (
                    <View key={i} style={styles.diseaseCard}>
                      <View style={styles.diseaseHeader}>
                        <Text style={styles.diseaseName}>{d?.disease || '—'}</Text>
                        {d?.probability && (
                          <View style={styles.probabilityBadge}>
                            <Text style={styles.probabilityText}>{(d.probability*100).toFixed(0)}%</Text>
                          </View>
                        )}
                      </View>
                      
                      {/* Advice sections */}
                      {d?.advice && typeof d.advice === 'object' ? (
                        <View style={styles.diseaseDetails}>
                          {d.advice.maelezo_fupi && (
                            <View style={styles.detailRow}>
                              <Icon name="description" size={16} color={SECONDARY_COLOR} />
                              <Text style={styles.detailText}>{d.advice.maelezo_fupi}</Text>
                            </View>
                          )}
                          {d.advice.tiba && (
                            <View style={styles.detailRow}>
                              <Icon name="medication" size={16} color={PRIMARY_COLOR} />
                              <Text style={styles.detailText}>
                                <Text style={{ fontWeight: 'bold' }}>Tiba:</Text> {Array.isArray(d.advice.tiba) ? d.advice.tiba.join('; ') : d.advice.tiba}
                              </Text>
                            </View>
                          )}
                          {d.advice.ushauri_wa_nyumbani && (
                            <View style={styles.detailRow}>
                              <Icon name="home-work" size={16} color={SUCCESS_COLOR} />
                              <Text style={styles.detailText}>
                                <Text style={{ fontWeight: 'bold' }}>Ushauri wa nyumbani:</Text> {Array.isArray(d.advice.ushauri_wa_nyumbani) ? d.advice.ushauri_wa_nyumbani.join('; ') : d.advice.ushauri_wa_nyumbani}
                              </Text>
                            </View>
                          )}
                        </View>
                      ) : d?.advice && typeof d.advice === 'string' ? (
                        <View style={styles.detailRow}>
                          <Icon name="lightbulb-outline" size={16} color={WARNING_COLOR} />
                          <Text style={styles.detailText}>{d.advice}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Hakuna magonjwa yaliyotambuliwa</Text>
              )}
            </Card.Content>
          </Card>

          {/* Recommendations */}
          <Card style={styles.reportSection}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Icon name="lightbulb-outline" size={24} color={SUCCESS_COLOR} />
                <Text style={styles.sectionTitle}>Mapendekezo</Text>
              </View>
              <View style={styles.recommendationsList}>
                <View style={styles.recommendationItem}>
                  <Icon name="check-circle" size={18} color={SUCCESS_COLOR} />
                  <Text style={styles.recommendationText}>Wasiliana na mtaalamu wa afya kwa uhakiki wa kina</Text>
                </View>
                <View style={styles.recommendationItem}>
                  <Icon name="check-circle" size={18} color={SUCCESS_COLOR} />
                  <Text style={styles.recommendationText}>Fuata mwongozo ukihisi dalili zinaendelea au kuwa mbaya</Text>
                </View>
                <View style={styles.recommendationItem}>
                  <Icon name="check-circle" size={18} color={SUCCESS_COLOR} />
                  <Text style={styles.recommendationText}>Enda kwenye kituo cha afya karibu nawe ikiwa dalili ni kali</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Footer */}
          <View style={styles.reportFooter}>
            <Image 
              source={require('./../assets/shifaa.png')}
              style={styles.watermark} 
              resizeMode="contain"
            />
            <Text style={styles.footerText}>Ripoti hii imeandaliwa na Shifaa AI</Text>
            <Text style={styles.footerNote}>*Ripoti hii si mbadala wa ushauri wa daktari wa kweli</Text>
            <Text style={styles.footerNote}>© {new Date().getFullYear()} Shifaa. Haki zote zimehifadhiwa</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.reportActions}>
          <TouchableOpacity 
            style={[styles.reportButton, styles.secondaryButton]}
            onPress={() => { 
              setSessionId(null); 
              setIsFinalDiagnosis(false); 
              setAnswerCount(0); 
              setPossibleDiseases([]); 
              setTopAdvice(null); 
            }}
          >
            <Icon name="refresh" size={20} color={PRIMARY_COLOR} />
            <Text style={[styles.reportButtonText, { color: PRIMARY_COLOR }]}> Uchunguzi Mpya</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.reportButton, styles.primaryButton]}
            onPress={handleSaveReport}
          >
            <IconFeather name="download" size={20} color="#fff" />
            <Text style={styles.reportButtonText}> Hifadhi Ripoti</Text>
          </TouchableOpacity>
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
        <View style={styles.headerContainer}>
              <View style={styles.headerContainer}>
  <View style={styles.headerRow}>
    {/* Back button */}
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
      <MaterialCommunityIcons name="arrow-left" size={26} color="#1976D2" />
    </TouchableOpacity>

    {/* Icon + Title + Subtitle */}
    <View style={styles.centeredTitle}>
      <MaterialCommunityIcons name="stethoscope" size={26} color="#1976D2" />
      <Text style={styles.messageTitle}>Shifaa</Text>
      <Text style={styles.subTitle}>Ushauri wa Afya kwa Haraka</Text>
    </View>

    {/* Optional right space */}
    <View style={{ width: 26 }} />
  </View>
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
                  {/* <TouchableOpacity style={[styles.choiceButton, { backgroundColor: WARNING_COLOR }]} onPress={() => navigation.navigate('UnknownSymptom', { symptom: currentQuestion })} disabled={isLoading}><Icon name="help" size={20} color="#fff" /><Text style={styles.choiceButtonText}> Sijui</Text></TouchableOpacity> */}
                  {/* <TouchableOpacity  style={[styles.choiceButton, { backgroundColor: WARNING_COLOR }]}  onPress={handleSijui}  disabled={isLoading}>  <Icon name="help" size={20} color="#fff" />  <Text style={styles.choiceButtonText}> Sijui</Text></TouchableOpacity> */}
                    <TouchableOpacity  style={[styles.choiceButton, { backgroundColor: WARNING_COLOR }]}  onPress={handleSijui}  disabled={isLoading}>  <Icon name="help" size={20} color="#fff" />  <Text style={styles.choiceButtonText}> Sijui</Text></TouchableOpacity>

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

  headerContainer: {
  backgroundColor: '#E3F2FD', // soft health blue
  paddingVertical: 12,
  paddingHorizontal: 15,
  elevation: 4, // Android shadow
  shadowColor: '#000', // iOS shadow
  shadowOpacity: 0.1,
  shadowRadius: 3,
  borderBottomLeftRadius: 15,
  borderBottomRightRadius: 15,
},
  headerButton: {
    position: 'absolute',
    left: 10,
    top: 10,
    padding: 8,
    borderRadius: 50,
    backgroundColor: '#fff',
    elevation: 2,
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },

headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
},

backButton: {
  padding: 5,
  borderRadius: 50,
  backgroundColor: '#fff',
  elevation: 2,
},

centeredTitle: {
  flex: 1,
  alignItems: 'center',
},

messageTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#0D47A1',
  marginTop: 2,
},

subTitle: {
  fontSize: 12,
  color: '#555',
  marginTop: 2,
},


messageTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#0D47A1',
  marginLeft: 2,
},

subTitle: {
  fontSize: 12,
  color: '#555',
  marginLeft: 52, // aligns with text start
},

logo: {
    width: 80,       // Reduced from 100
    height: 30,      // Reduced from 40
    marginLeft: 10,
  },
  
  // Watermark styling - smaller and more subtle
  watermark: {
    position: 'absolute',
    opacity: 0.08,    // More transparent (was 0.1)
    width: '80%',     // Smaller relative width
    height: 60,       // Much smaller than original 100
    top: -15,         // Adjusted position
  },

  debugToggle: { marginRight: 8, backgroundColor: SECONDARY_COLOR, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  debugToggleText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
  refreshButton: { backgroundColor: PRIMARY_COLOR, padding: 8, borderRadius: 8, marginLeft: 8 },

  chatContainer: { flex: 1, padding: 12 },
  chatContent: { flex: 1, minHeight: '4%', justifyContent: 'center' }, // keep bot area lower on screen
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

  

  // // REPORT / layout updates
  // reportContainer: { flex: 1, paddingHorizontal: 12, backgroundColor: '#fff' },
  // reportTop: { justifyContent: 'flex-start' },
  // reportHeader: { marginBottom: 12 },
  // reportTitle: { fontSize: 20, fontWeight: '700', color: PRIMARY_COLOR },
  // reportDate: { color: SECONDARY_COLOR, fontSize: 12 },

  // reportBottomWrapper: {
  //   justifyContent: 'flex-end',
  // },

  // reportBottom: {
  //   backgroundColor: '#fff',
  //   borderTopLeftRadius: 14,
  //   borderTopRightRadius: 14,
  //   paddingTop: 12,
  //   paddingHorizontal: 12,
  //   elevation: 4,
  //   shadowColor: '#000',
  //   shadowOpacity: 0.06,
  //   shadowRadius: 8,
  //   shadowOffset: { width: 0, height: -3 },
  // },

  // reportSection: { marginBottom: 12 },
  // sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  // sectionTitle: { fontWeight: '700', marginLeft: 8 },
  // infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  // infoLabel: { color: SECONDARY_COLOR },
  // infoValue: { fontWeight: '600' },

  // symptomsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  // symptomItem: { flexDirection: 'row', alignItems: 'center', marginRight: 8, marginBottom: 6 },
  // symptomText: { marginLeft: 6 },
  // summaryText: { lineHeight: 20 },

  // diseaseCard: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 8 },
  // diseaseName: { fontWeight: '700', marginBottom: 6 },
  // detailSection: { marginBottom: 6 },
  // detailTitle: { fontWeight: '700' },
  // detailValue: { color: SECONDARY_COLOR },

  // recommendationItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  // recommendationText: { marginLeft: 8 },
  // reportFooter: { alignItems: 'center', marginTop: 12 },
  // footerText: { color: SECONDARY_COLOR },
  // footerNote: { color: SECONDARY_COLOR, fontSize: 12 },
  // reportActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  // reportButton: { flex: 1, marginHorizontal: 6, padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  // reportButtonText: { color: '#fff', fontWeight: '700', marginLeft: 8 },


  // -----------------------------------------report styles ------------------------------------------
  
  reportContainer: {
    flex: 1,
    backgroundColor: '#f5f9ff',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  repprtLogo: {
    width: 100,
    height: 40,
  },
  reportCloseButton: {
    padding: 4,
  },
  mainReportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  reportHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  reportheaderDecoration: {
    height: 4,
    width: 40,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 2,
    marginVertical: 8,
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: PRIMARY_COLOR,
    textAlign: 'center',
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 14,
    color: SECONDARY_COLOR,
    textAlign: 'center',
    marginBottom: 8,
  },
  reportDate: {
    color: SECONDARY_COLOR,
    fontSize: 12,
    textAlign: 'center',
  },
  patientInfoCard: {
    backgroundColor: PRIMARY_COLOR,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#ffffffaa',
    fontSize: 12,
  },
  infoValue: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  reportSection: {
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 16,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  symptomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeeee',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  symptomText: {
    marginLeft: 6,
    fontSize: 12,
    color: DANGER_COLOR,
  },
  diagnosisCard: {
    backgroundColor: PRIMARY_COLOR,
  },
  diagnosisSummaryBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
  },
  summaryText: {
    color: '#fff',
    lineHeight: 22,
  },
  adviceBox: {
    backgroundColor: '#f8f9ff',
    padding: 12,
    borderRadius: 8,
  },
  adviceText: {
    lineHeight: 22,
    color: '#333',
  },
  adviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  adviceDetailText: {
    marginLeft: 8,
    color: '#555',
    fontSize: 13,
    flex: 1,
  },
  diseasesContainer: {
    marginTop: 8,
  },
  diseaseCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  diseaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diseaseName: {
    fontWeight: '700',
    fontSize: 16,
    color: DANGER_COLOR,
  },
  probabilityBadge: {
    backgroundColor: '#ffeeee',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  probabilityText: {
    color: DANGER_COLOR,
    fontWeight: 'bold',
    fontSize: 12,
  },
  diseaseDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: '#555',
    fontSize: 13,
    flex: 1,
  },
  recommendationsList: {
    marginTop: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recommendationText: {
    marginLeft: 8,
    color: '#555',
    fontSize: 14,
    flex: 1,
  },
  emptyText: {
    color: SECONDARY_COLOR,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  reportFooter: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    opacity: 0.1,
    width: '100%',
    height: 100,
    top: -30,
  },
  footerText: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerNote: {
    color: SECONDARY_COLOR,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 2,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 16,
  },
  reportButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
  },
  reportButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },


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