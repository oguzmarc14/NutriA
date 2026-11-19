import { useState } from 'react'
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useResource } from '@/shared/hooks/useResource'
import { Button, colors, styles } from '@/shared/ui/primitives'
import type { CatalogFood } from './models'

type Catalog = { alimentos: CatalogFood[]; pagination: { page: number; pages: number; total: number } }
export function CatalogPicker({ onChoose, onClose }: { onChoose: (food: CatalogFood) => void; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const resource = useResource<Catalog>(`/alimentos?q=${encodeURIComponent(query)}&page=${page}&limit=30`)
  function apply() {
    if (query === search.trim() && page === 1) resource.reload()
    setQuery(search.trim()); setPage(1)
  }
  return <Modal transparent animationType="slide" onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0006' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar catálogo" onPress={onClose} style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={['bottom', 'left', 'right']} accessibilityViewIsModal
        style={{ height: '85%', maxWidth: 640, width: '100%', alignSelf: 'center', padding: 20, gap: 12, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.background }}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Catálogo de alimentos</Text>
        <TextInput style={styles.input} accessibilityLabel="Buscar alimento" placeholder="Nombre o grupo"
          value={search} onChangeText={setSearch} returnKeyType="search" onSubmitEditing={apply} />
        <View style={styles.row}>
          <Button expand label="Buscar" onPress={apply} />
          <Button expand selected={false} label="Cerrar" onPress={onClose} />
        </View>
        {resource.loading && <ActivityIndicator accessibilityLabel="Buscando alimentos" />}
        {!!resource.error && <><Text accessibilityRole="alert" style={styles.error}>{resource.error}</Text><Button label="Reintentar" onPress={resource.reload} /></>}
        <FlatList data={resource.data?.alimentos || []} keyExtractor={food => food._id} keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
          ListEmptyComponent={!resource.loading && !resource.error ? <Text style={styles.body}>No encontramos alimentos con esa búsqueda.</Text> : null}
          renderItem={({ item }) => <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.nombre}</Text>
            <Text style={styles.body}>{item.porcion?.descripcion || `${item.porcion?.cantidad ?? 1} ${item.porcion?.unidad || 'porción'}`} · {item.nutrimentos.kcal} kcal</Text>
            {!!item.grupo && <Text style={styles.body}>{item.grupo}</Text>}
            <Button label="Agregar alimento" onPress={() => onChoose(item)} />
          </View>} />
        {resource.data && <>
          <Text style={styles.body}>Página {page} de {Math.max(1, resource.data.pagination.pages)} · {resource.data.pagination.total} alimentos</Text>
          <View style={styles.row}>
            <Button expand selected={false} disabled={resource.loading || page <= 1} label="Anterior" onPress={() => setPage(value => value - 1)} />
            <Button expand selected={false} disabled={resource.loading || page >= resource.data!.pagination.pages} label="Siguiente" onPress={() => setPage(value => value + 1)} />
          </View>
        </>}
      </SafeAreaView>
    </View>
  </Modal>
}
