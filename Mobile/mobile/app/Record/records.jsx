import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  RefreshControl,
  Image,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { BASE_URL } from "@env";
import { AuthContext } from "../../context/AuthContext";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import moment from 'moment';
import NetInfo from '@react-native-community/netinfo';

const Records = () => {
  const router = useRouter();
  const { refreshAccessToken, user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const EMPTY_STATE_IMAGE = "https://cdn.dribbble.com/users/157704/screenshots/4913285/media/7dba9ef15d8b56f61a3a4e4628c0d1ee.png";
  const ERROR_STATE_IMAGE = "https://cdn.dribbble.com/users/107834/screenshots/2799566/oops.png";

  // Network status listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (!state.isConnected) {
        setError("No internet connection. Please check your network settings.");
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch reports
  const fetchReports = async () => {
    try {
      if (!isConnected) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setRefreshing(true);
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("access_token") || await refreshAccessToken();
      if (!token) throw new Error("Authentication failed");

      const response = await axios.get(`${BASE_URL}/reports/`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      });

      // Sort by date (newest first)
      const sortedReports = response.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      setReports(sortedReports);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.message || 
        "Failed to load reports. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isConnected) fetchReports();
  }, [isConnected]);

  // Open PDF in browser
  const openPDF = async (url) => {
    if (!url) {
      Alert.alert("Info", "No PDF available for this report");
      return;
    }

    const finalUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

    try {
      const supported = await Linking.canOpenURL(finalUrl);
      if (supported) {
        await Linking.openURL(finalUrl);
      } else {
        Alert.alert("Error", "Cannot open PDF in browser.");
      }
    } catch (err) {
      console.error("Failed to open PDF:", err);
      Alert.alert("Error", "Could not open PDF. Make sure a browser is installed.");
    }
  };

  // Download and share PDF
  const handleDownload = async (url, fileName) => {
    if (!url) {
      Alert.alert("Info", "No PDF available to download");
      return;
    }

    try {
      const finalUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
      const fileUri = FileSystem.cacheDirectory + (fileName || `report_${Date.now()}.pdf`);

      const downloadResumable = FileSystem.createDownloadResumable(
        finalUrl,
        fileUri,
        {}
      );

      const { uri } = await downloadResumable.downloadAsync();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Medical Report',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert("Success", `Report downloaded to: ${uri}`);
      }
    } catch (err) {
      console.error("Download failed:", err);
      Alert.alert("Error", "Failed to download the report. Please try again.");
    }
  };

  // Format date with moment.js
  const formatDate = (dateString) => {
    return moment(dateString).format('MMM D, YYYY [at] h:mm A');
  };

  // Report card component
  const ReportCard = ({ item }) => (
    <View style={styles.card}>
      <LinearGradient
        colors={['#4E8CFF', '#6A5ACD']}
        style={styles.cardHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <MaterialIcons name="description" size={24} color="#fff" />
        <Text style={styles.cardTitle}>{item.disease || "Medical Report"}</Text>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>
            {moment(item.created_at).format('MMM D')}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#6B7280" />
          <Text style={styles.patientName}>{user?.name || "Patient"}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.reportDate}>{formatDate(item.created_at)}</Text>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryLabel}>Summary:</Text>
          <Text style={styles.summaryText} numberOfLines={3}>
            {item.summary || "No summary available"}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        {item.pdf && (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.viewButton]}
              onPress={() => openPDF(item.pdf)}
            >
              <MaterialIcons name="picture-as-pdf" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>View</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.downloadButton]}
              onPress={() => handleDownload(item.pdf, `report_${item.id}.pdf`)}
            >
              <Feather name="download" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Download</Text>
            </TouchableOpacity>
          </>
        )}
        
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => router.push({ 
            pathname: "/reportdetails", 
            params: { id: item.id } 
          })}
        >
          <Text style={styles.detailsButtonText}>Details</Text>
          <Ionicons name="chevron-forward" size={18} color="#4E8CFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={{url: EMPTY_STATE_IMAGE}}
        style={styles.emptyImage} 
      />
      <Text style={styles.emptyTitle}>No Reports Found</Text>
      <Text style={styles.emptyText}>
        You don't have any medical reports yet. Start a new diagnosis 
        to generate your first report.
      </Text>
      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={() => router.push("/shifaa")}
      >
        <Text style={styles.primaryButtonText}>Start Diagnosis</Text>
      </TouchableOpacity>
    </View>
  );

  // Error state component
  const ErrorState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={{url: ERROR_STATE_IMAGE}}
        style={styles.emptyImage} 
      />
      <Text style={styles.emptyTitle}>Unable to Load Reports</Text>
      <Text style={styles.emptyText}>
        {error || "Please check your connection and try again."}
      </Text>
      <TouchableOpacity 
        style={styles.secondaryButton}
        onPress={fetchReports}
      >
        <Text style={styles.secondaryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4E8CFF" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4E8CFF', '#6A5ACD']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Medical Reports</Text>
        
        {!loading && !error && reports.length > 0 && (
          <Text style={styles.reportCount}>
            {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
          </Text>
        )}
      </LinearGradient>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchReports}
            colors={['#4E8CFF']}
            tintColor="#4E8CFF"
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3].map((_, index) => (
              <View key={index} style={styles.skeletonCard}>
                <View style={styles.skeletonHeader} />
                <View style={styles.skeletonBody} />
                <View style={styles.skeletonFooter} />
              </View>
            ))}
          </View>
        ) : error ? (
          <ErrorState />
        ) : reports.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={reports}
            renderItem={({ item }) => <ReportCard item={item} />}
            keyExtractor={item => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginLeft: 10,
  },
  reportCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    padding: 20,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  skeletonHeader: {
    backgroundColor: '#e5e7eb',
    height: 24,
    width: '60%',
    borderRadius: 4,
    marginBottom: 16,
  },
  skeletonBody: {
    backgroundColor: '#e5e7eb',
    height: 16,
    width: '80%',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonFooter: {
    backgroundColor: '#e5e7eb',
    height: 40,
    width: '100%',
    borderRadius: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  reportDate: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  summaryContainer: {
    marginTop: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  viewButton: {
    backgroundColor: '#EF4444',
  },
  downloadButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 6,
    fontSize: 14,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4E8CFF',
    backgroundColor: '#fff',
  },
  detailsButtonText: {
    color: '#4E8CFF',
    fontWeight: '500',
    marginRight: 6,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#4E8CFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: '#4E8CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4E8CFF',
  },
  secondaryButtonText: {
    color: '#4E8CFF',
    fontWeight: '600',
    fontSize: 16,
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 40,
  },
});

export default Records;