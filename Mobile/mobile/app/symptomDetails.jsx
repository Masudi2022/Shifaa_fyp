// File: app/symptomsData/symptomsData.jsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// import { getSymptomDescription } from './symptomDescriptions';
import { getSymptomDescription } from './symptomsData/symptomsData';

export default function SymptomsData() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Decode the incoming `symptoms` query param. We expect a single-item array
  // (e.g. ?symptoms=%5B%22maumivu_ya_kichwa%22%5D) but support other shapes.
  const symptoms = useMemo(() => {
    const raw = params?.symptoms || params?.symptom || '';
    if (!raw) return [];

    // If it's already an array (some router versions may pass arrays), use it
    if (Array.isArray(raw)) return raw;

    try {
      const parsed = JSON.parse(decodeURIComponent(String(raw)));
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch (e1) {
      try {
        const parsed = JSON.parse(String(raw));
        return Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch (e2) {
        // fallback: use raw string as single symptom
        return [String(raw)];
      }
    }
  }, [params]);

  const handleOpenDisease = (symptom) => {
    if (!symptom) return;
    // push to /disease with symptom param (encoded)
    const q = encodeURIComponent(symptom);
    router.push(`/disease?symptom=${q}`);
  };

  const handleReportMissing = (symptom) => {
    // Small local feedback flow - simple alert. You can replace with API call.
    Alert.alert(
      'Ripoti Maelezo',
      'Je, ungependa kuripoti kuwa maelezo haya hayapo au si sahihi?',
      [
        { text: 'La', style: 'cancel' },
        { text: 'Ndio', onPress: () => Alert.alert('Asante', 'Ripoti imepokelewa. Tutafuatilia.')} 
      ]
    );
  };

  const renderSymptomCard = ({ item }) => {
    const desc = getSymptomDescription(item);
    const displayName = desc?.title || String(item).replace(/_/g, ' ');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.symptomTitle}>{displayName}||</Text>
          <View style={styles.iconContainer}>
            <Ionicons name="medical" size={20} color="#4A90E2" />
          </View>
        </View>
        
        <Text style={styles.symptomShort}>{desc?.short || 'Hakuna maelezo mafupi ya dalili hii.'}</Text>

        {desc?.details ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Maelezo</Text>
            <Text style={styles.sectionText}>{desc.details}</Text>
          </View>
        ) : null}

        {desc?.whenToSeeDoctor ? (
          <View style={[styles.section, styles.doctorSection]}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="warning" size={16} color="#E74C3C" />
              <Text style={[styles.sectionHeader, { marginLeft: 6 }]}>Wakati wa Kutafuta Daktari</Text>
            </View>
            <Text style={[styles.sectionText, styles.doctorText]}>{desc.whenToSeeDoctor}</Text>
          </View>
        ) : null}

        {!desc && (
          <View style={styles.section}>
            <Text style={styles.sectionText}>Maelezo haya hayajapatikana kwa dalili hii.</Text>
            <TouchableOpacity 
              style={styles.reportBtn} 
              onPress={() => handleReportMissing(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="alert-circle-outline" size={16} color="#F39C12" />
              <Text style={styles.reportBtnText}>Ripoti ukosefu wa maelezo</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.fullWidthButton} 
            onPress={() => handleOpenDisease(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={18} color="#fff" />
            <Text style={styles.fullWidthButtonText}>Angalia magonjwa yanayoweza</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.fullWidthButton, styles.secondaryFullButton]} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color="#4A90E2" />
            <Text style={[styles.fullWidthButtonText, styles.secondaryFullButtonText]}>Rudi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Full-width header */}
      <View style={styles.fullWidthHeader}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#4A90E2" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Maelezo ya Dalili</Text>
            <View style={styles.headerRightPlaceholder} />
          </View>
        </SafeAreaView>
      </View>

      {symptoms.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>Hakuna dalili zilizopitishwa</Text>
          <Text style={styles.emptySubtitle}>
            Rudi kwenye mazungumzo na gonga 'Sijui' kwenye dalili unayotaka kuelezea
          </Text>
        </View>
      ) : (
        <FlatList
          data={symptoms}
          keyExtractor={(item, idx) => `${String(item)}_${idx}`}
          renderItem={renderSymptomCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  // Full-width header styles
  fullWidthHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eceef1ff',
    width: '100%',
  },
  headerSafeArea: {
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 42,
    width: '100%',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#2C3E50', 
  },
  headerRightPlaceholder: {
    width: 32,
  },
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    padding: 6,
    backgroundColor: '#EBF5FB',
    borderRadius: 8,
  },
  symptomTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#2C3E50',
    flex: 1,
    marginRight: 12,
  },
  symptomShort: { 
    fontSize: 15, 
    color: '#566573', 
    marginBottom: 16,
    lineHeight: 22,
  },
  section: { 
    marginTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionHeader: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#2C3E50', 
  },
  sectionText: { 
    fontSize: 14, 
    color: '#566573',
    lineHeight: 21,
  },
  doctorSection: {
    backgroundColor: '#FDEDEC',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  doctorText: {
    color: '#E74C3C',
  },
  buttonContainer: {
    marginTop: 20,
  },
  fullWidthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
  },
  fullWidthButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  secondaryFullButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  secondaryFullButtonText: {
    color: '#4A90E2',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEF9E7',
    borderWidth: 1,
    borderColor: '#F7DC6F',
    justifyContent: 'center',
  },
  reportBtnText: {
    color: '#D35400',
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7F8C8D',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#BDC3C7',
    textAlign: 'center',
    lineHeight: 20,
  },
});