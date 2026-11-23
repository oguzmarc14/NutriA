import {Text,View} from 'react-native'
import {styles} from '@/shared/ui/primitives'
import {portionLabel} from './portionLabel'
import {mealPreparationGroups} from './mealDisplay'
import type {Meal} from './models'

export function MealContent({meal}:{meal:Meal}){
  const groups=mealPreparationGroups(meal)
  return <View style={{gap:12}}>
    {!!meal.descripcion&&<Text style={styles.body}>Indicaciones: {meal.descripcion}</Text>}
    {!groups.length?<View style={{padding:13,backgroundColor:'#fff3e6',borderRadius:13}}>
      <Text style={[styles.body,{color:'#8c5b30',fontSize:13}]}>
        Esta comida se guardó sin ingredientes. Solicita al nutriólogo que la revise y complete.
      </Text>
    </View>:groups.map((group,index)=><View key={group.id||index}
      style={{gap:8,padding:12,backgroundColor:'#f1f7f2',borderRadius:16}}>
      <Text style={styles.cardTitle}>{group.tipo==='bebida'?'🥤 Bebida':'🍽️ Platillo'}: {group.nombre||'Sin nombre'}</Text>
      <Text style={[styles.body,{fontSize:12}]}>{group.alimentos.length} ingredientes registrados</Text>
      {group.alimentos.map((food,i)=><View key={i} style={{gap:4,backgroundColor:'white',padding:10,borderRadius:12}}>
        <Text style={{color:'#173f34',fontWeight:'700'}}>{food.nombre}</Text>
        <Text style={{color:'#267259',fontWeight:'700'}}>{portionLabel(food)}</Text>
        {!!food.notas&&<Text style={styles.body}>{food.notas}</Text>}
      </View>)}
    </View>)}
  </View>
}
