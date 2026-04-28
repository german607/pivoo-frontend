'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  StyleSheet, ActivityIndicator, Pressable, TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Sport, SportComplex } from '@pivoo/shared';
import { useApi } from '@/hooks/useApi';

// ─── helpers ────────────────────────────────────────────────────────────────

const TIME_SLOTS = Array.from({ length: 36 }, (_, i) => {
  const total = 6 * 60 + i * 30;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
});

const LEVELS = [
  { value: '', label: 'Sin nivel mínimo' },
  { value: 'BEGINNER', label: 'Principiante' },
  { value: 'INTERMEDIATE', label: 'Intermedio' },
  { value: 'ADVANCED', label: 'Avanzado' },
  { value: 'PROFESSIONAL', label: 'Profesional' },
];

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ─── sub-components ─────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

function SelectRow({
  label, value, placeholder, onPress, first, last,
}: {
  label: string; value: string; placeholder: string;
  onPress: () => void; first?: boolean; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.row, first && s.rowFirst, last && s.rowLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.rowRight}>
        <Text style={value ? s.rowValue : s.rowPlaceholder} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#c7c7cc" />
      </View>
    </TouchableOpacity>
  );
}

function Stepper({ label, value, min, max, onChange, first, last }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; first?: boolean; last?: boolean;
}) {
  return (
    <View style={[s.row, first && s.rowFirst, last && s.rowLast]}>
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.stepper}>
        <TouchableOpacity
          style={[s.stepBtn, value <= min && s.stepBtnDisabled]}
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Ionicons name="remove" size={18} color={value <= min ? '#c7c7cc' : '#0d9488'} />
        </TouchableOpacity>
        <Text style={s.stepValue}>{value}</Text>
        <TouchableOpacity
          style={[s.stepBtn, value >= max && s.stepBtnDisabled]}
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Ionicons name="add" size={18} color={value >= max ? '#c7c7cc' : '#0d9488'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

type PickerOption = { value: string; label: string };

function BottomSheet({
  visible, title, options, selected, onSelect, onClose,
}: {
  visible: boolean; title: string; options: PickerOption[];
  selected: string; onSelect: (v: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.sheetDone}>Listo</Text>
          </TouchableOpacity>
        </View>
        <Picker selectedValue={selected} onValueChange={onSelect} style={s.sheetPicker}>
          {options.map((o) => <Picker.Item key={o.value} label={o.label} value={o.value} />)}
        </Picker>
      </View>
    </Modal>
  );
}

// ─── date picker ────────────────────────────────────────────────────────────

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function DateSheet({ visible, date, onChange, onClose }: {
  visible: boolean; date: string; onChange: (d: string) => void; onClose: () => void;
}) {
  const now = new Date();
  const [year, setYear] = useState(date ? parseInt(date.split('-')[0]) : now.getFullYear());
  const [month, setMonth] = useState(date ? parseInt(date.split('-')[1]) - 1 : now.getMonth());
  const [day, setDay] = useState(date ? parseInt(date.split('-')[2]) : now.getDate());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
  const months = MONTHS.map((m, i) => ({ value: String(i), label: m }));
  const years = Array.from({ length: 3 }, (_, i) => ({ value: String(now.getFullYear() + i), label: String(now.getFullYear() + i) }));

  const confirm = () => {
    const d = String(Math.min(day, daysInMonth)).padStart(2, '0');
    const m = String(month + 1).padStart(2, '0');
    onChange(`${year}-${m}-${d}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>Selecciona fecha</Text>
          <TouchableOpacity onPress={confirm}>
            <Text style={s.sheetDone}>Listo</Text>
          </TouchableOpacity>
        </View>
        <View style={s.dateRow}>
          <View style={s.dateCol}>
            <Picker selectedValue={String(day)} onValueChange={(v) => setDay(parseInt(v))} style={s.datePicker}>
              {days.map((d) => <Picker.Item key={d.value} label={d.label} value={d.value} />)}
            </Picker>
          </View>
          <View style={[s.dateCol, { flex: 1.4 }]}>
            <Picker selectedValue={String(month)} onValueChange={(v) => setMonth(parseInt(v))} style={s.datePicker}>
              {months.map((m) => <Picker.Item key={m.value} label={m.label} value={m.value} />)}
            </Picker>
          </View>
          <View style={s.dateCol}>
            <Picker selectedValue={String(year)} onValueChange={(v) => setYear(parseInt(v))} style={s.datePicker}>
              {years.map((y) => <Picker.Item key={y.value} label={y.label} value={y.value} />)}
            </Picker>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── main screen ────────────────────────────────────────────────────────────

type Sheet = 'sport' | 'complex' | 'court' | 'time' | 'level' | 'date' | null;

export default function NewMatchScreen() {
  const { get, post } = useApi();
  const [sports, setSports] = useState<Sport[]>([]);
  const [complexes, setComplexes] = useState<SportComplex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState<Sheet>(null);

  const [sportId, setSportId] = useState('');
  const [complexId, setComplexId] = useState('');
  const [courtId, setCourtId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [requiredLevel, setRequiredLevel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [s, c] = await Promise.all([
          get<Sport[]>('/api/v1/sports', { baseUrl: process.env.EXPO_PUBLIC_SPORTS_API_URL }),
          get<SportComplex[]>('/api/v1/complexes', { baseUrl: process.env.EXPO_PUBLIC_COMPLEXES_API_URL }),
        ]);
        setSports(s || []);
        setComplexes(c || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const selectedSport = sports.find((s) => s.id === sportId);
  const selectedComplex = complexes.find((c) => c.id === complexId);
  const courts = selectedComplex?.courts || [];
  const selectedCourt = courts.find((c) => c.id === courtId);

  const sportOptions: PickerOption[] = [
    { value: '', label: 'Selecciona un deporte' },
    ...sports.map((s) => ({ value: s.id, label: s.name })),
  ];
  const complexOptions: PickerOption[] = [
    { value: '', label: 'Selecciona un complejo' },
    ...complexes.map((c) => ({ value: c.id, label: `${c.name} · ${c.city}` })),
  ];
  const courtOptions: PickerOption[] = [
    { value: '', label: 'Sin pista específica' },
    ...courts.map((c) => ({ value: c.id, label: `${c.name} (${c.indoor ? 'Interior' : 'Exterior'})` })),
  ];
  const timeOptions: PickerOption[] = [
    { value: '', label: 'Elige un horario' },
    ...TIME_SLOTS.map((t) => ({ value: t, label: t })),
  ];

  const handleSubmit = async () => {
    if (!sportId || !complexId || !date || !time) {
      setError('Completa deporte, complejo, fecha y hora');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await post('/api/v1/matches', {
        sportId,
        complexId,
        courtId: courtId || null,
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
        minPlayers,
        maxPlayers,
        requiredLevel: requiredLevel || null,
        description: description || null,
      }, { baseUrl: process.env.EXPO_PUBLIC_MATCHES_API_URL });
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear el partido');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#0d9488" /></View>;
  }

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* ── Dónde ── */}
        <SectionHeader title="DÓNDE" />
        <View style={s.group}>
          <SelectRow
            label="Deporte"
            value={selectedSport?.name || ''}
            placeholder="Selecciona"
            onPress={() => setSheet('sport')}
            first last={courts.length === 0 && !complexId}
          />
          <SelectRow
            label="Complejo"
            value={selectedComplex ? `${selectedComplex.name} · ${selectedComplex.city}` : ''}
            placeholder="Selecciona"
            onPress={() => setSheet('complex')}
            last={courts.length === 0}
          />
          {courts.length > 0 && (
            <SelectRow
              label="Pista"
              value={selectedCourt ? `${selectedCourt.name} (${selectedCourt.indoor ? 'Interior' : 'Exterior'})` : ''}
              placeholder="Opcional"
              onPress={() => setSheet('court')}
              last
            />
          )}
        </View>

        {/* ── Cuándo ── */}
        <SectionHeader title="CUÁNDO" />
        <View style={s.group}>
          <SelectRow
            label="Fecha"
            value={formatDate(date)}
            placeholder="Selecciona"
            onPress={() => setSheet('date')}
            first
          />
          <SelectRow
            label="Hora"
            value={time}
            placeholder="Selecciona"
            onPress={() => setSheet('time')}
            last
          />
        </View>

        {/* ── Jugadores ── */}
        <SectionHeader title="JUGADORES" />
        <View style={s.group}>
          <Stepper label="Mínimo" value={minPlayers} min={2} max={maxPlayers} onChange={setMinPlayers} first />
          <Stepper label="Máximo" value={maxPlayers} min={minPlayers} max={20} onChange={setMaxPlayers} last />
        </View>

        {/* ── Extras ── */}
        <SectionHeader title="EXTRAS" />
        <View style={s.group}>
          <SelectRow
            label="Nivel mínimo"
            value={LEVELS.find((l) => l.value === requiredLevel)?.label || ''}
            placeholder="Sin nivel mínimo"
            onPress={() => setSheet('level')}
            first last
          />
        </View>

        <View style={[s.group, { marginTop: 8 }]}>
          <TextInput
            style={s.textarea}
            value={description}
            onChangeText={setDescription}
            placeholder="Notas o detalles del partido (opcional)"
            placeholderTextColor="#c7c7cc"
            multiline
            numberOfLines={4}
          />
        </View>

        {error ? (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#dc2626" />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[s.submitBtn, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={s.submitText}>Crear partido</Text>
              </>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Bottom sheets ── */}
      <BottomSheet visible={sheet === 'sport'} title="Deporte" options={sportOptions}
        selected={sportId} onSelect={setSportId} onClose={() => setSheet(null)} />
      <BottomSheet visible={sheet === 'complex'} title="Complejo" options={complexOptions}
        selected={complexId} onSelect={(v) => { setComplexId(v); setCourtId(''); }} onClose={() => setSheet(null)} />
      <BottomSheet visible={sheet === 'court'} title="Pista" options={courtOptions}
        selected={courtId} onSelect={setCourtId} onClose={() => setSheet(null)} />
      <BottomSheet visible={sheet === 'time'} title="Hora" options={timeOptions}
        selected={time} onSelect={setTime} onClose={() => setSheet(null)} />
      <BottomSheet visible={sheet === 'level'} title="Nivel requerido" options={LEVELS}
        selected={requiredLevel} onSelect={setRequiredLevel} onClose={() => setSheet(null)} />
      <DateSheet visible={sheet === 'date'} date={date} onChange={setDate} onClose={() => setSheet(null)} />
    </>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  content: { paddingTop: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
    marginLeft: 20,
    marginBottom: 6,
    marginTop: 4,
  },
  group: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5ea',
    minHeight: 50,
  },
  rowFirst: { borderTopWidth: 0 },
  rowLast: {},
  rowLabel: { flex: 1, fontSize: 16, color: '#111827' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '55%' },
  rowValue: { fontSize: 16, color: '#0d9488', fontWeight: '500', textAlign: 'right' },
  rowPlaceholder: { fontSize: 16, color: '#c7c7cc', textAlign: 'right' },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { backgroundColor: '#f9fafb' },
  stepValue: { width: 36, textAlign: 'center', fontSize: 17, fontWeight: '600', color: '#111827' },

  textarea: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { flex: 1, color: '#dc2626', fontSize: 14 },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0d9488',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 16,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // bottom sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sheetDone: { fontSize: 16, fontWeight: '600', color: '#0d9488' },
  sheetPicker: { marginHorizontal: 8 },

  // date sheet
  dateRow: { flexDirection: 'row', paddingHorizontal: 8 },
  dateCol: { flex: 1 },
  datePicker: {},
});
