import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PRIMARY_COLOR = '#4E8CFF';

const UnknownSymptomScreen = ({ route, navigation }) => {
  const { symptom } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Icon name="help-outline" size={50} color={PRIMARY_COLOR} />
        <Text style={styles.title}>Symptom Details</Text>
        <Text style={styles.symptomText}>{symptom || 'No symptom provided'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backButtonText}> Back to Chat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 10 },
  symptomText: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    padding: 10,
    borderRadius: 5,
  },
  backButtonText: { color: '#fff', marginLeft: 5 },
});

export default UnknownSymptomScreen;
