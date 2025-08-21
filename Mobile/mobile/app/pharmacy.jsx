import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";

export default function PharmacyMap() {
  const [region, setRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);

  // Replace with your Google Maps API key in app.json or manifest
  const GOOGLE_MAPS_API_KEY = "AIzaSyAyWqbnaAUBNcD69RIZnXQQ6Y-wxIXp_QU";

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location access is required.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Could not get location");
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  if (!region) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="blue" />
        <Text>Loading Map...</Text>
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_GOOGLE} // ✅ Google Maps provider
      initialRegion={region}
      showsUserLocation={true}
      showsMyLocationButton={true}
    >
      {userLocation && (
        <Marker
          coordinate={userLocation}
          title="You are here"
          pinColor="blue"
        />
      )}

      {/* Example: Static pharmacy marker */}
      <Marker
        coordinate={{
          latitude: region.latitude + 0.002,
          longitude: region.longitude + 0.002,
        }}
        title="Nearby Pharmacy"
        description="Example pharmacy location"
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
