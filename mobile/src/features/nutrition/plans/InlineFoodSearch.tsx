import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, TextInput, View } from 'react-native'
import { useResource } from '@/shared/hooks/useResource'
import { Button, styles } from '@/shared/ui/primitives'
import type { CatalogFood } from './models'
type Catalog = { alimentos: CatalogFood[]; pagination: { pages: number; total: number } }
export function InlineFoodSearch({ onChoose, disabled }: { onChoose: (food: CatalogFood) => void; disabled: boolean }) {
  const [search, setSearch] = useState(''), [query, setQuery] = useState(''), [page, setPage] = useState(1)
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1) }, 300); return () => clearTimeout(timer) }, [search])
  const waiting = query !== search.trim()
  const resource = useResource<Catalog>(query && !waiting ? `/alimentos?q=${encodeURIComponent(query)}&page=${page}&limit=8` : null)
  return <View style={{ gap: 10 }}><Text style={styles.cardTitle}>Agregar alimentos</Text>
    <TextInput accessibilityLabel="Buscar alimento por nombre o grupo" placeholder="Buscar alimento: tortilla, pollo, aguacate…"
      style={styles.input} value={search} onChangeText={setSearch} editable={!disabled} autoCorrect={false} />
    {!!search.trim() && (waiting || resource.loading) && <ActivityIndicator accessibilityLabel="Buscando alimentos" />}
    {!!resource.error && <><Text style={styles.error}>{resource.error}</Text><Button label="Reintentar" onPress={resource.reload} /></>}
    {!waiting && resource.data && !resource.data.alimentos.length && <Text style={styles.body}>No encontramos alimentos con ese nombre.</Text>}
    {!waiting && resource.data?.alimentos.map(food => <View key={food._id} style={{ gap: 6, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#d3e0d7' }}>
      <Text style={styles.cardTitle}>{food.nombre}</Text><Text style={styles.body}>{food.porcion?.descripcion || `${food.porcion?.cantidad || 1} ${food.porcion?.unidad || 'porción'}`} · {food.nutrimentos.kcal} kcal</Text>
      <Button disabled={disabled} label="Agregar alimento" selected={false} onPress={() => onChoose(food)} />
    </View>)}
    {!waiting && resource.data && resource.data.pagination.pages > 1 && <View style={styles.row}>
      <Button expand selected={false} disabled={disabled || resource.loading || page === 1} label="Anterior" onPress={() => setPage(p => p - 1)} />
      <Button expand selected={false} disabled={disabled || resource.loading || page >= resource.data!.pagination.pages} label="Siguiente" onPress={() => setPage(p => p + 1)} />
    </View>}
  </View>
}
