import { useRef } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, Pressable } from 'react-native'
import { usePatientWork } from '@/features/patients/PatientWorkProvider'
import { FormField } from '@/shared/ui/FormField'
import { AppDialog } from '@/shared/ui/AppDialog'
import { request } from '@/core/api/client'
import { recipePayload, type RecipeDraft } from '@/features/clinic/recipeModel'
import { useAuth } from '@/features/auth/AuthProvider'
import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { useList } from '@/shared/hooks/useList'
import { Button, Page, styles } from '@/shared/ui/primitives'
import { ListState } from '@/shared/ui/ListState'
import { MealContent } from '@/features/nutrition/plans/MealContent'
import { exportPlan } from '@/features/nutrition/plans/exportPlan'
import type { Plan } from '@/features/nutrition/plans/models'
type Recipe = { _id: string; titulo: string; descripcion: string; estado: string; porciones: number;
  autor?: { name?: string }; ingredientes: { nombre: string; cantidad: number; unidad: string }[]; instrucciones: string[] }
type SavedDiet = { _id: string; nombre: string; fechaGuardado: string; comidasCount: number; metaEnergiaKcal?: number | null }
type SavedDietDetail = SavedDiet & { plan: Plan }

export default function Community() {
  const { session } = useAuth()
  const { tab } = useLocalSearchParams<{ tab?: string }>()
  const { active } = usePatientWork()
  const canCreate = session?.user.role === 'nutritionist'
  const [section, setSection] = useState<'publicadas' | 'recetas' | 'dietas'>(tab === 'dietas' && canCreate ? 'dietas' : 'publicadas')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const blank = ():RecipeDraft=>({title:'',description:'',portions:'1',ingredients:[{name:'',amount:'1',unit:''}],steps:'',tags:''})
  const [form,setForm] = useState(blank), [creating,setCreating] = useState(false), [busy,setBusy] = useState(false), [error,setError] = useState(''), [publish,setPublish] = useState<Recipe|null>(null)
  const lock=useRef(false)
  const [dietPreview, setDietPreview] = useState<SavedDietDetail | null>(null)
  const [openingDiet, setOpeningDiet] = useState(false)
  async function openDiet(item: SavedDiet) {
    if (!session || lock.current) return
    lock.current = true
    setOpeningDiet(true)
    try {
      setDietPreview(await request<SavedDietDetail>('/community/mis-dietas/' + item._id, { token: session.token }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos abrir la dieta.')
    } finally {
      lock.current = false
      setOpeningDiet(false)
    }
  }
  async function shareDiet(item: SavedDietDetail) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    try {
      await exportPlan({ ...item.plan, nombre: item.nombre }, '')
    } catch (cause) {
      setDietPreview(null)
      setError(cause instanceof Error ? cause.message : 'No pudimos exportar la dieta.')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  async function create() {
    if(!session || lock.current)return
    let body:ReturnType<typeof recipePayload>
    try{body=recipePayload(form)}catch(cause){setError(cause instanceof Error?cause.message:'Revisa la receta.');return}
    lock.current=true;setBusy(true);setError('')
    try{await request('/community',{token:session.token,body});setCreating(false);setForm(blank());setSection('recetas');list.reload()}
    catch(cause){setError(cause instanceof Error?cause.message:'No se pudo crear la receta.')}
    finally{lock.current=false;setBusy(false)}
  }
  async function submitPublication() {
    if(!session || !publish || lock.current)return
    lock.current=true;setBusy(true);setError('')
    try{await request('/community/'+publish._id+'/publicar',{token:session.token,method:'POST'});setPublish(null);list.reload()}
    catch(cause){setError(cause instanceof Error?cause.message:'No se pudo enviar la publicación.')}
    finally{lock.current=false;setBusy(false)}
  }
  const list = useList<Recipe | SavedDiet>(section === 'dietas' && canCreate ?
    '/community/mis-dietas' : section === 'recetas' && canCreate ? '/community/mias' : '/community')
  const query = search.trim().toLocaleLowerCase()
  const results = list.rows
    .filter((item): item is Recipe => 'titulo' in item)
    .filter(item => item.titulo.toLocaleLowerCase().includes(query))
  const savedDiets = list.rows
    .filter((item): item is SavedDiet => 'fechaGuardado' in item)
    .filter(item => item.nombre.toLocaleLowerCase().includes(query))

  async function deleteDiet(item: SavedDiet) {
    if (!session) return
    try {
      await request('/community/mis-dietas/' + item._id, { token: session.token, method: 'DELETE' })
      list.reload()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos eliminar la dieta.') }
  }
  function useDiet(item: SavedDiet) {
    if (!active) {
      Alert.alert('Elige un paciente', 'Selecciona primero un paciente para reutilizar la dieta.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir a pacientes', onPress: () => router.push('/pacientes') },
      ])
      return
    }
    router.push({ pathname: '/dieta', params: { patient: active.id, template: item._id } })
  }
  return <Page><Text style={styles.title}>NutriA Community</Text>
    <Text style={styles.body}>Recetas compartidas por la comunidad.</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
      <Button label="Publicadas" selected={section === 'publicadas'}
        onPress={() => { setSection('publicadas'); setExpanded(null) }} />
      {canCreate && <Button label="Mis recetas" selected={section === 'recetas'}
        onPress={() => { setSection('recetas'); setExpanded(null) }} />}
      {canCreate && <Button label="Mis dietas" selected={section === 'dietas'}
        onPress={() => { setSection('dietas'); setExpanded(null) }} />}
    </View>
    {canCreate && <Button label="Crear receta" disabled={busy} onPress={()=>setCreating(true)}/>}
    <TextInput accessibilityLabel={section === 'dietas' ? 'Buscar dietas' : 'Buscar recetas'}
      style={styles.input} placeholder={section === 'dietas' ? 'Buscar dieta guardada' : 'Buscar receta'}
      value={search} onChangeText={setSearch} />
    {section === 'dietas' && <Text style={styles.body}>
      Biblioteca privada: estas dietas son copias reutilizables y no modifican el plan original del paciente.
    </Text>}
    {list.loading || list.error || !list.rows.length ?
      <ListState {...list} empty={section === 'dietas' ? 'Todavía no has guardado dietas reutilizables.' : 'Todavía no hay recetas en esta sección.'} /> :
      section === 'dietas' ? (!savedDiets.length ? <Text style={styles.body}>No encontramos dietas con ese nombre.</Text> :
        savedDiets.map(item => <View key={item._id} style={[styles.card, { gap: 9 }]}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <Text style={styles.body}>Guardada: {new Intl.DateTimeFormat('es-MX', {
            dateStyle: 'medium' }).format(new Date(item.fechaGuardado))}</Text>
          <Text style={styles.body}>{item.comidasCount} comidas
            {item.metaEnergiaKcal ? ' · ' + item.metaEnergiaKcal + ' kcal objetivo' : ''}</Text>
          <Button label={openingDiet ? 'Cargando dieta…' : 'Ver dieta'} selected={false}
            disabled={openingDiet} onPress={() => void openDiet(item)} />
          <Button label="Usar con paciente" onPress={() => useDiet(item)} />
          <Pressable accessibilityRole="button" onPress={() => Alert.alert('Eliminar dieta guardada',
            'Se eliminará solo la copia privada «' + item.nombre + '», no el plan de ningún paciente.', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar copia', style: 'destructive', onPress: () => void deleteDiet(item) },
            ])} style={{ alignSelf: 'center', padding: 8 }}>
            <Text style={{ color: '#a14a48', fontSize: 13, fontWeight: '700' }}>Eliminar copia</Text>
          </Pressable>
        </View>))
      : !results.length ? <Text style={styles.body}>No encontramos recetas con ese nombre.</Text> : results.map(item => <View key={item._id} style={styles.card}>
        <Text style={styles.cardTitle}>{item.titulo}</Text><Text style={styles.body}>{item.descripcion}</Text>
        <Text style={styles.body}>{item.porciones} porciones · {section === 'recetas' ? item.estado : item.autor?.name || 'Comunidad'}</Text>
        {expanded === item._id && <><Text style={styles.cardTitle}>Ingredientes</Text>
          {item.ingredientes.map((part, i) => <Text key={i} style={styles.body}>{part.cantidad} {part.unidad} de {part.nombre}</Text>)}
          <Text style={styles.cardTitle}>Preparación</Text>{item.instrucciones.map((step, i) => <Text key={i} style={styles.body}>{i + 1}. {step}</Text>)}</>}
        {section === 'recetas' && ['privada','rechazada'].includes(item.estado) && <Button label="Enviar a publicación" disabled={busy} onPress={()=>setPublish(item)}/>}
        <Button selected={false} label={expanded === item._id ? 'Ocultar receta' : 'Ver receta'} onPress={() => setExpanded(expanded === item._id ? null : item._id)} />
      </View>)}
    <AppDialog visible={!!dietPreview} title={dietPreview?.nombre || 'Dieta guardada'} onClose={() => setDietPreview(null)}>
      {dietPreview && <>
        {!!dietPreview.plan?.objetivo && <Text style={styles.body}>{dietPreview.plan.objetivo}</Text>}
        {dietPreview.plan?.comidas?.length ? dietPreview.plan.comidas.map((meal, index) =>
          <View key={meal._id || index} style={styles.card}>
            <Text style={styles.cardTitle}>{[meal.nombre, meal.hora].filter(Boolean).join(' · ')}</Text>
            <MealContent meal={meal} />
          </View>
        ) : <Text style={styles.body}>Esta dieta no tiene comidas registradas.</Text>}
        <Button label="PDF / compartir" selected={false} disabled={busy || !dietPreview.plan?.comidas?.length}
          onPress={() => void shareDiet(dietPreview)} />
      </>}
      <Button label="Cerrar dieta" disabled={busy} onPress={() => setDietPreview(null)} />
    </AppDialog>
    <AppDialog visible={creating} title="Nueva receta" message="Se guardará como privada. Después puedes enviarla a publicación." onClose={()=>{if(!busy)setCreating(false)}}>
      <FormField label="Título *" value={form.title} disabled={busy} onChange={title=>setForm({...form,title})}/><FormField label="Descripción" multiline value={form.description} disabled={busy} onChange={description=>setForm({...form,description})}/><FormField label="Porciones *" numeric value={form.portions} disabled={busy} onChange={portions=>setForm({...form,portions})}/>
      <Text style={styles.cardTitle}>Ingredientes</Text>
      {form.ingredients.map((item,index)=><View key={index} style={styles.card}>{(['name','amount','unit'] as const).map(key=><FormField key={key} label={key==='name'?'Ingrediente':key==='amount'?'Cantidad':'Unidad (taza, pieza, g…)'} numeric={key==='amount'} value={item[key]} disabled={busy} onChange={value=>setForm({...form,ingredients:form.ingredients.map((part,i)=>i===index?{...part,[key]:value}:part)})}/>)}<Button label="Quitar ingrediente" selected={false} disabled={busy||form.ingredients.length===1} onPress={()=>setForm({...form,ingredients:form.ingredients.filter((_,i)=>i!==index)})}/></View>)}
      <Button label="Agregar ingrediente" selected={false} disabled={busy||form.ingredients.length>=100} onPress={()=>setForm({...form,ingredients:[...form.ingredients,{name:'',amount:'1',unit:''}]})}/>
      <FormField label="Preparación: un paso por línea *" multiline value={form.steps} disabled={busy} onChange={steps=>setForm({...form,steps})}/><FormField label="Etiquetas separadas por comas (opcional)" value={form.tags} disabled={busy} onChange={tags=>setForm({...form,tags})}/>
      <Button label={busy?'Guardando…':'Guardar receta privada'} disabled={busy} onPress={()=>void create()}/><Button label="Cancelar" selected={false} disabled={busy} onPress={()=>setCreating(false)}/>
    </AppDialog>
    <AppDialog visible={!!publish} title="Enviar a publicación" message={'Se enviará «'+(publish?.titulo||'')+'» a la comunidad. La publicación está sujeta a las reglas de revisión de tu cuenta.'} onClose={()=>{if(!busy)setPublish(null)}}><Button label={busy?'Enviando…':'Confirmar envío'} disabled={busy} onPress={()=>void submitPublication()}/><Button label="Cancelar" selected={false} disabled={busy} onPress={()=>setPublish(null)}/></AppDialog>
    <AppDialog visible={!!error} title="Revisa la receta" message={error} onClose={()=>setError('')}/>

  </Page>
}
