import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
  Linking,
  PermissionsAndroid
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import axios from 'axios';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from 'react-native-gesture-bottom-sheet';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function Pharmacy() {
  const [searchQuery, setSearchQuery] = useState('');
  const [pharmacies, setPharmacies] = useState([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [region, setRegion] = useState({
    latitude: -6.7924,  // Default to Dar es Salaam coordinates
    longitude: 39.2083,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [error, setError] = useState(null);

  const bottomSheet = useRef(null);
  const mapRef = useRef(null);

  // Replace with your actual Django API endpoint
  const API_URL = 'http://192.168.0.222:8000/api/pharmacies/';

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          Alert.alert(
            'Permission Required',
            'Location permission is needed to find nearby pharmacies'
          );
          // Use default location if permission denied
          fetchPharmacies();
        }
      } else {
        getCurrentLocation();
      }
    } catch (err) {
      console.warn(err);
      fetchPharmacies(); // Fallback to default location
    }
  };

  const getCurrentLocation = () => {
    setIsLoading(true);
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        fetchPharmacies(latitude, longitude);
      },
      error => {
        console.warn(error.message);
        Alert.alert('Error', 'Could not get your location. Using default location.');
        fetchPharmacies(); // Fallback to default location
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const fetchPharmacies = async (lat = null, lng = null) => {
    try {
      setIsLoading(true);
      const params = {};
      
      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
        params.radius = 10; // 10km radius
      }

      const response = await axios.get(API_URL, { params });
      
      const formatted = response.data.map(item => ({
        id: item.id,
        name: item.name,
        address: item.address,
        phone: item.phone,
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        details: item.details,
        region: item.region,
        distance: lat && lng ? calculateDistance(
          lat,
          lng,
          parseFloat(item.latitude),
          parseFloat(item.longitude)
        ).toFixed(1) : null
      }));

      setPharmacies(formatted);
      setFilteredPharmacies(formatted);
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', 'Failed to fetch pharmacies');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  };

  const deg2rad = (deg) => deg * (Math.PI/180);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text === '') {
      setFilteredPharmacies(pharmacies);
    } else {
      const filtered = pharmacies.filter(pharmacy =>
        pharmacy.name.toLowerCase().includes(text.toLowerCase()) ||
        pharmacy.address.toLowerCase().includes(text.toLowerCase()) ||
        pharmacy.region.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredPharmacies(filtered);
    }
  };

  const handlePharmacySelect = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setRegion({
      latitude: pharmacy.latitude,
      longitude: pharmacy.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    bottomSheet.current.show();
  };

  const callPharmacy = () => {
    if (selectedPharmacy?.phone) {
      Linking.openURL(`tel:${selectedPharmacy.phone}`);
    } else {
      Alert.alert('Info', 'No phone number available for this pharmacy');
    }
  };

  const renderPharmacyDetails = () => (
    <View style={styles.detailsContainer}>
      <Text style={styles.pharmacyName}>{selectedPharmacy?.name}</Text>
      
      <View style={styles.detailRow}>
        <Ionicons name="location" size={18} color="#4E8CFF" />
        <Text style={styles.detailText}>{selectedPharmacy?.address}</Text>
      </View>
      
      <View style={styles.detailRow}>
        <Ionicons name="map" size={18} color="#4E8CFF" />
        <Text style={styles.detailText}>{selectedPharmacy?.region}</Text>
      </View>
      
      {selectedPharmacy?.phone && (
        <View style={styles.detailRow}>
          <Ionicons name="call" size={18} color="#4E8CFF" />
          <Text style={styles.detailText}>{selectedPharmacy.phone}</Text>
        </View>
      )}
      
      {selectedPharmacy?.distance && (
        <View style={styles.detailRow}>
          <Ionicons name="navigate" size={18} color="#4E8CFF" />
          <Text style={styles.detailText}>{selectedPharmacy.distance} km away</Text>
        </View>
      )}
      
      {selectedPharmacy?.details && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailsText}>{selectedPharmacy.details}</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.callButton}
        onPress={callPharmacy}
      >
        <Ionicons name="call" size={20} color="white" />
        <Text style={styles.callButtonText}>Call Pharmacy</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4E8CFF" />
        <Text>Loading pharmacies...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search pharmacies..."
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={region}
            showsUserLocation={true}
          >
            {filteredPharmacies.map(pharmacy => (
              <Marker
                key={pharmacy.id}
                coordinate={{
                  latitude: pharmacy.latitude,
                  longitude: pharmacy.longitude
                }}
                onPress={() => handlePharmacySelect(pharmacy)}
              >
                <View style={styles.markerContainer}>
                  <View style={styles.markerPin}>
                    <MaterialCommunityIcons name="medical-bag" size={20} color="white" />
                  </View>
                </View>
              </Marker>
            ))}
          </MapView>

          <BottomSheet
            ref={bottomSheet}
            height={300}
            radius={20}
            sheetBackgroundColor="#fff"
            hasDraggableIcon
          >
            {selectedPharmacy && renderPharmacyDetails()}
          </BottomSheet>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    margin: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4E8CFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 20,
  },
  pharmacyName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  detailsSection: {
    marginTop: 15,
    marginBottom: 20,
  },
  detailsText: {
    color: '#666',
    lineHeight: 20,
  },
  callButton: {
    backgroundColor: '#4E8CFF',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  callButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});