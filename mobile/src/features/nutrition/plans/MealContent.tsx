import { Text, View } from 'react-native'
import { styles } from '@/shared/ui/primitives'
import { portionLabel } from './portionLabel'
import type { Meal } from './models'
export function MealContent({ meal }: { meal: Meal }) {
  const preparations = meal.preparaciones?.length ? meal.preparaciones : [{ id: '', nombre: meal.platillo || 'Platillo sin nombre', tipo: 'platillo' as const }]
  return <View style={{ gap: 12 }}>
    {!!meal.descripcion && <Text style={styles.body}>Indicaciones: {meal.descripcion}</Text>}
    {preparations.map((prep, index) => {
      const foods = meal.alimentos.filter(food => food.preparacionId === prep.id || index === 0 && !preparations.some(p => p.id === food.preparacionId))
      return <View key={prep.id || index} style={{ gap: 8, padding: 12, backgroundColor: '#f1f7f2', borderRadius: 16 }}>
        <Text style={styles.cardTitle}>{prep.nombre || (prep.tipo === 'bebida' ? 'Bebida' : 'Platillo') + ' ' + (index + 1)}</Text>
        {!foods.length && <Text style={styles.body}>Sin alimentos registrados.</Text>}
        {foods.map((food, i) => <View key={i} style={{ gap: 4, backgroundColor: 'white', padding: 10, borderRadius: 12 }}>
          <Text style={{ color: '#173f34', fontWeight: '700' }}>{food.nombre}</Text>
          <Text style={{ color: '#267259', fontWeight: '700' }}>{portionLabel(food)}</Text>
          {!!food.notas && <Text style={styles.body}>{food.notas}</Text>}
        </View>)}
      </View>
    })}
  </View>
}
