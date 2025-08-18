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
  Dimensions,
  ScrollView,
  SafeAreaView,
  StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const Ingia = () => {
  const { login, isLoading } = useContext(AuthContext);
  const router = useRouter();

  const [baruaPepe, setBaruaPepe] = useState("");
  const [nenoSiri, setNenoSiri] = useState("");
  const [inaonyeshaNenoSiri, setInaonyeshaNenoSiri] = useState(false);

  const handleIngia = async () => {
    Keyboard.dismiss();
    if (!baruaPepe || !nenoSiri) {
      Alert.alert("Makosa", "Tafadhali jaza barua pepe na nenosiri.");
      return;
    }

    try {
      await login(baruaPepe, nenoSiri);
      router.replace("/");
    } catch (error) {
      Alert.alert("Imeshindikana", "Barua pepe au nenosiri si sahihi.");
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
        <ScrollView 
          contentContainerStyle={[
            styles.mkusanyiko,
            { minHeight: height - (Platform.OS === 'ios' ? 100 : 60) }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Image 
            source={require('../assets/shifaa.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.kichwa}>
            <Text style={styles.kichwaKichwa}>Karibu Tena</Text>
            <Text style={styles.maelezo}>Ingia kuendelea kutumia Shifaa</Text>
          </View>

          {/* Fomu ya kuingia */}
          <View style={styles.fomu}>
            <View style={styles.kikundi}>
              <Text style={styles.lebo}>Barua Pepe*</Text>
              <TextInput
                placeholder="Weka barua pepe yako"
                style={styles.ingizo}
                autoCapitalize="none"
                keyboardType="email-address"
                value={baruaPepe}
                onChangeText={setBaruaPepe}
                returnKeyType="next"
                onSubmitEditing={() => this.nenoSiriInput.focus()}
              />
            </View>

            <View style={styles.kikundi}>
              <Text style={styles.lebo}>Nenosiri*</Text>
              <View style={styles.ingizoNenoSiri}>
                <TextInput
                  placeholder="Weka nenosiri lako"
                  style={{ flex: 1 }}
                  secureTextEntry={!inaonyeshaNenoSiri}
                  value={nenoSiri}
                  onChangeText={setNenoSiri}
                  ref={(input) => { this.nenoSiriInput = input; }}
                  returnKeyType="done"
                  onSubmitEditing={handleIngia}
                />
                <TouchableOpacity 
                  onPress={() => setInaonyeshaNenoSiri(!inaonyeshaNenoSiri)}
                  style={styles.kitufeChaJicho}
                >
                  <Icon 
                    name={inaonyeshaNenoSiri ? "eye-off" : "eye"} 
                    size={20} 
                    color="#888" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleIngia}
              style={styles.kitufe}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.maandishiYaKitufe}>
                  <Icon name="log-in" size={18} color="#fff" />  Ingia
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/sahau-nenosiri")}
              style={styles.sahauNenosiri}
            >
              <Text style={styles.maandishiYaSahauNenosiri}>Umesahau nenosiri?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mwisho}>
            <Text style={styles.maandishiYaMwisho}>Huna akaunti?</Text>
            <TouchableOpacity
              onPress={() => router.push("/register")}
            >
              <Text style={styles.maandishiYaJisajili}> Jisajili</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Ingia;

const PRIMARY_COLOR = '#1E90FF';
const SECONDARY_COLOR = '#F8F9FA';

const styles = StyleSheet.create({
  eneoSalama: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mkusanyiko: {
    flexGrow: 1,
    padding: 25,
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    alignSelf: 'center',
    marginBottom: 10,
  },
  kichwa: {
    alignItems: 'center',
    marginBottom: 30,
  },
  kichwaKichwa: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 5,
  },
  maelezo: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  fomu: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  kikundi: {
    marginBottom: 20,
  },
  lebo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  ingizo: {
    height: 50,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ingizoNenoSiri: {
    height: 50,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
  },
  kitufeChaJicho: {
    padding: 10,
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
  sahauNenosiri: {
    alignSelf: 'flex-end',
    marginTop: 15,
  },
  maandishiYaSahauNenosiri: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: '500',
  },
  mwisho: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  maandishiYaMwisho: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  maandishiYaJisajili: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: '600',
  },
});