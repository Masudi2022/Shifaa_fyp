// app/records.jsx
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  RefreshControl,
  Image,
  ScrollView,
  Alert,
  StatusBar
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { BASE_URL } from "@env";
import { AuthContext } from "../../context/AuthContext";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Card } from 'react-native-paper';
import NetInfo from "@react-native-community/netinfo";

// Color scheme
const PRIMARY_COLOR = '#4E8CFF';
const SECONDARY_COLOR = '#6c757d';
const BACKGROUND_COLOR = '#f8f9fa';
const ERROR_COLOR = '#dc3545';
const SUCCESS_COLOR = '#28a745';

// Online image URLs
const EMPTY_STATE_IMAGE = 'https://cdn.dribbble.com/users/157704/screenshots/4913285/media/7dba9ef15d8b56f61a3a4e4628c0d1ee.png';
const ERROR_STATE_IMAGE = 'https://cdn.dribbble.com/users/107834/screenshots/2799566/oops.png';

export default function Records() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const router = useRouter();
  const { refreshAccessToken, user } = useContext(AuthContext);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (!state.isConnected) {
        setError('No internet connection. Please check your network settings.');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchReports = async () => {
    try {
      if (!isConnected) {
        setError('No internet connection. Please check your network settings.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setRefreshing(true);
      setLoading(true);
      let token = await AsyncStorage.getItem("access_token");

      if (!token) {
        token = await refreshAccessToken();
        if (!token) {
          setError('Authentication failed. Please login again.');
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      const res = await axios.get(`${BASE_URL}/reports/`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      setReports(res.data);
      setError('');
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err.response?.data?.message || 'Failed to load reports. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchReports();
    }
  }, [isConnected]);

  const openPDF = (url) => {
    if (!url) {
      Alert.alert('Info', 'No PDF available for this report');
      return;
    }
    Linking.openURL(url).catch((err) => {
      console.error("Failed to open PDF:", err);
      Alert.alert('Error', 'Could not open PDF. Make sure you have a PDF viewer installed.');
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card} elevation={3}>
      <View style={styles.cardHeader}>
        <Icon name="description" size={24} color="white" />
        <Text style={styles.title}>
          {item.disease || "Medical Report"}
        </Text>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>
            {formatDate(item.created_at).split(',')[0]}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Icon name="person" size={16} color={SECONDARY_COLOR} />
          <Text style={styles.patientInfo}>
            {user?.name || 'Patient'}
          </Text>
        </View>
        
        <Text style={styles.summary} numberOfLines={3}>
          {item.summary || "No summary available"}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        {item.pdf && (
          <TouchableOpacity
            style={styles.pdfButton}
            onPress={() => openPDF(item.pdf)}
          >
            <Icon name="picture-as-pdf" size={20} color="#fff" />
            <Text style={styles.pdfButtonText}>View PDF</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => router.push({ pathname: "/reportdetails", params: { id: item.id }})}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
          <Icon name="arrow-forward" size={18} color={PRIMARY_COLOR} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={{ uri: EMPTY_STATE_IMAGE }}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>No Reports Found</Text>
      <Text style={styles.emptyText}>
        You haven't generated any medical reports yet. Start a new diagnosis to create your first report.
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => router.push('/shifaa')}
      >
        <Text style={styles.startButtonText}>Start Diagnosis</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={{ uri: ERROR_STATE_IMAGE }}
        style={styles.errorImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Failed to Load Reports</Text>
      <Text style={styles.emptyText}>
        {error || 'Please check your connection and try again.'}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={fetchReports}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSkeletonLoader = () => (
    <View style={styles.loadingContainer}>
      {[1, 2, 3].map((item) => (
        <Card key={item} style={styles.skeletonCard} elevation={2}>
          <View style={styles.skeletonHeader}>
            <View style={[styles.skeletonCircle, { width: 24, height: 24 }]} />
            <View style={[styles.skeletonLine, { width: '40%', marginLeft: 10 }]} />
          </View>
          <View style={styles.skeletonContent}>
            <View style={[styles.skeletonLine, { width: '60%' }]} />
            <View style={[styles.skeletonLine, { width: '80%', height: 60 }]} />
          </View>
          <View style={styles.skeletonFooter}>
            <View style={[styles.skeletonButton, { width: 100 }]} />
            <View style={[styles.skeletonButton, { width: 120 }]} />
          </View>
        </Card>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical Reports</Text>
          {!loading && !error && reports.length > 0 && (
            <Text style={styles.headerSubtitle}>
              {reports.length} {reports.length === 1 ? 'Report' : 'Reports'} Available
            </Text>
          )}
        </View>
        <View style={styles.headerWave}>
          <Image 
            source={{ uri: 'https://www.transparenttextures.com/patterns/asfalt-light.png' }} 
            style={styles.headerPattern}
          />
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchReports}
            colors={['white']}
            tintColor="white"
            progressBackgroundColor={PRIMARY_COLOR}
          />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {loading ? (
          renderSkeletonLoader()
        ) : error ? (
          renderErrorState()
        ) : reports.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  headerContainer: {
    backgroundColor: PRIMARY_COLOR,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    // borderBottomRightRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  header: {
    padding: 20,
    paddingTop: 2,
  },
  headerWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    opacity: 0.3,
  },
  headerPattern: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
    marginLeft: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  listContainer: {
    padding: 15,
    paddingTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: PRIMARY_COLOR,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 10,
    flex: 1,
  },
  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  patientInfo: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  summary: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginTop: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ERROR_COLOR,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 2,
  },
  pdfButtonText: {
    color: "#fff",
    fontWeight: '500',
    marginLeft: 5,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 2,
  },
  detailsButtonText: {
    color: PRIMARY_COLOR,
    fontWeight: '500',
    marginRight: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyImage: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  errorImage: {
    width: '100%',
    height: 150,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: SECONDARY_COLOR,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  startButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 35,
    elevation: 3,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 35,
    elevation: 3,
  },
  backButton: {
    marginRight: 10,
  },
  retryButtonText: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 15,
    paddingTop: 20,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  skeletonContent: {
    marginBottom: 15,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonCircle: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
  },
  skeletonLine: {
    backgroundColor: '#e0e0e0',
    height: 16,
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonButton: {
    backgroundColor: '#e0e0e0',
    height: 40,
    borderRadius: 8,
  },
});


// // app/records.jsx
// import React, { useEffect, useState, useContext, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
//   FlatList,
//   TouchableOpacity,
//   SafeAreaView,
//   Linking,
//   StatusBar,
// } from "react-native";
// import axios from "axios";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";
// import { BASE_URL } from "@env";
// import { AuthContext } from "../../context/AuthContext";
// import { Ionicons } from "@expo/vector-icons";

// export default function Records() {
//   const [reports, setReports] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const router = useRouter();
//   const { refreshAccessToken } = useContext(AuthContext);

//   const fetchReports = useCallback(async () => {
//     try {
//       let token = await AsyncStorage.getItem("access_token");

//       if (!token) {
//         token = await refreshAccessToken();
//         if (!token) {
//           setLoading(false);
//           return;
//         }
//       }

//       const res = await axios.get(`${BASE_URL}/reports/`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       setReports(res.data);
//     } catch (err) {
//       console.error("Error fetching reports:", err.response?.data || err.message);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [refreshAccessToken]);

//   useEffect(() => {
//     fetchReports();
//   }, [fetchReports]);

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchReports();
//   };

//   const openPDF = (url) => {
//     if (!url) return console.warn("No PDF available for this report");
//     Linking.openURL(url).catch((err) => console.error("Failed to open PDF:", err));
//   };

//   const renderItem = ({ item }) => (
//     <View style={styles.card}>
//       <TouchableOpacity
//         onPress={() =>
//           router.push({
//             pathname: "/reportdetails",
//             params: { id: item.id },
//           })
//         }
//       >
//         <Text style={styles.title}>{item.disease || "Unknown Disease"}</Text>
//         <Text style={styles.date}>
//           {new Date(item.created_at).toLocaleString()}
//         </Text>
//         <Text style={styles.summary} numberOfLines={2}>
//           {item.summary}
//         </Text>
//       </TouchableOpacity>

//       {item.pdf && (
//         <TouchableOpacity style={styles.pdfButton} onPress={() => openPDF(item.pdf)}>
//           <Text style={styles.pdfButtonText}>📄 View PDF</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
//       <View style={styles.headerContainer}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.headerText}>Medical Reports</Text>
//       </View>

//       {loading ? (
//         <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
//       ) : reports.length === 0 ? (
//         <Text style={styles.emptyText}>No reports found</Text>
//       ) : (
//         <FlatList
//           data={reports}
//           keyExtractor={(item) => item.id.toString()}
//           renderItem={renderItem}
//           contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 15 }}
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//         />
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#F7F8FA",
//   },
//   headerContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#007AFF",
//     paddingVertical: 15,
//     paddingHorizontal: 10,
//   },
//   backButton: {
//     marginRight: 10,
//   },
//   headerText: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#fff",
//   },
//   card: {
//     backgroundColor: "#fff",
//     padding: 15,
//     borderRadius: 10,
//     marginBottom: 10,
//     elevation: 2,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#007AFF",
//   },
//   date: {
//     fontSize: 12,
//     color: "#888",
//     marginVertical: 4,
//   },
//   summary: {
//     fontSize: 14,
//     color: "#555",
//   },
//   emptyText: {
//     marginTop: 30,
//     fontSize: 16,
//     color: "#666",
//     textAlign: "center",
//   },
//   pdfButton: {
//     marginTop: 10,
//     backgroundColor: "#007AFF",
//     paddingVertical: 8,
//     borderRadius: 5,
//     alignItems: "center",
//   },
//   pdfButtonText: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
// });
