import { useState } from 'react'
import { Text, View } from 'react-native'
import { useResource } from '@/shared/hooks/useResource'
import { Button, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
import type { CatalogFood } from './models'
type VerifiedFood = CatalogFood & { equivalentes: number; fuentes: { tipoDato: string; nombre: string; edicion?: string }[] }
export function EquivalentPanel({ patient, onChoose, disabled }: { patient: string; onChoose: (food: CatalogFood) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false), [group, setGroup] = useState('')
  const resource = useResource<{ alimentosVerificados: VerifiedFood[]; advertencia: string }>(open ? '/asistente-equivalentes/' + patient : null)
  const foods = resource.data?.alimentosVerificados || []
  return <View style={{ gap: 10 }}><Button selected={false} label={open ? 'Ocultar asistente de equivalentes' : 'Asistente de equivalentes y alimentos'} onPress={() => setOpen(!open)} />
    {open && <><ListState {...resource} />
      {resource.data && <><Text style={styles.body}>{foods.length} alimentos con equivalencia verificable disponibles.</Text>
        <View style={styles.row}><Button selected={!group} label="Todos" onPress={() => setGroup('')} />
          {[...new Set(foods.map(f => f.grupo).filter((g): g is string => !!g))].map(g => <Button key={g} selected={group === g} label={g} onPress={() => setGroup(g)} />)}</View>
        {foods.filter(f => !group || f.grupo === group).map(food => <View key={food._id} style={{ gap: 8 }}><Text style={styles.cardTitle}>{food.nombre}</Text>
          <Text style={styles.body}>{food.grupo} · {food.equivalentes} equivalente(s) por porción</Text>
          <Text style={styles.body}>Fuente: {food.fuentes.filter(f => f.tipoDato === 'equivalencia').map(f => f.nombre + (f.edicion ? ' · ' + f.edicion : '')).join(', ')}</Text>
          <Button disabled={disabled} selected={false} label="Añadir a esta preparación" onPress={() => onChoose(food)} /></View>)}
        {!foods.length && <Text style={styles.body}>Todavía no hay equivalencias con fuente y revisión verificadas en el catálogo. Puedes usar el editor manual.</Text>}
        <Text style={styles.body}>{resource.data.advertencia}</Text></>}
    </>}
  </View>
}
