import { Text, View } from 'react-native'
import { useList } from '@/shared/hooks/useList'
import { Page, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
import type { PendingRecipe } from '@/features/admin/models'
export default function Moderation() {
  const list = useList<PendingRecipe>('/community/moderacion/pendientes')
  return <Page><Text style={styles.title}>Moderación de recetas</Text>
    <Text style={styles.body}>Publicaciones que esperan revisión. La aprobación y el rechazo se realizan desde la web.</Text>
    <ListState {...list} empty={!list.rows.length ? 'No hay recetas pendientes.' : undefined} />
    {list.rows.map(recipe => <View key={recipe._id} style={styles.card}><Text style={styles.cardTitle}>{recipe.titulo}</Text>
      <Text style={styles.body}>{recipe.autor?.name || 'Autor no disponible'}</Text><Text style={styles.body}>{recipe.descripcion}</Text>
      {recipe.ingredientes.map((part, i) => <Text key={i} style={styles.body}>{part.cantidad} {part.unidad} · {part.nombre}</Text>)}
      {recipe.instrucciones.map((step, i) => <Text key={i} style={styles.body}>{i + 1}. {step}</Text>)}
    </View>)}
  </Page>
}
