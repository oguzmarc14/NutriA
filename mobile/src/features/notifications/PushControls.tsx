import { useState } from 'react'
import { Text, View } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { useResource } from '@/shared/hooks/useResource'
import { Button, styles } from '@/shared/ui/primitives'
import { registerPush, unregisterPush } from './pushRegistration'
export function PushControls() {
  const {session}=useAuth(),status=useResource<{enabled:boolean;registered:boolean}>('/push/status')
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('')
  async function change(enable:boolean){if(!session||busy)return;setBusy(true);setError('');setMessage('')
    try{if(enable)await registerPush(session.token,session.user.id);else await unregisterPush(session.token);setMessage(enable?'Este teléfono quedó registrado para los avisos del sistema.':'Avisos remotos desactivados en este teléfono.');status.reload()}
    catch(cause){setError(cause instanceof Error?cause.message:'No se pudo configurar el teléfono.')}
    finally{setBusy(false)}
  }
  return <View style={styles.card}><Text style={styles.cardTitle}>Notificaciones del sistema</Text><Text style={styles.body}>{session?.user.role==='patient'?'Nuevas dietas, cambios de citas y recordatorios.':'Confirmaciones de dietas, cambios de agenda y publicaciones que requieren atención, según tu rol.'}</Text>
    <Text style={styles.body}>{status.loading?'Consultando servicio…':status.error?'No se pudo consultar el estado del servicio.':!status.data?.enabled?'El servicio remoto aún no está habilitado.':status.data.registered?'Tu cuenta tiene dispositivos registrados.':'Activa este teléfono para recibir avisos.'}</Text>
    <Button label={busy?'Procesando…':'Activar en este teléfono'} disabled={busy||!status.data?.enabled} onPress={()=>void change(true)}/><Button label="Desactivar en este teléfono" selected={false} disabled={busy} onPress={()=>void change(false)}/>
    {!!status.error&&<Button label="Reintentar consulta" selected={false} onPress={status.reload}/>} {!!message&&<Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}{!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>
}
