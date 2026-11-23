import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { File } from 'expo-file-system'
import { planDocument, type ClinicBrand } from './planDocument'
import { request } from '@/core/api/client'
import type { Plan } from './models'
export async function loadClinicBrand(token: string, planId?: string) {
  try {
    const path = planId ? '/mi-perfil/planes/' + encodeURIComponent(planId) + '/marca' : '/clinica'
    return (await request<{ clinica: ClinicBrand }>(path, { token })).clinica
  } catch { return undefined }
}

export async function exportPlan(plan: Plan, patientName: string, clinic?: ClinicBrand) {
  if (!await Sharing.isAvailableAsync()) throw new Error('No hay una aplicación disponible para compartir el PDF en este dispositivo.')
  const { uri } = await Print.printToFileAsync({html:planDocument(plan,patientName,clinic)})
  try { await Sharing.shareAsync(uri,{mimeType:'application/pdf',UTI:'.pdf',dialogTitle:'Compartir plan alimenticio'}) }
  finally { try { new File(uri).delete() } catch { /* Cached file will be purged by the OS. */ } }
}
