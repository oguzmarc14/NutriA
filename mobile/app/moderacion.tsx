import { useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { useList } from '@/shared/hooks/useList'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
import { FormField } from '@/shared/ui/FormField'
import { AppDialog } from '@/shared/ui/AppDialog'
import { useAuth } from '@/features/auth/AuthProvider'
import { request } from '@/core/api/client'
import type { PendingRecipe } from '@/features/admin/models'
export default function Moderation() {
  const { session } = useAuth(), list = useList<PendingRecipe>('/community/moderacion/pendientes')
  const [selected,setSelected] = useState<{recipe:PendingRecipe;approve:boolean}|null>(null)
  const [reason,setReason] = useState(''),[error,setError] = useState(''),[busy,setBusy] = useState(false)
  const lock=useRef(false)
  async function moderate() {
    if (!selected || !session || lock.current) return
    if ((!selected.approve && !reason.trim()) || reason.trim().length>500) {setError('Indica el motivo del rechazo, con un máximo de 500 caracteres.');return}
    lock.current=true;setBusy(true);setError('')
    try {await request('/community/'+selected.recipe._id+'/moderar',{token:session.token,method:'PATCH',body:{aprobar:selected.approve,motivo:reason.trim()}});setSelected(null);setReason('');list.reload()}
    catch(cause){setError(cause instanceof Error?cause.message:'No se pudo revisar la receta.')}
    finally{lock.current=false;setBusy(false)}
  }
  return <Page><Text style={styles.title}>Moderación de recetas</Text><Text style={styles.body}>Revisa ingredientes y preparación antes de publicar.</Text><ListState {...list} empty={!list.rows.length?'No hay recetas pendientes.':undefined}/>
    {list.rows.map(recipe=><View key={recipe._id} style={styles.card}><Text style={styles.cardTitle}>{recipe.titulo}</Text><Text style={styles.body}>{recipe.autor?.name||'Autor no disponible'}</Text><Text style={styles.body}>{recipe.descripcion}</Text>
      {recipe.ingredientes.map((part,i)=><Text key={i} style={styles.body}>{part.cantidad} {part.unidad} · {part.nombre}</Text>)}{recipe.instrucciones.map((step,i)=><Text key={i} style={styles.body}>{i+1}. {step}</Text>)}
      <View style={styles.row}><Button expand label="Aprobar publicación" disabled={busy} onPress={()=>{setReason('');setSelected({recipe,approve:true})}}/><Button expand selected={false} label="Rechazar" disabled={busy} onPress={()=>{setReason('');setSelected({recipe,approve:false})}}/></View>
    </View>)}
    <AppDialog visible={!!selected} title={selected?.approve?'Aprobar receta':'Rechazar receta'} message={selected?.recipe.titulo} onClose={()=>{if(!busy)setSelected(null)}}>
      <FormField label={selected?.approve?'Comentario de revisión (opcional)':'Motivo del rechazo *'} multiline value={reason} disabled={busy} onChange={setReason}/><Button label={busy?'Guardando…':'Confirmar revisión'} disabled={busy} onPress={()=>void moderate()}/><Button label="Cancelar" selected={false} disabled={busy} onPress={()=>setSelected(null)}/>
    </AppDialog><AppDialog visible={!!error} title="Revisa la publicación" message={error} onClose={()=>setError('')}/>
  </Page>
}
