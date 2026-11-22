import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { useList } from '@/shared/hooks/useList'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
type Recipe = { _id: string; titulo: string; descripcion: string; estado: string; porciones: number;
  autor?: { name?: string }; ingredientes: { nombre: string; cantidad: number; unidad: string }[]; instrucciones: string[] }
export default function Community() {
  const [own, setOwn] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const list = useList<Recipe>(own ? '/community/mias' : '/community')
  const results = list.rows.filter(item => item.titulo.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  return <Page><Text style={styles.title}>NutriA Community</Text>
    <Text style={styles.body}>Recetas compartidas por la comunidad.</Text>
    <View style={styles.row}><Button expand label="Publicadas" selected={!own} onPress={() => { setOwn(false); setExpanded(null) }} />
      <Button expand label="Mis recetas" selected={own} onPress={() => { setOwn(true); setExpanded(null) }} /></View>
    <TextInput accessibilityLabel="Buscar recetas" style={styles.input} placeholder="Buscar receta" value={search} onChangeText={setSearch} />
    {list.loading || list.error || !list.rows.length ? <ListState {...list} empty="Todavía no hay recetas en esta sección." /> :
      !results.length ? <Text style={styles.body}>No encontramos recetas con ese nombre.</Text> : results.map(item => <View key={item._id} style={styles.card}>
        <Text style={styles.cardTitle}>{item.titulo}</Text><Text style={styles.body}>{item.descripcion}</Text>
        <Text style={styles.body}>{item.porciones} porciones · {own ? item.estado : item.autor?.name || 'Comunidad'}</Text>
        {expanded === item._id && <><Text style={styles.cardTitle}>Ingredientes</Text>
          {item.ingredientes.map((part, i) => <Text key={i} style={styles.body}>{part.cantidad} {part.unidad} de {part.nombre}</Text>)}
          <Text style={styles.cardTitle}>Preparación</Text>{item.instrucciones.map((step, i) => <Text key={i} style={styles.body}>{i + 1}. {step}</Text>)}</>}
        <Button selected={false} label={expanded === item._id ? 'Ocultar receta' : 'Ver receta'} onPress={() => setExpanded(expanded === item._id ? null : item._id)} />
      </View>)}
    <Text style={styles.body}>La creación y publicación de recetas continúa disponible en la web.</Text>
  </Page>
}
