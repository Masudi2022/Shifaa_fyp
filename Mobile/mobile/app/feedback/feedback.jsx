import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "@env";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const FeedbackForm = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleRatingPress = (value) => {
    setRating(value);
  };

  const handleSubmit = async () => {
    if (!title || !message || rating === 0) {
      Alert.alert("Incomplete Form", "Please fill all fields and select a rating.");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      await axios.post(`${BASE_URL}/feedback/`, {
        user: user?.email,
        title,
        message,
        rating,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      Alert.alert("Thank You!", "Your feedback has been submitted successfully.");
      setTitle("");
      setMessage("");
      setRating(0);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#007BFF" barStyle="light-content" />
        
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Share Your Feedback</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Form Title */}
            <View style={styles.formHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={32} color="#007BFF" />
              <Text style={styles.formTitle}>We Value Your Opinion</Text>
              <Text style={styles.formSubtitle}>Help us improve your experience</Text>
            </View>

            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title*</Text>
              <TextInput
                style={styles.input}
                placeholder="Brief summary of your feedback"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
              />
            </View>

            {/* Message Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Detailed Feedback*</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Tell us about your experience..."
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
                blurOnSubmit={true}
              />
            </View>

            {/* Rating */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Rating*</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <TouchableOpacity
                    key={value}
                    onPress={() => handleRatingPress(value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={value <= rating ? "star" : "star-outline"}
                      size={36}
                      color={value <= rating ? "#FFC107" : "#ccc"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingText}>
                {rating > 0 ? `You rated us ${rating} star${rating > 1 ? 's' : ''}` : "Tap to rate"}
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <Ionicons name="time-outline" size={20} color="#fff" />
              ) : (
                <Ionicons name="paper-plane-outline" size={20} color="#fff" />
              )}
              <Text style={styles.buttonText}>
                {loading ? "Submitting..." : "Submit Feedback"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#007BFF",
    paddingVertical: 15,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 15,
  },
  backButton: {
    padding: 5,
  },
  headerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  formHeader: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#444",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#333",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  multilineInput: {
    height: 150,
    textAlignVertical: "top",
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  ratingText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginTop: 5,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: "#6c9ed6",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
});

export default FeedbackForm;