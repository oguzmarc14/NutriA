import {useState} from 'react'
import {router,useLocalSearchParams} from 'expo-router'
import {Alert,Text,View} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import {request} from '@/core/api/client'
import {useAuth} from '@/features/auth/AuthProvider'
import {useResource} from '@/shared/hooks/useResource'
import {useUnsavedChanges} from '@/shared/hooks/useUnsavedChanges'
import {Button,Page,colors,styles} from '@/shared/ui/primitives'
import {FormField} from '@/shared/ui/FormField'
import {ListState} from '@/shared/ui/ListState'
import {DietDisclosure} from '../plans/dietUI'
import {RecordSectionFields,YesNoDetail} from '../RecordSectionFields'
import {clinicalActive,clinicalFields,clinicalForm,clinicalUpdate} from '../clinicalRecordModel'

type Patient={name:string;sex?:'male'|'female'|'other'|'unspecified';birthDate?:string|null;phone?:string;email?:string}
type LastMeasurement={peso:number;estatura:number;imc?:number;edad?:number;nivelActividadFisica?:number;fecha?:string;
  grasaCorporal?:number|null;masaMuscular?:number|null;grasaVisceral?:number|null;masaOsea?:number|null}
type RecordData={paciente:Patient;ultimaMedicion:LastMeasurement|null;expediente:Record<string,unknown>|null}
const gender:Record<string,string>={male:'Masculino',female:'Femenino',other:'Otro',unspecified:'Sin especificar'}
const activity:Record<number,string>={1:'Sedentario',2:'Ligero',3:'Moderado',4:'Activo',5:'Muy activo'}
function birthLabel(value?:string|null) {
  if(!value)return 'Sin registrar'
  const date=new Date(value)
  return Number.isNaN(+date)?'Sin registrar':new Intl.DateTimeFormat('es-MX',{dateStyle:'long',timeZone:'UTC'}).format(date)
}
function ageYears(birth?:string|null) {
  if(!birth)return null
  const d=new Date(birth),now=new Date()
  if(Number.isNaN(+d))return null
  let age=now.getFullYear()-d.getUTCFullYear()
  const month=now.getMonth()-d.getUTCMonth()
  if(month<0||(month===0&&now.getDate()<d.getUTCDate()))age--
  return age>=0&&age<140?age:null
}
function DataRow({label,value}:{label:string;value:string|number|undefined|null}) {
  return <View style={{width:'48%',minWidth:125,padding:11,borderRadius:13,backgroundColor:'#f0f7f2',gap:4}}>
    <Text style={{fontSize:12,color:colors.muted,fontWeight:'700'}}>{label}</Text>
    <Text selectable style={{fontSize:14,fontWeight:'700',color:colors.ink}}>{value==null||value===''?'Sin registrar':value}</Text>
  </View>
}
function RecordForm({patient,initial,profile,measurement}:{patient:string;initial:Record<string,unknown>|null;profile:Patient;measurement:LastMeasurement|null}) {
  const {session}=useAuth()
  const [base,setBase]=useState(initial)
  const [form,setForm]=useState(()=>clinicalForm(initial))
  const [active,setActive]=useState(()=>clinicalActive(initial))
  const [antecedentsOpen,setAntecedentsOpen]=useState(true)
  const [dirty,setDirty]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  useUnsavedChanges(dirty,busy)
  const change=(key:string,value:string)=>{setForm(previous=>({...previous,[key]:value}));setDirty(true)}
  function toggle(key:string,yes:boolean){
    setActive(previous=>yes?[...new Set([...previous,key])]:previous.filter(item=>item!==key))
    if(!yes)change(key,'')
    else setDirty(true)
  }
  async function save() {
    if(busy||!session)return
    setBusy(true);setError('')
    try{
      const body=clinicalUpdate(base,form,active)
      const result=await request<{expediente:Record<string,unknown>}>('/expedientes/'+patient,{
        token:session.token,method:'PUT',body,
      })
      setBase(result.expediente)
      setForm(clinicalForm(result.expediente))
      setActive(clinicalActive(result.expediente))
      setDirty(false)
      Alert.alert('Expediente guardado','Los datos clínicos se guardaron correctamente.')
    }catch(cause){setError(cause instanceof Error?cause.message:'No se pudo guardar el expediente.')}
    finally{setBusy(false)}
  }
  const obs=clinicalFields.find(([key])=>key==='observaciones')!
  return <View style={{gap:14}}>
    <View style={[styles.card,{gap:10}]}>
      <Text accessibilityRole="header" style={styles.cardTitle}>Identificación personal</Text>
      <Text style={[styles.body,{fontSize:13}]}>Datos automáticos del perfil. Para corregirlos, edita la ficha del paciente.</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
        <DataRow label="Nombre" value={profile.name}/>
        <DataRow label="Género" value={gender[profile.sex||'unspecified']}/>
        <DataRow label="Fecha de nacimiento" value={birthLabel(profile.birthDate)}/>
        <DataRow label="Edad" value={measurement?.edad ?? ageYears(profile.birthDate)}/>
        <DataRow label="Teléfono" value={profile.phone}/>
        <DataRow label="Correo electrónico" value={profile.email}/>
      </View>
    </View>
    <View style={[styles.card,{gap:10}]}>
      <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
        <Ionicons name="analytics-outline" size={24} color={colors.green}/>
        <Text accessibilityRole="header" style={styles.cardTitle}>Última medición</Text>
      </View>
      <Text style={[styles.body,{fontSize:13}]}>Datos obtenidos automáticamente del módulo de mediciones.</Text>
      {measurement?<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
        <DataRow label="Peso" value={measurement.peso+' kg'}/>
        <DataRow label="Estatura" value={measurement.estatura+' m'}/>
        <DataRow label="IMC" value={measurement.imc==null?(measurement.peso/measurement.estatura**2).toFixed(2):measurement.imc.toFixed(2)}/>
        <DataRow label="Actividad física" value={activity[measurement.nivelActividadFisica||0]||'Sin registrar'}/>
        {measurement.fecha&&<DataRow label="Fecha de medición" value={birthLabel(measurement.fecha)}/>}
        {measurement.grasaCorporal!=null&&<DataRow label="Grasa corporal" value={measurement.grasaCorporal+' %'}/>}
        {measurement.masaMuscular!=null&&<DataRow label="Masa muscular" value={measurement.masaMuscular+' kg'}/>}
        {measurement.grasaVisceral!=null&&<DataRow label="Grasa visceral" value={measurement.grasaVisceral}/>}
        {measurement.masaOsea!=null&&<DataRow label="Masa ósea" value={measurement.masaOsea+' kg'}/>}
      </View>:<Text style={styles.body}>Aún no hay mediciones registradas.</Text>}
    </View>
    <View style={[styles.card,{gap:8}]}>
      <DietDisclosure label="Antecedentes personales patológicos" open={antecedentsOpen}
        onPress={()=>setAntecedentsOpen(value=>!value)} disabled={busy}>
        <Text style={[styles.body,{fontSize:13}]}>Todos los campos son opcionales. Selecciona Sí para escribir detalles.</Text>
        {clinicalFields.filter(([key])=>key!=='observaciones').map(([key,label])=>
          <YesNoDetail key={key} label={label} value={form[key]||''} disabled={busy}
            checked={active.includes(key)} onChange={value=>change(key,value)} onToggle={yes=>toggle(key,yes)}/>)}
      </DietDisclosure>
    </View>
    <RecordSectionFields form={form} active={active} disabled={busy}
      onChange={change} onToggle={toggle}/>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.cardTitle}>{obs[1]}</Text>
      <FormField label="Notas adicionales para seguimiento" value={form.observaciones||''} multiline disabled={busy}
        onChange={value=>change('observaciones',value)}/>
    </View>
    {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Button label={busy?'Guardando…':'Guardar expediente'} disabled={busy||!dirty} onPress={()=>void save()}/>
  </View>
}
export default function ClinicalRecordScreen(){
  const {patient}=useLocalSearchParams<{patient?:string}>()
  const valid=typeof patient==='string'&&/^[a-f\d]{24}$/i.test(patient)
  const resource=useResource<RecordData>(valid?'/expedientes/'+patient:null)
  if(!valid)return <Page><Text style={styles.cardTitle}>Elige un paciente para abrir su expediente.</Text>
    <Button label="Elegir paciente" onPress={()=>router.replace('/pacientes')}/></Page>
  return <Page bottomInset>
    <ListState loading={resource.loading} error={resource.error} reload={resource.reload}/>
    {resource.data&&<><Text accessibilityRole="header" style={styles.title}>{resource.data.paciente.name}</Text>
      <RecordForm key={patient} patient={patient!} profile={resource.data.paciente}
        measurement={resource.data.ultimaMedicion} initial={resource.data.expediente}/></>}
  </Page>
}
