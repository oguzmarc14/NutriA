import { useEffect } from 'react'
import { router } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { useAuth } from '@/features/auth/AuthProvider'
let currentUser: string | undefined
Notifications.setNotificationHandler({
  handleNotification: async notification => {
    const recipient = notification.request.content.data.recipientUser
    const show = !!currentUser && (!recipient || recipient === currentUser)
    return { shouldShowBanner: show, shouldShowList: show, shouldPlaySound: show, shouldSetBadge: false }
  },
})
export default function NotificationNavigation() {
  const {session}=useAuth()
  currentUser=session?.user.id
  useEffect(()=>{
    if(!session)return
    let active = true
    function open(response:Notifications.NotificationResponse){
      if (!active || currentUser !== session!.user.id) return
      const data=response.notification.request.content.data
      if(data.recipientUser&&data.recipientUser!==session!.user.id){void Notifications.clearLastNotificationResponseAsync();return}
      if(data.kind==='nutria-appointment') {
        if(session!.user.role==='patient')router.navigate('/mis-citas')
        else if(session!.user.role==='nutritionist')router.navigate('/citas')
      }else if(data.kind==='nutria-diet-assigned' && session!.user.role==='patient'){
        router.navigate('/mi-plan')
      }else if(data.kind==='nutria-diet-accepted' && session!.user.role==='nutritionist'){
        router.navigate('/planes')
      }else if(data.kind==='nutria-community'){
        if(session!.user.role==='admin')router.push('/moderacion')
        else if(session!.user.role==='nutritionist')router.push('/comunidad')
      }else return
      void Notifications.clearLastNotificationResponseAsync()
    }
    const subscription=Notifications.addNotificationResponseReceivedListener(open)
    void Notifications.getLastNotificationResponseAsync().then(response=>{if(response)open(response)}).catch(()=>{})
    return () => { active = false; subscription.remove() }
  },[session?.user.id,session?.user.role])
  return null
}
