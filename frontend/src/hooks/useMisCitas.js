import { useCallback, useEffect, useState } from 'react'
import client from '../api/client'

// Endpoint exclusivo del paciente autenticado; sin parámetros de terceros.
export default function useMisCitas(){
  const [datos,setDatos]=useState(null)
  const [cargando,setCargando]=useState(true)
  const [error,setError]=useState('')
  const actualizar=useCallback(async()=>{
    try{
      const {data}=await client.get('/mi-perfil/citas')
      setDatos(data)
      setError('')
    }catch(err){
      setError(err.response?.data?.message || 'No se pudieron consultar tus citas.')
    }finally{setCargando(false)}
  },[])
  useEffect(()=>{
    actualizar()
    const alRegresar=()=>{if(document.visibilityState==='visible')actualizar()}
    const alFoco=()=>actualizar()
    document.addEventListener('visibilitychange',alRegresar)
    window.addEventListener('focus',alFoco)
    const intervalo=window.setInterval(()=>{
      if(document.visibilityState==='visible')actualizar()
    },3*60*1000)
    return()=>{
      document.removeEventListener('visibilitychange',alRegresar)
      window.removeEventListener('focus',alFoco)
      window.clearInterval(intervalo)
    }
  },[actualizar])
  return {datos,cargando,error,actualizar}
}
