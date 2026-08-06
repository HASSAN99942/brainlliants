import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { AppButton } from '../../src/shared/components/AppButton';
import { useMyEnrolments } from '../../src/features/enrolment/hooks';
import { Enrolment, EnrolmentStatus } from '../../src/features/enrolment/api';
import { useFeatureGuard } from '../../src/core/config/useFeatureGuard';

const STATUS_STYLE: Record<EnrolmentStatus, { bg: string; fg: string; label: string }> = {
  approved: { bg: Colors.successLight, fg: Colors.success, label: 'Approved' },
  pending: { bg: '#FFF3E0', fg: '#B26A00', label: 'Pending review' },
  rejected: { bg: Colors.errorLight, fg: Colors.error, label: 'Rejected' },
};

export default function MySchools() {
  const enabled = useFeatureGuard('schoolModule');
  const { data, isLoading, refetch } = useMyEnrolments();

  // Coming back from the search screen should show a freshly created request.
  useFocusEffect(React.useCallback(() => { refetch(); }, [refetch]));

  if (!enabled) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>My Schools</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="school-outline" size={56} color={Colors.primaryLight} />
              <Text style={{ fontSize: 15, color: Colors.textSecondary, marginTop: 12 }}>
                You haven&apos;t joined a school yet
              </Text>
              <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: 'center' }}>
                Join your school to access its private papers and notes
              </Text>
            </View>
          }
          renderItem={({ item }: { item: Enrolment }) => {
            const st = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
            return (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary, flex: 1 }}>
                    {item.school.name}
                  </Text>
                  <View style={[styles.statusChip, { backgroundColor: st.bg }]}>
                    <Text style={{ fontSize: 11, fontWeight: '500', color: st.fg }}>{st.label}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 6 }}>
                  {[item.school.town, item.school.region].filter(Boolean).join(' · ')}
                </Text>
                <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 4 }}>
                  Matricule: {item.matricule}
                </Text>
                {item.status === 'approved' ? (
                  <Text style={{ fontSize: 12, color: Colors.success, marginTop: 8 }}>
                    You can now see this school&apos;s private papers and notes in Resources.
                  </Text>
                ) : null}
                {item.status === 'rejected' ? (
                  <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 8 }}>
                    Check your matricule with the school, then request again.
                  </Text>
                ) : null}
              </View>
            );
          }}
          ListFooterComponent={
            <AppButton
              label="Find a school"
              onPress={() => router.push('/profile/school-search')}
              style={{ marginTop: 12 }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  card: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5,
    borderColor: Colors.inputBorder, padding: 16, marginBottom: 10,
  },
  statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: 8 },
});
