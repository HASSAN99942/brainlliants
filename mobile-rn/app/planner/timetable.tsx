import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { AppButton } from '../../src/shared/components/AppButton';
import { plannerApi, TimetableEntry } from '../../src/features/planner/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'];
const COLORS = ['#7F77DD', '#E8A020', '#1D9E75', '#E24B4A'];

export default function Timetable() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sheet, setSheet] = useState<{ day: number; slot: number; existing?: TimetableEntry } | null>(null);

  useEffect(() => {
    plannerApi.getTimetable()
      .then(setEntries)
      .catch(() => { /* keep an empty grid */ })
      .finally(() => setLoading(false));
  }, []);

  const entryAt = (day: number, slot: number) => entries.find((e) => e.day === day && e.slot === slot);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const persisted = await plannerApi.saveTimetable(entries);
      setEntries(persisted);
      setDirty(false);
      setSaved(true);
    } catch { /* leave dirty so the user can retry */ }
    setSaving(false);
  };

  const applyEntry = (day: number, slot: number, subject: string, color: number) => {
    setEntries((prev) => [...prev.filter((e) => !(e.day === day && e.slot === slot)), { day, slot, subject, color }]);
    setDirty(true);
    setSaved(false);
  };

  const removeEntry = (day: number, slot: number) => {
    setEntries((prev) => prev.filter((e) => !(e.day === day && e.slot === slot)));
    setDirty(true);
    setSaved(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Timetable</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={save} disabled={saving} style={[styles.saveBtn, !dirty && { backgroundColor: Colors.actionDisabled }]}>
          {saving
            ? <ActivityIndicator size="small" color={Colors.actionText} />
            : <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.actionText }}>Save</Text>}
        </Pressable>
      </View>

      {saved ? (
        <View style={styles.savedBanner}>
          <Ionicons name="checkmark" size={16} color={Colors.success} />
          <Text style={{ fontSize: 13, color: Colors.success, marginLeft: 6 }}>Timetable saved</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 44 }} />
            {DAYS.map((d) => <Text key={d} style={styles.dayLabel}>{d}</Text>)}
          </View>
          {TIMES.map((time, slot) => (
            <View key={time} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.timeLabel}>{time}</Text>
              {DAYS.map((_, day) => {
                const e = entryAt(day, slot);
                return (
                  <Pressable key={day} onPress={() => setSheet({ day, slot, existing: e })} style={styles.cellWrap}>
                    <View style={[styles.cell, e ? { backgroundColor: COLORS[e.color % COLORS.length] } : styles.emptyCell]}>
                      {e ? <Text style={styles.cellText} numberOfLines={2}>{e.subject}</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
          <Text style={{ fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 16 }}>
            Tap a cell to add a session · tap a block to edit it
          </Text>
        </ScrollView>
      )}

      {sheet ? (
        <SessionSheet
          existing={sheet.existing}
          onClose={() => setSheet(null)}
          onSave={(subject, color) => { applyEntry(sheet.day, sheet.slot, subject, color); setSheet(null); }}
          onDelete={sheet.existing ? () => { removeEntry(sheet.day, sheet.slot); setSheet(null); } : undefined}
        />
      ) : null}
    </SafeAreaView>
  );
}

function SessionSheet({ existing, onClose, onSave, onDelete }: {
  existing?: TimetableEntry;
  onClose: () => void;
  onSave: (subject: string, color: number) => void;
  onDelete?: () => void;
}) {
  const [subject, setSubject] = useState(existing?.subject ?? '');
  const [color, setColor] = useState(existing?.color ?? 0);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary }}>
          {existing ? 'Edit session' : 'Add session'}
        </Text>
        <TextInput
          value={subject}
          onChangeText={setSubject}
          autoFocus
          placeholder="Subject (e.g. Maths)"
          placeholderTextColor={Colors.textMuted}
          style={styles.sheetInput}
        />
        <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 16 }}>Colour</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
          {COLORS.map((c, i) => (
            <Pressable
              key={i}
              onPress={() => setColor(i)}
              style={[styles.colorDot, { backgroundColor: c }, color === i && { borderWidth: 2, borderColor: Colors.textPrimary }]}
            >
              {color === i ? <Ionicons name="checkmark" size={20} color="#fff" /> : null}
            </Pressable>
          ))}
        </View>
        <AppButton
          label={existing ? 'Update' : 'Add'}
          disabled={!subject.trim()}
          onPress={() => { if (subject.trim()) onSave(subject.trim(), color); }}
          style={{ marginTop: 24 }}
        />
        {onDelete ? (
          <Pressable onPress={onDelete} style={{ alignItems: 'center', paddingVertical: 14 }}>
            <Text style={{ color: Colors.error, fontSize: 16, fontWeight: '500' }}>Delete</Text>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.action, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, minWidth: 72, alignItems: 'center' },
  savedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.successLight, paddingVertical: 8 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  timeLabel: { width: 44, fontSize: 11, color: Colors.textSecondary },
  cellWrap: { flex: 1, padding: 2 },
  cell: { height: 64, borderRadius: 8, alignItems: 'center', justifyContent: 'center', padding: 2 },
  emptyCell: { backgroundColor: '#fff', borderWidth: 0.5, borderColor: Colors.inputBorder },
  cellText: { fontSize: 11, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32 },
  sheetInput: { backgroundColor: Colors.bg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary, marginTop: 16 },
  colorDot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
