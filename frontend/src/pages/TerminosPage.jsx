import { Link } from 'react-router-dom'
import LegalPage from './LegalPage'

export default function TerminosPage() {
  return <LegalPage title="Términos de uso" intro="Condiciones para usar las herramientas de gestión y seguimiento de NutriA.">
    <section><h2>Cuenta y acceso</h2><p>Usa tu propia cuenta, protege tus credenciales y registra información que tengas autorización para utilizar. El acceso a las funciones depende de tu rol. Si detectas un acceso indebido, informa al consultorio o a quien administra tu cuenta.</p></section>
    <section><h2>Atención y decisiones nutricionales</h2><p>NutriA facilita la comunicación y el seguimiento. El profesional tratante evalúa al paciente, valida las equivalencias y decide el plan. Para conocer la procedencia y el alcance de estos datos, consulta las <Link to="/fuentes-nutricionales">fuentes nutricionales</Link>.</p></section>
    <section id="pagos"><h2>Tarifas, pagos y reservas</h2><p>El consultorio define las tarifas de primera visita y seguimiento. Revisa la fecha, la hora y el importe en MXN antes de pagar. El pago con tarjeta depende de que el consultorio habilite el método y vincule su cuenta de Mercado Pago. La cita se registra cuando NutriA verifica la aprobación y completa la reserva. Consulta Mis citas para revisar su estado.</p><p>Si el pago aparece pendiente o ya ves un cargo pero la cita aún no figura, revisa el estado y contacta al consultorio con la referencia de operación antes de realizar otro pago. Si eliges efectivo y el consultorio ofrece esa opción, el pago y la cita se acuerdan por WhatsApp.</p></section>
    <section><h2>Cancelaciones y reembolsos</h2><p>Consulta con tu consultorio las condiciones de cambios, cancelaciones y reembolsos. Una cancelación en la agenda y un reembolso son operaciones distintas. Si hay un cargo por una cita cancelada, solicita al consultorio que revise la operación y conserva la referencia. Se respetan los derechos que reconozca la ley aplicable.</p><p><a href="https://www.mercadopago.com.mx/developers/es/docs/resources/legal/terms-and-conditions">Términos de Mercado Pago</a></p></section>
    <section><h2>Disponibilidad</h2><p>El acceso puede interrumpirse por mantenimiento, problemas de conexión o fallas de proveedores. Si tienes una cita próxima y no puedes consultar su estado, comunícate con tu consultorio.</p></section>
  </LegalPage>
}
