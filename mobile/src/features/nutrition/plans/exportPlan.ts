import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { File } from 'expo-file-system'
import { planDocument } from './planDocument'
import type { Plan } from './models'
export async function exportPlan(plan: Plan, patientName: string) {
  if (!await Sharing.isAvailableAsync()) throw new Error('No hay una aplicación disponible para compartir el PDF en este dispositivo.')
  const { uri } = await Print.printToFileAsync({html:planDocument(plan,patientName)})
  try { await Sharing.shareAsync(uri,{mimeType:'application/pdf',UTI:'.pdf',dialogTitle:'Compartir plan alimenticio'}) }
  finally { try { new File(uri).delete() } catch { /* Cached file will be purged by the OS. */ } }
}
