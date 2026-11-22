import Ionicons from '@expo/vector-icons/Ionicons'
import { useRef, useState } from 'react'
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native'
import { router } from 'expo-router'
import { request } from '@/core/api/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { AppDialog } from '@/shared/ui/AppDialog'
import { FormField } from '@/shared/ui/FormField'
import { DateField } from '@/shared/ui/DateTimeField'
import { Button, colors, styles } from '@/shared/ui/primitives'
import { patientNotices, type PatientNoticeData } from './patientNotices'
type CardPatient = PatientNoticeData & { _id: string; name: string; email?: string; sex?: string }
export function PatientCardActions({ patient, noticesOpen, onNotices, onResend, resending, onChanged, onRemoved, onOpen }: {
  patient: CardPatient; noticesOpen: boolean; onNotices: (open: boolean) => void; onResend: () => void; resending: boolean; onChanged: () => void; onRemoved: () => void; onOpen: () => void
}) {
  const { session } = useAuth()
  const { width, height } = useWindowDimensions()
  const anchor = useRef<View>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [dialog, setDialog] = useState<'edit' | 'notes' | 'delete' | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '', birthDate: '', sex: 'unspecified' })
  const submitting = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const notices = patientNotices(patient)
  function edit() {
    setMenu(null); onNotices(false); setError('')
    setForm({ name: patient.name, email: patient.email || '', phone: patient.phone || '', notes: patient.notes || '', birthDate: patient.birthDate?.slice(0, 10) || '', sex: patient.sex || 'unspecified' }); setDialog('edit')
  }
  async function mutate(remove: boolean) {
    if (submitting.current || !session) return
    if (!remove && form.name.trim().length < 2) { setError('Escribe el nombre completo del paciente.'); return }
    if (!remove && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError('Ingresa un correo válido.'); return }
    submitting.current = true; setBusy(true); setError('')
    try {
      await request('/pacientes/' + patient._id, { token: session.token, method: remove ? 'DELETE' : 'PUT', ...(!remove ? { body: { ...form, birthDate: form.birthDate || undefined } } : {}) })
      setDialog(null); if (remove) onRemoved(); onChanged()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudieron guardar los cambios.') }
    finally { submitting.current = false; setBusy(false) }
  }
  const icon = (name: keyof typeof Ionicons.glyphMap, label: string, onPress: () => void) => <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={name} size={21} color={colors.green} /></Pressable>
  return <>
    <View style={{ flexDirection: 'row', marginLeft: 'auto' }}>
      <View style={{ borderWidth: 1, borderColor: '#cce1d3', borderRadius: 24 }}>{icon('notifications-outline', `${notices.length} ${notices.length === 1 ? 'aviso' : 'avisos'} de ${patient.name}`, () => onNotices(true))}
        {!!notices.length && <View pointerEvents="none" style={{ position: 'absolute', top: -4, right: -3, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#267259', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white', fontSize: 11, fontWeight: '800' }}>{notices.length}</Text></View>}
      </View>
      <View ref={anchor} collapsable={false}>{icon('ellipsis-vertical', 'Opciones de ' + patient.name, () => anchor.current?.measureInWindow((x, y, w, h) => setMenu({ x: Math.max(12, Math.min(width - 246, x + w - 232)), y: Math.max(12, Math.min(height - 300, y + h + 4)) })))}</View>
    </View>
    <Modal visible={!!menu} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
      <View style={{ flex: 1 }}><Pressable accessibilityRole="button" accessibilityLabel="Cerrar opciones" onPress={() => setMenu(null)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#173f3412' }} />
        <View accessibilityViewIsModal style={{ position: 'absolute', left: menu?.x || 12, top: menu?.y || 12, width: Math.min(232, width - 24), borderWidth: 1, borderColor: '#a8cdb5', backgroundColor: '#f7fcf8', borderRadius: 16, padding: 6, elevation: 12, shadowOpacity: 0.16, shadowRadius: 12 }}>
          {([{ label: 'Editar paciente', icon: 'create-outline', action: edit },
            ...(patient.accountStatus === 'pending' ? [{ label: resending ? 'Enviando…' : 'Reenviar invitación', icon: 'refresh-outline', action: () => { setMenu(null); onResend() } }] : []),
            { label: 'Ver notas', icon: 'document-text-outline', action: () => { setMenu(null); setDialog('notes') } },
            { label: 'Abrir ficha', icon: 'person-outline', action: () => { setMenu(null); onOpen() } },
            { label: 'Eliminar paciente', icon: 'trash-outline', action: () => { setMenu(null); setError(''); setDialog('delete') } }]).map(item => <Pressable key={item.label} accessibilityRole="button" disabled={resending && item.icon === 'refresh-outline'} onPress={item.action} style={{ minHeight: 44, padding: 10, flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: 10 }}><Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={19} color={item.icon === 'trash-outline' ? colors.error : colors.green} /><Text style={{ color: item.icon === 'trash-outline' ? colors.error : colors.ink, flexShrink: 1 }}>{item.label}</Text></Pressable>)}
        </View>
      </View>
    </Modal>
    <AppDialog visible={noticesOpen} title="Avisos del paciente" message={patient.name} onClose={() => onNotices(false)}>
      {!notices.length && <Text style={styles.body}>No hay avisos pendientes para este paciente.</Text>}
      {notices.map(n => <View key={n.id} style={[styles.card, { backgroundColor: '#edf5ef', borderWidth: 1, borderColor: '#cce1d3', borderRadius: 16 }]}><Text style={styles.cardTitle}>{n.title}</Text><Text style={styles.body}>{n.detail}</Text>{n.id === 'invitation' && <Button selected={false} label={resending ? 'Enviando…' : 'Reenviar invitación'} disabled={resending} onPress={() => { onNotices(false); onResend() }} />}{n.action && <Button selected={false} label={n.action === 'edit' ? 'Completar datos' : 'Abrir apartado'} onPress={() => { if (n.action === 'edit') edit(); else { onNotices(false); router.push({ pathname: ('/' + n.action) as '/expediente', params: { patient: patient._id } }) } }} />}</View>)}
      <Button label="Aceptar" onPress={() => onNotices(false)} />
    </AppDialog>
    <AppDialog visible={dialog === 'notes'} title="Objetivo nutricional / notas" message={patient.notes || 'Sin notas registradas. Puedes agregarlas al editar al paciente.'} onClose={() => setDialog(null)} />
    <AppDialog visible={dialog === 'delete'} title="Eliminar paciente" message={'Se eliminará a ' + patient.name + ' y sus registros asociados. Esta acción es irreversible.'} onClose={() => { if (!busy) setDialog(null) }}>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Button label={busy ? 'Eliminando…' : 'Sí, eliminar paciente'} disabled={busy} onPress={() => void mutate(true)} /><Button selected={false} label="Cancelar" disabled={busy} onPress={() => setDialog(null)} />
    </AppDialog>
    <AppDialog visible={dialog === 'edit'} title="Editar paciente" onClose={() => { if (!busy) setDialog(null) }}>
      <FormField label="Nombre completo" value={form.name} disabled={busy} onChange={name => setForm({ ...form, name })} />
      <FormField label="Correo electrónico" value={form.email} disabled={busy} onChange={email => setForm({ ...form, email })} />
      <FormField label="Teléfono" value={form.phone} disabled={busy} onChange={phone => setForm({ ...form, phone })} />
      <DateField label="Fecha de nacimiento (opcional)" value={form.birthDate} disabled={busy} onChange={birthDate => setForm({ ...form, birthDate })} />
      <Text style={styles.body}>Sexo</Text><View style={styles.row}>{[['male','Masculino'],['female','Femenino'],['other','Otro'],['unspecified','Sin especificar']].map(([value,label]) => <Button key={value} selected={form.sex === value} label={label} disabled={busy} onPress={() => setForm({ ...form, sex: value })} />)}</View>
      <FormField label="Objetivo nutricional / notas" multiline value={form.notes} disabled={busy} onChange={notes => setForm({ ...form, notes })} />
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Button label={busy ? 'Guardando…' : 'Guardar cambios'} disabled={busy} onPress={() => void mutate(false)} /><Button selected={false} label="Cancelar" disabled={busy} onPress={() => setDialog(null)} />
    </AppDialog>
  </>
}
