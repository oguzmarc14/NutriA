import { useState } from 'react'
import { Text, View } from 'react-native'
import { Button, styles } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/FormField'
import { numberInput } from '../clinicalModels'
import { draftKey, type DraftFood } from './models'

const nutrition = [['kcal', 'Energía (kcal)'], ['proteina', 'Proteína (g)'], ['carbohidratos', 'Carbohidratos (g)'], ['grasas', 'Grasas (g)']] as const
export function CustomFoodForm({ onAdd, onCancel }: { onAdd: (food: DraftFood) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [portion, setPortion] = useState('')
  const [values, setValues] = useState<Record<string, string>>({ kcal: '', proteina: '', carbohidratos: '', grasas: '' })
  const [error, setError] = useState('')
  function add() {
    const nutrients = { kcal: numberInput(values.kcal), proteina: numberInput(values.proteina),
      carbohidratos: numberInput(values.carbohidratos), grasas: numberInput(values.grasas) }
    if (name.trim().length < 2 || !portion.trim() || Object.values(nutrients).some(value => !Number.isFinite(value) || value < 0)) {
      setError('Indica nombre, porción y los cuatro valores nutricionales válidos.'); return
    }
    onAdd({ key: draftKey(), tipo: 'personalizado', nombre: name.trim(), cantidad: 1, quantity: '1',
      porcion: { cantidad: 1, descripcion: portion.trim() }, nutrimentos: nutrients, notas: '' })
  }
  return <View style={{ gap: 10 }}>
    <Text style={styles.cardTitle}>Alimento personalizado</Text>
    <FormField label="Nombre del alimento" value={name} onChange={setName} />
    <FormField label="Descripción de una porción (por ejemplo, 1 taza)" value={portion} onChange={setPortion} />
    <Text style={styles.body}>Valores por una porción. Al cambiar la cantidad se multiplicarán estos valores.</Text>
    {nutrition.map(([key, label]) => <FormField key={key} numeric label={label} value={values[key]} onChange={value => setValues(previous => ({ ...previous, [key]: value }))} />)}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Button label="Agregar personalizado" onPress={add} />
    <Button selected={false} label="Cancelar" onPress={onCancel} />
  </View>
}
