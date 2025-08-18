import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import * as Linking from "expo-linking";
import { API_BASE } from "@env"; // <--- Import from .env using react-native-dotenv

/**
 * PharmaciesMap.jsx
 * ---------------------------------------------------------------------------
 * A polished, production-ready React Native screen to render ALL pharmacies
 * returned by your Django endpoint on a map of Tanzania (including Zanzibar).
 *
 * Assumptions
 * - Your backend exposes GET /pharmacies/ returning an array of objects:
 *   {
 *     id, name, latitude, longitude, region, details?, phone?, email?, address?, website?, logo?
 *   }
 * - You are using Expo. (Works on bare RN too; replace expo-location if needed.)
 * - You have react-native-maps installed and configured with a Google Maps key
 *   for Android/iOS (recommended for best performance and clustering later).
 *
 * Notes
 * - Initial camera spans mainland + Zanzibar; we also auto-fit to markers after
 *   data loads.
 * - Includes search (by name/region/address) and region filter.
 * - Callouts offer quick actions (Call, WhatsApp, Email, Directions, Website).
 * - "Locate Me" button requests location permission and centers the map.
 * - Handles Android emulator networking (10.0.2.2) vs iOS simulator (localhost).
 */

// ====== CONFIGURE THIS: endpoint comes from .env ======
const ENDPOINT = `${API_BASE}/pharmacies/`;

// Tanzania-wide region (covers Zanzibar too)
const INITIAL_REGION = {
  latitude: -6.369028, // TZ centroid
  longitude: 34.888822,
  latitudeDelta: 17.5,
  longitudeDelta: 20.0,
};

export default function Pharmacy() {
  const mapRef = useRef(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [locating, setLocating] = useState(false);

  // Fetch pharmacies
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(ENDPOINT);
        if (!mounted) return;
        const cleaned = (res?.data ?? [])
          .filter((p) => p?.latitude != null && p?.longitude != null)
          .map((p) => ({
            ...p,
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
          }));
        setPharmacies(cleaned);
        // Fit map to markers after a tick
        requestAnimationFrame(() => fitToMarkers(cleaned));
      } catch (e) {
        console.error(e);
        setError("Failed to load pharmacies. Please check your API.");
        Alert.alert("Error", "Failed to load pharmacies from server.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const regions = useMemo(() => {
    const set = new Set(pharmacies.map((p) => (p.region || "").trim()).filter(Boolean));
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [pharmacies]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pharmacies.filter((p) => {
      const matchesRegion = regionFilter === "ALL" || (p.region || "").toLowerCase() === regionFilter.toLowerCase();
      if (!matchesRegion) return false;
      if (!q) return true;
      const hay = `${p.name} ${p.region} ${p.address} ${p.details}`.toLowerCase();
      return hay.includes(q);
    });
  }, [pharmacies, query, regionFilter]);

  function fitToMarkers(items = filtered) {
    if (!mapRef.current || !items?.length) return;
    const coordinates = items.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 80, right: 80, bottom: 120, left: 80 },
      animated: true,
    });
  }

  async function handleLocateMe() {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Location permission is needed to center the map.");
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (coords && mapRef.current) {
        mapRef.current.animateCamera({
          center: { latitude: coords.latitude, longitude: coords.longitude },
          zoom: 13,
        });
      }
    } catch (e) {
      console.warn("Locate me error", e);
      Alert.alert("Error", "Could not fetch your current location.");
    } finally {
      setLocating(false);
    }
  }

  function openDial(phone) {
    if (!phone) return;
    const scheme = Platform.select({ ios: "telprompt:", android: "tel:" });
    Linking.openURL(`${scheme}${phone}`);
  }

  function openWhatsApp(phone) {
    if (!phone) return;
    const wa = `whatsapp://send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent("Habari! Naomba msaada.")}`;
    Linking.openURL(wa).catch(() => Alert.alert("WhatsApp not installed", "Please install WhatsApp to use this feature."));
  }

  function openEmail(email) {
    if (!email) return;
    const url = `mailto:${email}`;
    Linking.openURL(url);
  }

  function openDirections(lat, lng, label) {
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(label || "Pharmacy")}`,
      android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(label || "Pharmacy")})`,
    });
    Linking.openURL(url);
  }

  function openWebsite(url) {
    if (!url) return;
    let safe = url;
    if (!/^https?:\/\//i.test(safe)) safe = `https://${safe}`;
    Linking.openURL(safe);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pharmacies — Tanzania & Zanzibar</Text>
        <View style={styles.toolbar}>
          <TextInput
            placeholder="Search by name, region, address…"
            value={query}
            onChangeText={setQuery}
            style={styles.search}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={() => { setQuery(""); setRegionFilter("ALL"); fitToMarkers(pharmacies); }} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Region filter chips */}
        <View style={styles.chipsRow}>
          {regions.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRegionFilter(r)}
              style={[styles.chip, regionFilter === r && styles.chipActive]}
            >
              <Text style={[styles.chipText, regionFilter === r && styles.chipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        toolbarEnabled
        moveOnMarkerPress={false}
      >
        {filtered.map((p) => (
          <Marker
            key={p.id ?? `${p.name}-${p.latitude}-${p.longitude}`}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            title={p.name}
            description={p.address || p.region}
          >
            <Callout tooltip>
              <View style={styles.calloutCard}>
                <Text style={styles.calloutTitle}>{p.name}</Text>
                {!!p.region && <Text style={styles.calloutMeta}>Region: {p.region}</Text>}
                {!!p.address && <Text style={styles.calloutMeta}>{p.address}</Text>}
                {!!p.details && <Text style={styles.calloutDetails}>{p.details}</Text>}

                <View style={styles.actionsRow}>
                  {!!p.phone && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openDial(p.phone)}>
                      <Text style={styles.actionText}>Call</Text>
                    </TouchableOpacity>
                  )}
                  {!!p.phone && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openWhatsApp(p.phone)}>
                      <Text style={styles.actionText}>WhatsApp</Text>
                    </TouchableOpacity>
                  )}
                  {!!p.email && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEmail(p.email)}>
                      <Text style={styles.actionText}>Email</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openDirections(p.latitude, p.longitude, p.name)}>
                    <Text style={styles.actionText}>Directions</Text>
                  </TouchableOpacity>
                  {!!p.website && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openWebsite(p.website)}>
                      <Text style={styles.actionText}>Website</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Footer overlay */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.countText}>{filtered.length} shown</Text>
          {loading && <ActivityIndicator size="small" />}
          {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>
        <View style={styles.footerRight}>
          <TouchableOpacity style={styles.btn} onPress={() => fitToMarkers()}>
            <Text style={styles.btnText}>Fit All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, locating && { opacity: 0.6 }]} onPress={handleLocateMe} disabled={locating}>
            <Text style={styles.btnText}>{locating ? "Locating…" : "Locate Me"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#f7f7fb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e6e6ee",
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  toolbar: { flexDirection: "row", gap: 8, alignItems: "center" },
  search: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: "#d9d9e3",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  resetBtn: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d9d9e3",
    backgroundColor: "#fff",
  },
  resetText: { fontWeight: "600" },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#d9d9e3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#111827" },
  chipText: { fontSize: 12, color: "#111827" },
  chipTextActive: { color: "#fff", fontWeight: "700" },

  map: { flex: 1 },

  calloutCard: {
    width: 280,
    maxWidth: 320,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  calloutTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  calloutMeta: { fontSize: 12, color: "#4b5563" },
  calloutDetails: { fontSize: 12, color: "#111827", marginTop: 4 },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  actionBtn: {
    borderWidth: 1,
    borderColor: "#d9d9e3",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  actionText: { fontSize: 12, fontWeight: "600" },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9d9e3",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countText: { fontWeight: "700" },
  errorText: { color: "#b91c1c", marginLeft: 6 },
  footerRight: { flexDirection: "row", gap: 8 },
  btn: {
    backgroundColor: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
