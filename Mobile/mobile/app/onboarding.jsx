// app/onboarding.jsx
import React from "react";
import Onboarding from "react-native-onboarding-swiper";
import { Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function OnboardingScreen() {
  const router = useRouter();

  const handleDone = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/");
  };

  return (
    <Onboarding
      onSkip={handleDone}
      onDone={handleDone}
      pages={[
        {
          backgroundColor: "#fff",
        //   image: <Image source={require("../assets/slide1.png")} style={{ width: 200, height: 200 }} />,
          title: "Karibu!",
          subtitle: "Hii ni app ya afya inayokusaidia kugundua magonjwa mapema.",
        },
        {
          backgroundColor: "#fe6e58",
        //   image: <Image source={require("../assets/slide2.png")} style={{ width: 200, height: 200 }} />,
          title: "Dalili",
          subtitle: "Tuambie unavyojisikia na tutakusaidia kuelewa zaidi.",
        },
        {
          backgroundColor: "#999",
        //   image: <Image source={require("../assets/slide3.png")} style={{ width: 200, height: 200 }} />,
          title: "Ushauri",
          subtitle: "Utapata ushauri wa kitabibu kulingana na dalili zako.",
        },
      ]}
    />
  );
}
