import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { useResource } from '@/shared/hooks/useResource'
import { Button, colors, styles } from '@/shared/ui/primitives'
import type { CatalogFood } from './models'

type Catalog = { alimentos: CatalogFood[]; pagination: { pages: number; total: number } }

export function InlineFoodSearch({ onChoose, disabled }: { onChoose: (food: CatalogFood) => void; disabled: boolean }) {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [search])
  const waiting = query !== search.trim()
  const resource = useResource<Catalog>(query && !waiting ? `/alimentos?q=${encodeURIComponent(query)}&page=${page}&limit=8` : null)

  return <View style={{ gap: 8 }}>
    <Text style={styles.cardTitle}>Buscar alimento</Text>
    <TextInput accessibilityLabel="Buscar alimento por nombre o grupo"
      placeholder="Tortilla, pollo, aguacate…" style={styles.input}
      value={search} onChangeText={setSearch} editable={!disabled} autoCorrect={false} />
    {!!search.trim() && (waiting || resource.loading) && <ActivityIndicator accessibilityLabel="Buscando alimentos" />}
    {!!resource.error && <><Text style={styles.error}>{resource.error}</Text><Button label="Reintentar" onPress={resource.reload} /></>}
    {!waiting && resource.data && !resource.data.alimentos.length &&
      <Text style={styles.body}>No encontramos alimentos con ese nombre.</Text>}
    {!waiting && resource.data?.alimentos.map(food =>
      <View key={food._id} style={{
        flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text numberOfLines={2} style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>{food.nombre}</Text>
          <Text numberOfLines={2} style={{ color: colors.muted, fontSize: 12 }}>
            {food.porcion?.descripcion || `${food.porcion?.cantidad || 1} ${food.porcion?.unidad || 'porción'}`} · {food.nutrimentos.kcal} kcal
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Agregar ${food.nombre} a la preparación`}
          accessibilityState={{ disabled }} disabled={disabled} onPress={() => onChoose(food)}
          hitSlop={4} style={({ pressed }) => ({
            width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
            backgroundColor: colors.green, opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
          })}>
          <Ionicons name="add" size={24} color={colors.white} />
        </Pressable>
      </View>)}
    {!waiting && resource.data && resource.data.pagination.pages > 1 &&
      <View style={styles.row}>
        <Button expand selected={false} disabled={disabled || resource.loading || page === 1}
          label="Anterior" onPress={() => setPage(p => p - 1)} />
        <Button expand selected={false} disabled={disabled || resource.loading || page >= resource.data!.pagination.pages}
          label="Siguiente" onPress={() => setPage(p => p + 1)} />
      </View>}
  </View>
}
