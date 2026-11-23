import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { colors, styles } from '@/shared/ui/primitives'
import { measurementDay } from '@/features/nutrition/clinicalModels'

import { measurementDifferences, type ComparedMeasurement } from './MeasurementComparisonModel'
export function MeasurementComparison({ measurements }: { measurements: ComparedMeasurement[] }) {
  const sorted = [...measurements].sort((a, b) =>
    (b.fecha || b.createdAt || '').localeCompare(a.fecha || a.createdAt || '') ||
    (b.createdAt || '').localeCompare(a.createdAt || ''))
  const [beforeId, setBeforeId] = useState('')
  const [afterId, setAfterId] = useState('')
  const [choose, setChoose] = useState<'before' | 'after' | null>(null)
  const before = sorted.find(item => item._id === beforeId) || sorted[1]
  const after = sorted.find(item => item._id === afterId) || sorted[0]
  const comparable = before && after && before._id !== after._id
  const differences = comparable ? measurementDifferences(before, after) : []
  const dateLabel = (item?: ComparedMeasurement) =>
    item ? measurementDay(item.fecha || item.createdAt || '') || 'Sin fecha' : 'Seleccionar'

  return <View style={[styles.card, { borderWidth: 1, borderColor: '#c9e0d1' }]}>
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Ionicons name="git-compare-outline" size={23} color={colors.green} />
      <Text accessibilityRole="header" style={styles.cardTitle}>Comparar dos mediciones</Text>
    </View>
    <Text style={[styles.body, { fontSize: 13 }]}>
      Observa los cambios registrados sin calificarlos como buenos o malos.
    </Text>
    {sorted.length < 2 ? <Text style={styles.body}>
      Se necesitan al menos dos mediciones para comparar.
    </Text> : <>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {([['before', 'Medición anterior', before], ['after', 'Medición reciente', after]] as const)
          .map(([key, label, selected]) => <Pressable key={key} accessibilityRole="button"
            accessibilityState={{ expanded: choose === key }}
            onPress={() => setChoose(choose === key ? null : key)}
            style={{ flex: 1, minWidth: 125, padding: 12, borderWidth: 1,
              borderColor: choose === key ? colors.green : colors.border, borderRadius: 13,
              backgroundColor: '#f0f7f1', gap: 6 }}>
            <Text style={{ fontWeight: '700', color: colors.muted, fontSize: 12 }}>{label}</Text>
            <Text style={{ fontWeight: '800', color: colors.ink }}>{dateLabel(selected)}</Text>
            <Text style={{ color: colors.green, fontSize: 12 }}>{choose === key ? 'Ocultar' : 'Cambiar fecha'}</Text>
          </Pressable>)}
      </View>
      {choose && <View style={{ gap: 6 }}>
        {sorted.slice(0, 60).map(item => <Pressable key={item._id}
          accessibilityRole="button" accessibilityState={{ selected: item._id === (choose === 'before' ? before?._id : after?._id) }}
          onPress={() => {
            if (choose === 'before') setBeforeId(item._id)
            else setAfterId(item._id)
            setChoose(null)
          }}
          style={{ minHeight: 44, borderRadius: 10, padding: 10, backgroundColor: '#eef4ed',
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.ink }}>{dateLabel(item)} · {item.peso ?? '—'} kg</Text>
          <Ionicons name={item._id === (choose === 'before' ? before?._id : after?._id) ?
            'radio-button-on-outline' : 'radio-button-off-outline'} color={colors.green} size={20} />
        </Pressable>)}
      </View>}
      {!comparable ? <Text accessibilityRole="alert" style={styles.body}>
        Elige dos mediciones diferentes para obtener una comparación.
      </Text> : !differences.length ? <Text style={styles.body}>
        No hay medidas comparables entre estas fechas.
      </Text> : differences.map(item => <View key={item.key}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'space-between',
          borderTopWidth: 1, borderColor: '#dce9df', paddingVertical: 9 }}>
        <Text style={[styles.body, { flex: 1, fontSize: 14 }]}>{item.label}</Text>
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 13 }}>
            {item.previous} → {item.current} {item.unit}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            Cambio: {item.difference > 0 ? '+' : ''}{item.difference} {item.unit}
          </Text>
        </View>
      </View>)}
    </>}
  </View>
}
