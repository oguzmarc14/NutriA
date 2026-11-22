import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useResource } from '@/shared/hooks/useResource'
import { dietColors as c, dietStyles as s, DietAction, DietIconButton } from './dietUI'
import type { CatalogFood } from './models'
type Catalog = { alimentos: CatalogFood[]; pagination: { pages: number; total: number } }
export function InlineFoodSearch({ onChoose, disabled, addedIds = [] }: { onChoose: (food: CatalogFood) => void; disabled: boolean; addedIds?: string[] }) {
  const [search, setSearch] = useState(''), [query, setQuery] = useState(''), [page, setPage] = useState(1), [feedback, setFeedback] = useState('')
  useEffect(() => { setFeedback(''); const timer = setTimeout(() => { setQuery(search.trim()); setPage(1) }, 300); return () => clearTimeout(timer) }, [search])
  const waiting = query !== search.trim()
  const resource = useResource<Catalog>(query && !waiting ? `/alimentos?q=${encodeURIComponent(query)}&page=${page}&limit=8` : null)
  return <View style={{ gap: 9 }}>
    <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.label}>Buscar alimento</Text><Text style={s.caption}>Catálogo NutriA</Text></View>
    <View style={[s.row, s.input, { paddingVertical: 0, gap: 9 }]}><Ionicons name="search-outline" size={19} color="#749d88" />
      <TextInput accessibilityLabel="Buscar alimento por nombre o grupo" placeholder="Tortilla, pollo, aguacate…" placeholderTextColor={c.muted}
        style={{ flex: 1, minHeight: 48, color: c.ink, fontSize: 14 }} value={search} onChangeText={setSearch} editable={!disabled} autoCorrect={false} />
      {!!search && <DietIconButton icon="close" label="Limpiar búsqueda" disabled={disabled} onPress={() => setSearch('')} />}
    </View>
    {!!search.trim() && (waiting || resource.loading) && <ActivityIndicator accessibilityLabel="Buscando alimentos" color={c.green} />}
    {!!resource.error && <><Text accessibilityRole="alert" style={{ color: c.danger, fontSize: 13 }}>{resource.error}</Text><DietAction label="Reintentar" onPress={resource.reload} /></>}
    {!waiting && resource.data && <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: 15, overflow: 'hidden' }}>
      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 256 }}>
        {!resource.data.alimentos.length && <Text style={[s.caption, { padding: 14 }]}>No encontramos alimentos con ese nombre.</Text>}
        {resource.data.alimentos.map((food, index) => <View key={food._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderTopWidth: index ? 1 : 0, borderColor: '#e3ece6', backgroundColor: '#ffffff' }}>
          <View style={{ flex: 1, gap: 4 }}><Text style={s.label}>{food.nombre}</Text><Text style={s.caption}>{food.porcion?.descripcion || `${food.porcion?.cantidad || 1} ${food.porcion?.unidad || 'porción'}`} · {food.nutrimentos.kcal} kcal</Text>
            {addedIds.includes(food._id) && <Text style={{ color: c.green, fontSize: 11 }}>✓ En esta preparación</Text>}</View>
          <Pressable accessibilityRole="button" accessibilityLabel={'Agregar ' + food.nombre} disabled={disabled} onPress={() => { onChoose(food); setFeedback(food.nombre + ': porción añadida') }}
            style={({ pressed }) => [{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.selected, alignItems: 'center', justifyContent: 'center' }, { opacity: disabled ? 0.4 : pressed ? 0.65 : 1 }]}>
            <Ionicons name="add" size={23} color={c.green} /></Pressable>
        </View>)}
      </ScrollView>
      {resource.data.pagination.pages > 1 && <View style={{ padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: c.border }}>
        <DietIconButton icon="chevron-back" label="Página anterior de alimentos" disabled={disabled || page === 1} onPress={() => setPage(p => p - 1)} />
        <Text style={s.caption}>{page} / {resource.data.pagination.pages}</Text>
        <DietIconButton icon="chevron-forward" label="Página siguiente de alimentos" disabled={disabled || page >= resource.data.pagination.pages} onPress={() => setPage(p => p + 1)} />
      </View>}
    </View>}
    {!!feedback && <Text accessibilityLiveRegion="polite" style={{ color: c.green, fontSize: 12 }}>{feedback}</Text>}
  </View>
}
