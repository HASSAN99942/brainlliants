import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../core/constants/colors';
import { useSpecialties } from '../../features/catalogue/hooks';
import { Specialty } from '../../features/catalogue/api';

export interface SpecialtySelection {
  /** Catalogue id, or null when the student typed their own under "Other". */
  specialtyId: string | null;
  specialtyName: string;
}

interface Props {
  subsystem?: string;
  exam?: string;
  onChange: (value: SpecialtySelection) => void;
}

type Row =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'option'; key: string; specialty: Specialty };

export function SpecialtyPicker({ subsystem, exam, onChange }: Props) {
  const { data: specialties, isLoading, isError } = useSpecialties(subsystem, exam);

  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [isOther, setIsOther] = useState(false);
  const [otherText, setOtherText] = useState('');

  // Kept in a ref so the reset effect below does not re-run when the parent
  // passes a fresh inline arrow on every render.
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // A specialty only means something for one subsystem+exam pair, so changing
  // either must clear the selection — otherwise a GCE A/L choice would survive
  // a switch to a francophone exam and be submitted against it.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setSelectedLabel(null);
    setIsOther(false);
    setOtherText('');
    onChangeRef.current({ specialtyId: null, specialtyName: '' });
  }, [subsystem, exam]);

  const disabled = !subsystem || !exam;

  // Flatten into header + option rows so a long list (HND has 27 across five
  // groups) reads as sections. Categories keep their catalogue order.
  const rows = React.useMemo<Row[]>(() => {
    const out: Row[] = [];
    let lastCategory: string | null = null;
    for (const s of specialties ?? []) {
      if (s.category && s.category !== lastCategory) {
        out.push({ kind: 'header', key: `h:${s.category}`, label: s.category });
        lastCategory = s.category;
      }
      out.push({ kind: 'option', key: s.id, specialty: s });
    }
    return out;
  }, [specialties]);

  const chooseSpecialty = (s: Specialty) => {
    setOpen(false);
    setIsOther(false);
    setOtherText('');
    setSelectedLabel(`${s.name} (${s.abbreviation})`);
    onChange({ specialtyId: s.id, specialtyName: s.name });
  };

  const chooseOther = () => {
    setOpen(false);
    setIsOther(true);
    setSelectedLabel('Other');
    // Name stays whatever is typed in the revealed field below.
    onChange({ specialtyId: null, specialtyName: otherText });
  };

  return (
    <View>
      <Text style={styles.label}>Specialty</Text>

      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={[styles.field, disabled && { opacity: 0.5 }]}
      >
        <Text
          style={{ flex: 1, fontSize: 15, color: selectedLabel ? Colors.textPrimary : Colors.textMuted }}
          numberOfLines={1}
        >
          {disabled
            ? 'Choose subsystem & exam first'
            : selectedLabel ?? 'Select your specialty'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
      </Pressable>

      {isOther ? (
        <TextInput
          value={otherText}
          onChangeText={(t) => {
            setOtherText(t);
            onChange({ specialtyId: null, specialtyName: t });
          }}
          autoFocus
          placeholder="Type your specialty"
          placeholderTextColor={Colors.textMuted}
          style={styles.otherInput}
        />
      ) : null}

      <Modal transparent visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Select specialty</Text>

          {isLoading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={rows}
              keyExtractor={(r) => r.key}
              style={{ maxHeight: 400 }}
              ListHeaderComponent={
                isError ? (
                  <Text style={styles.hint}>
                    Could not load the specialty list. You can still choose Other and type it.
                  </Text>
                ) : rows.length === 0 ? (
                  <Text style={styles.hint}>
                    No specialties are listed for this exam yet — choose Other and type yours.
                  </Text>
                ) : null
              }
              renderItem={({ item }) => {
                if (item.kind === 'header') {
                  return <Text style={styles.sectionHeader}>{item.label}</Text>;
                }
                const s = item.specialty;
                return (
                  <Pressable onPress={() => chooseSpecialty(s)} style={styles.option}>
                    <Text style={{ flex: 1, fontSize: 15, color: Colors.textPrimary }}>
                      {s.name} ({s.abbreviation})
                    </Text>
                    {s.is_general ? <Text style={styles.generalTag}>general</Text> : null}
                  </Pressable>
                );
              }}
              ListFooterComponent={
                <Pressable onPress={chooseOther} style={[styles.option, { borderBottomWidth: 0 }]}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.primaryMid }}>
                    Other (type my specialty)
                  </Text>
                </Pressable>
              }
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, marginTop: 14 },
  field: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: Colors.inputBorder,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  otherInput: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: Colors.inputBorder,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary, marginTop: 10,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32,
  },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 12 },
  hint: { fontSize: 13, color: Colors.textSecondary, paddingVertical: 12, lineHeight: 19 },
  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: Colors.primaryMid, letterSpacing: 0.4,
    textTransform: 'uppercase', paddingTop: 16, paddingBottom: 6,
  },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.inputBorder,
  },
  generalTag: {
    fontSize: 11, color: Colors.primaryMid, backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginLeft: 8,
  },
});
