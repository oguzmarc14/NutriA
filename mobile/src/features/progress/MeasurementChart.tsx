import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { chartCoordinates, chartPoints, metrics, type ChartMeasurement, type Metric } from './chartModel'
import { colors, styles } from '@/shared/ui/primitives'
const dateLabel = (value: number) => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'UTC' }).format(value)
export function MeasurementChart({ measurements }: { measurements: ChartMeasurement[] }) {
  const [metric, setMetric] = useState<Metric>('peso')
  const [width, setWidth] = useState(240)
  const [selected, setSelected] = useState<string | null>(null)
  const points = chartPoints(measurements, metric)
  const coordinates = chartCoordinates(points, Math.max(1, width - 24), 120)
  const info = metrics.find(item => item.key === metric)!
  const active = points.find(p => p.id === selected) || points[points.length - 1]
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.cardTitle}>Evolución de mediciones</Text>
    <View style={styles.row}>{metrics.map(item => <Pressable key={item.key} accessibilityRole="button"
      accessibilityState={{ selected: item.key === metric }} onPress={() => { setMetric(item.key); setSelected(null) }}
      style={{ padding: 12, minHeight: 44, borderRadius: 14, backgroundColor: item.key === metric ? colors.green : colors.background }}>
      <Text style={{ color: item.key === metric ? colors.white : colors.green, fontWeight: '600' }}>{item.label}</Text>
    </Pressable>)}</View>
    {!points.length ? <Text style={styles.body}>Aún no hay registros válidos de {info.label.toLowerCase()} para graficar.</Text> : <>
      <Text style={styles.title}>{active.value.toFixed(1)} {info.unit}</Text>
      <Text style={styles.body}>{dateLabel(active.date)} · toca un punto para consultar su valor</Text>
      <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ height: 166, marginVertical: 8 }}>
        {[0, 60, 120].map(y => <View key={y} style={{ position: 'absolute', left: 12, right: 12, top: y + 16, height: 1, backgroundColor: colors.border }} />)}
        {coordinates.slice(1).map((p, i) => {
          const previous = coordinates[i], dx = p.x - previous.x, dy = p.y - previous.y
          const length = Math.hypot(dx, dy)
          return <View key={'line-' + p.id} pointerEvents="none" style={{ position: 'absolute',
            left: (previous.x + p.x) / 2 + 12 - length / 2, top: (previous.y + p.y) / 2 + 15,
            width: length, height: 2, backgroundColor: colors.green, transform: [{ rotate: Math.atan2(dy, dx) + 'rad' }] }} />
        })}
        {coordinates.map(p => <Pressable key={p.id} hitSlop={10} accessibilityRole="button"
          accessibilityLabel={`${dateLabel(p.date)}: ${p.value} ${info.unit}`} onPress={() => setSelected(p.id)}
          style={{ position: 'absolute', left: p.x, top: p.y + 4, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green, borderWidth: 2, borderColor: colors.white }} />
        </Pressable>)}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <Text style={styles.body}>{dateLabel(points[0].date)}</Text><Text style={styles.body}>{dateLabel(points[points.length - 1].date)}</Text>
      </View>
      <Text style={styles.body}>{points.length === 1 ? 'Con una segunda medición podrás comparar la evolución.' : `${points.length} mediciones · mínimo ${Math.min(...points.map(p => p.value)).toFixed(1)} / máximo ${Math.max(...points.map(p => p.value)).toFixed(1)} ${info.unit}`}</Text>
    </>}
  </View>
}
