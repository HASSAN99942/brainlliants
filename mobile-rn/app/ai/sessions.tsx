import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { summaryCache } from '../../src/features/ai/offline';

export default function Sessions() {
  const sessions = summaryCache.list();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={Colors.textPrimary} /></Pressable>
        <Text style={styles.title}>Past sessions</Text>
      </View>
      {sessions.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="time-outline" size={56} color={Colors.primaryLight} />
          <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.textSecondary, marginTop: 14 }}>No past sessions</Text>
        </View>
      ) : (
        <FlatList
          data={sessions} keyExtractor={(s) => s.session_id} contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.iconBox}><Ionicons name="document-text-outline" size={20} color={Colors.primaryMid} /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.textPrimary }}>{item.file_name}</Text>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 3 }}>{item.saved_at.slice(0, 10)}</Text>
              </View>
              <View style={styles.offlineChip}><Text style={{ fontSize: 11, color: Colors.success, fontWeight: '500' }}>Offline</Text></View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: Colors.inputBorder, padding: 16, marginBottom: 10 },
  iconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  offlineChip: { backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
});
