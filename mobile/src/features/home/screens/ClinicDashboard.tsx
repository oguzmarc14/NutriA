import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { Button, colors, Page, styles } from '@/shared/ui/primitives'
import { Shortcut } from '@/shared/ui/Shortcut'

type Summary = { totalPacientes: number; nuevosMes: number; nuevosAnterior: number; bajaron: number;
  conHistorial: number; sinHistorialComparable: number; meses: { etiqueta: string; cantidad: number }[] }
export default function ClinicDashboard() {
  const { session } = useAuth()
  const clinic = useResource<{ clinica: { nombre?: string; nombreProfesional?: string; logo?: string } }>('/clinica')
  const stats = useResource<{ resumen: Summary }>('/clinica/resumen')
  const summary = stats.data?.resumen
  const brand = clinic.data?.clinica
  const narrow = useWindowDimensions().width < 350
  const tiles = summary ? [
    { label: 'Total de pacientes', value: summary.totalPacientes, detail: 'Registrados', icon: 'people-outline' },
    { label: 'Nuevos este mes', value: summary.nuevosMes, detail: 'Mes anterior: ' + summary.nuevosAnterior, icon: 'person-add-outline' },
    { label: 'Bajaron de peso', value: summary.bajaron, detail: 'De ' + summary.conHistorial + ' con historial comparable', icon: 'trending-down-outline' },
    { label: 'Sin historial comparable', value: summary.sinHistorialComparable, detail: 'Menos de 2 mediciones de peso', icon: 'calendar-outline' },
  ] as const : []
  const max = Math.max(1, ...(summary?.meses.map(m => m.cantidad) || []))
  return <Page>
    <View style={{ gap: 4 }}><Text style={s.eyebrow}>MI CONSULTORIO</Text>
      <Text accessibilityRole="header" style={s.title}>Resumen de la clínica</Text>
      <Text style={s.caption}>Indicadores calculados con tus registros</Text></View>
    <View style={[s.panel, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
      {brand?.logo ? <Image source={{ uri: brand.logo }} accessibilityLabel="Logo del consultorio" style={{ width: 62, height: 62, borderRadius: 18 }} resizeMode="contain" /> :
        <View style={s.logo}><Ionicons name="leaf-outline" size={30} color={colors.green} /></View>}
      <View style={{ flex: 1, gap: 6 }}><Text style={s.eyebrow}>MI CONSULTORIO</Text>
        <Text style={{ color: colors.ink, fontSize: 23, fontWeight: '800' }}>{brand?.nombre || 'Mi clínica NutriA'}</Text>
        <Text style={s.caption}>Bienvenido, {brand?.nombreProfesional || session?.user.name}</Text></View>
    </View>
    {!!clinic.error && <Text accessibilityRole="alert" style={styles.error}>{clinic.error}</Text>}
    {stats.loading && <ActivityIndicator accessibilityLabel="Cargando indicadores" color={colors.green} />}
    {!!stats.error && <View style={s.panel}><Text accessibilityRole="alert" style={styles.error}>{stats.error}</Text>
      <Button label="Reintentar indicadores" onPress={stats.reload} /></View>}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{tiles.map(tile =>
      <View key={tile.label} style={[s.tile, { flexBasis: narrow ? '100%' : '46%' }]}>
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
          <Text style={[s.caption, { flex: 1 }]}>{tile.label}</Text><Ionicons name={tile.icon} size={20} color={colors.green} /></View>
        <Text style={s.number}>{tile.value}</Text><Text style={s.caption}>{tile.detail}</Text>
      </View>)}</View>
    {summary && <View style={s.panel}><Text style={styles.cardTitle}>Crecimiento de pacientes</Text>
      <Text style={s.caption}>Nuevos registros durante los últimos 6 meses</Text>
      <View accessibilityLabel={summary.meses.map(m => m.etiqueta + ': ' + m.cantidad).join(', ')} style={s.chart}>
        {summary.meses.map((m, i) => <View key={i} style={s.column}><Text style={s.caption}>{m.cantidad}</Text>
          <View style={{ height: Math.max(3, m.cantidad / max * 110), width: '74%', backgroundColor: '#81b99b', borderTopLeftRadius: 9, borderTopRightRadius: 9 }} />
          <Text style={s.caption}>{m.etiqueta}</Text></View>)}
      </View><Text style={s.caption}>El cambio de peso compara el primer y el último registro válido de cada paciente.</Text>
    </View>}
    <Text style={styles.cardTitle}>Tu consulta, en un toque</Text>
    <Shortcut primary icon="calendar-outline" title="Crear cita" detail="Elige un paciente y un horario" onPress={() => router.push('/agendar')} />
    <Shortcut icon="clipboard-outline" title="Expediente clínico" detail="Consulta y actualiza su información" onPress={() => router.push({ pathname: '/elegir-paciente', params: { intent: 'record' } })} />
    <Shortcut icon="nutrition-outline" title="Crear dieta" detail="Continúa con el paciente elegido" onPress={() => router.push({ pathname: '/elegir-paciente', params: { intent: 'create-plan' } })} />
    <Button label="Ver todos los apartados" selected={false} onPress={() => router.navigate('/mas')} />
  </Page>
}
const s = StyleSheet.create({
  title: { fontSize: 27, fontWeight: '800', color: colors.ink },
  eyebrow: { color: colors.green, fontSize: 10, letterSpacing: 1.6, fontWeight: '800' },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  panel: { padding: 20, backgroundColor: '#f9fcfa', borderRadius: 26, gap: 10, borderColor: '#d4e3d8', borderWidth: 1 },
  logo: { width: 60, height: 60, borderRadius: 18, backgroundColor: '#e5f2e9', alignItems: 'center', justifyContent: 'center' },
  tile: { flexGrow: 1, padding: 17, borderRadius: 22, gap: 10, backgroundColor: '#f9fcfa', borderColor: '#d4e3d8', borderWidth: 1 },
  number: { fontSize: 34, fontWeight: '800', color: colors.ink },
  chart: { height: 160, flexDirection: 'row', alignItems: 'flex-end', gap: 5, marginVertical: 14 },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
})
