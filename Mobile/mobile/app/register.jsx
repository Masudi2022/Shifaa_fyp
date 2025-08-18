import React, { useContext, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import Icon from 'react-native-vector-icons/Ionicons';

const Jisajili = () => {
  const { register, isLoading } = useContext(AuthContext);
  const router = useRouter();

  const [baruaPepe, setBaruaPepe] = useState("");
  const [jinaKamili, setJinaKamili] = useState("");
  const [simu, setSimu] = useState("");
  const [nenoSiri, setNenoSiri] = useState("");
  const [thibitishaNenoSiri, setThibitishaNenoSiri] = useState("");
  const [inaonyeshaNenoSiri, setInaonyeshaNenoSiri] = useState(false);

  const handleJisajili = async () => {
    if (!baruaPepe || !nenoSiri || !jinaKamili) {
      Alert.alert("Makosa", "Tafadhali jaza sehemu zote zinazohitajika.");
      return;
    }

    if (nenoSiri !== thibitishaNenoSiri) {
      Alert.alert("Makosa", "Nenosiri hazifanani.");
      return;
    }

    if (nenoSiri.length < 6) {
      Alert.alert("Makosa", "Nenosiri lazima liwe na herufi 6 au zaidi.");
      return;
    }

    try {
      await register({ email: baruaPepe, password: nenoSiri, full_name: jinaKamili, phone: simu });
      router.replace("/");
    } catch (error) {
      Alert.alert("Imeshindikana", "Tafadhali hakiki maelezo yako au jaribu tena baadaye.");
    }
  };

  return (
    <SafeAreaView style={styles.eneoSalama}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.mkusanyiko}>
            {/* Logo */}
            <Image
              source={require('../assets/shifaa.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.kichwa}>Jisajili Akaunti</Text>
            <Text style={styles.maelezo}>Jaza maelezo yako kuanza kutumia Shifaa</Text>

            {/* Form */}
            <View style={styles.fomu}>
              <View style={styles.kikundi}>
                <Text style={styles.lebo}>Jina Kamili*</Text>
                <TextInput
                  placeholder="Weka jina lako kamili"
                  style={styles.ingizo}
                  value={jinaKamili}
                  onChangeText={setJinaKamili}
                />
              </View>

              <View style={styles.kikundi}>
                <Text style={styles.lebo}>Nambari ya Simu</Text>
                <TextInput
                  placeholder="Weka nambari yako ya simu"
                  style={styles.ingizo}
                  keyboardType="phone-pad"
                  value={simu}
                  onChangeText={setSimu}
                />
              </View>

              <View style={styles.kikundi}>
                <Text style={styles.lebo}>Barua Pepe*</Text>
                <TextInput
                  placeholder="Weka barua pepe yako"
                  style={styles.ingizo}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={baruaPepe}
                  onChangeText={setBaruaPepe}
                />
              </View>

              <View style={styles.kikundi}>
                <Text style={styles.lebo}>Nenosiri*</Text>
                <View style={styles.ingizoNenoSiri}>
                  <TextInput
                    placeholder="Weka nenosiri"
                    style={{ flex: 1 }}
                    secureTextEntry={!inaonyeshaNenoSiri}
                    value={nenoSiri}
                    onChangeText={setNenoSiri}
                  />
                  <TouchableOpacity onPress={() => setInaonyeshaNenoSiri(!inaonyeshaNenoSiri)}>
                    <Icon 
                      name={inaonyeshaNenoSiri ? "eye-off" : "eye"} 
                      size={20} 
                      color="#888" 
                    />
                  </TouchableOpacity>
                </View>
                {nenoSiri.length > 0 && nenoSiri.length < 6 && (
                  <Text style={styles.onyo}>Nenosiri lazima liwe na herufi 6 au zaidi</Text>
                )}
              </View>

              <View style={styles.kikundi}>
                <Text style={styles.lebo}>Thibitisha Nenosiri*</Text>
                <View style={styles.ingizoNenoSiri}>
                  <TextInput
                    placeholder="Weka tena nenosiri"
                    style={{ flex: 1 }}
                    secureTextEntry={!inaonyeshaNenoSiri}
                    value={thibitishaNenoSiri}
                    onChangeText={setThibitishaNenoSiri}
                  />
                </View>
                {thibitishaNenoSiri.length > 0 && nenoSiri !== thibitishaNenoSiri && (
                  <Text style={styles.onyo}>Nenosiri hazifanani</Text>
                )}
              </View>

              <TouchableOpacity
                onPress={handleJisajili}
                style={styles.kitufe}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.maandishiYaKitufe}>
                    <Icon name="person-add" size={18} color="#fff" />  Jisajili
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/login")}
              style={styles.kiungo}
            >
              <Text style={styles.maandishiYaKiungo}>
                Tayari una akaunti? Ingia
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Jisajili;

const PRIMARY_COLOR = '#1E90FF';
const SECONDARY_COLOR = '#F8F9FA';

const styles = StyleSheet.create({
  eneoSalama: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mkusanyiko: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
  },
  logo: {
    width: 120,
    height: 60,
    alignSelf: 'center',
    marginBottom: 20,
  },
  kichwa: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  maelezo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  fomu: {
    marginBottom: 20,
  },
  kikundi: {
    marginBottom: 16,
  },
  lebo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  ingizo: {
    height: 50,
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  ingizoNenoSiri: {
    height: 50,
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  onyo: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
  },
  kitufe: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  maandishiYaKitufe: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  kiungo: {
    marginTop: 20,
    alignItems: 'center',
  },
  maandishiYaKiungo: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});