import React from "react";
import {
  View,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import doctorWelcome from "../assets/animation/doctor_welcome.json";
import symptoms from "../assets/animation/symptoms.json";
import onlineDoctor from "../assets/animation/online_doctor.json";
import pharmacy from "../assets/animation/pharmacy.json";

const { width, height } = Dimensions.get("window");
const primaryColor = "#007BFF";

export default function OnboardingScreen() {
  const router = useRouter();

  const handleDone = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/");
  };

  const renderLottie = (source) => (
    <View style={styles.lottieContainer}>
      <LottieView source={source} autoPlay loop style={styles.lottie} />
    </View>
  );

  const renderLogo = () => (
    <View style={styles.logoContainer}>
      <Text style={styles.logoText}>Shifaa</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Onboarding
        onSkip={handleDone}
        onDone={handleDone}
        containerStyles={styles.onboardingContainer}
        controlStatusBar={false}
        bottomBarHighlight={false}
        bottomBarHeight={120}
        showNext={false}
        showSkip={false}
        DotComponent={({ selected }) => (
          <View
            style={[
              styles.dot,
              selected ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        )}
        bottomBar={({ currentPage, goToPage }) => (
          <View style={styles.bottomBar}>
            {renderLogo()}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleDone}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Ruka</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.doneButton,
                  currentPage === 3 && styles.lastDoneButton,
                ]}
                onPress={() => {
                  if (currentPage === 3) {
                    handleDone();
                  } else {
                    goToPage(currentPage + 1);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.doneButtonText}>
                  {currentPage === 3 ? "Anza" : "Endelea"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        pages={[
          {
            backgroundColor: "#fff",
            image: renderLottie(doctorWelcome),
            title: "Karibu Shifaa!",
            subtitle:
              "Huduma bora ya afya kwenye mkononi mwako. Tunaweza kukusaidia kugundua magonjwa mapema.",
            titleStyles: styles.title,
            subTitleStyles: styles.subtitle,
          },
          {
            backgroundColor: "#F8FBFF",
            image: renderLottie(symptoms),
            title: "Angalia Dalili",
            subtitle:
              "Eleza jinsi unavyojisikia na mfumo wetu utakusaidia kuelewa zaidi kuhusu hali yako.",
            titleStyles: styles.title,
            subTitleStyles: styles.subtitle,
          },
          {
            backgroundColor: "#F0F7FF",
            image: renderLottie(onlineDoctor),
            title: "Pata Ushauri wa Kitaalamu",
            subtitle:
              "Pata mapendekezo kutoka kwa wataalamu wa afya kulingana na dalili zako.",
            titleStyles: styles.title,
            subTitleStyles: styles.subtitle,
          },
          {
            backgroundColor: "#E6F2FF",
            image: renderLottie(pharmacy),
            title: "Dawa Zinazohitajika",
            subtitle:
              "Tunakusaidia kupata dawa sahihi na maduka ya karibu yanayozipatia.",
            titleStyles: styles.title,
            subTitleStyles: styles.subtitle,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  onboardingContainer: {
    paddingBottom: 40,
  },
  lottieContainer: {
    width: width * 0.9,
    height: height * 0.4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  title: {
    color: primaryColor,
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  subtitle: {
    color: "#555",
    fontSize: 16,
    paddingHorizontal: 30,
    textAlign: "center",
    lineHeight: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: primaryColor,
    width: 20,
  },
  inactiveDot: {
    backgroundColor: "#B3D7FF",
  },
  bottomBar: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "android" ? 40 : 30,
    height: 140,
  },
  logoContainer: {
    marginBottom: 15,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: primaryColor,
    letterSpacing: 1.5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 15,
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderColor: primaryColor,
    borderRadius: 30,
    backgroundColor: "white",
  },
  skipButtonText: {
    color: primaryColor,
    fontSize: 16,
    fontWeight: "600",
  },
  doneButton: {
    backgroundColor: primaryColor,
    paddingHorizontal: 35,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 140,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  lastDoneButton: {
    width: "100%",
  },
});
