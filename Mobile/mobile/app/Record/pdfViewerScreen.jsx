// PDFViewerScreen.jsx
import React from "react";
import { View, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import Pdf from "react-native-pdf";

export default function PDFViewerScreen({ route }) {
  const { url } = route.params;

  return (
    <View style={styles.container}>
      <Pdf
        source={{ uri: url, cache: true }}
        style={styles.pdf}
        onLoadComplete={(pages) => console.log(`Number of pages: ${pages}`)}
        onError={(error) => console.log(error)}
        activityIndicator={<ActivityIndicator size="large" color="#007BFF" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  pdf: {
    flex: 1,
    width: Dimensions.get("window").width,
  },
});
