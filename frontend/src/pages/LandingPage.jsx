import { Apple, ArrowRight, CalendarDays, ChartNoAxesColumnIncreasing, ClipboardList, Heart, Menu, Monitor, Smartphone, Users, Wallet } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import './landing.css'

const logo = '/imagenes/logo-nutria.png'
const sections = [['ofrece', 'Qué ofrece'], ['pagos', 'Pagos en línea'], ['plataformas', 'Web y Android'], ['ventajas', 'Ventajas'], ['historia', 'Nuestra historia']]
const features = [
  [Users, 'Pacientes en orden', 'Administra perfiles, invitaciones, estados de atención e información clínica desde un solo lugar.'],
  [ClipboardList, 'Expediente digital', 'Centraliza antecedentes, objetivos y mediciones para dar continuidad a cada consulta.'],
  [Apple, 'Planes alimenticios', 'Organiza comidas, porciones y el plan por fecha para que el paciente sepa qué sigue.'],
  [CalendarDays, 'Citas y recordatorios', 'Consulta horarios, organiza sesiones y acerca las próximas citas a ambos perfiles.'],
  [ChartNoAxesColumnIncreasing, 'Progreso visible', 'Revisa la evolución de peso, IMC y composición corporal con seguimiento visual.'],
  [Heart, 'Motivación diaria', 'Rachas, logros e indicadores que ayudan a reforzar la constancia entre consultas.'],
]
const steps = [
  ['El paciente elige un horario', 'Selecciona un espacio disponible en la agenda.'],
  ['Realiza su pago en línea', 'El importe corresponde a la tarifa del tipo de consulta.'],
  ['La cita se registra', 'NutriA recibe la confirmación del pago y registra la reserva.'],
  ['El especialista recibe el aviso', 'Puede revisar la cita y marcarla como enterado.'],
]
const questions = [
  ['¿NutriA es para nutriólogos o pacientes?', 'Para ambos. El especialista gestiona su consulta y el paciente consulta su plan, su progreso y sus citas.'],
  ['¿Dónde puedo utilizar la plataforma?', 'Desde tu navegador o desde la aplicación para Android.'],
  ['¿Los pagos en línea ya están disponibles?', 'Puedes pagar con tarjeta cuando tu consultorio haya conectado Mercado Pago y habilitado la tarifa correspondiente.'],
  ['¿Cómo se diferencia de una agenda convencional?', 'La agenda está vinculada con el expediente, el plan y el seguimiento del paciente.'],
  ['¿Cómo empiezo a usar NutriA?', 'Si ya tienes una cuenta o recibiste una invitación, puedes entrar desde Iniciar sesión.'],
]

function Phone({ clinician = false }) {
  const rows = clinician ? ['Pacientes', 'Buscar paciente', 'Próximas consultas', 'Expediente clínico', 'Seguimiento'] : ['Mi progreso', 'Mis pagos', 'Mis notificaciones', 'Mi plan alimenticio', 'Mis citas']
  return <div className="nutria-phone">
    <small>☰　NutriA</small>
    <div className="nutria-phone-profile"><strong>{clinician ? 'Mi consultorio' : '¡Hola, Andrea!'}</strong><span>{clinician ? 'Gestión nutricional' : 'Paciente de muestra'}</span></div>
    {rows.map((row, i) => <div className="nutria-phone-row" key={row}><span>{['◈', '▤', '♧', '♡', '▦'][i]}</span> {row} <span>›</span></div>)}
    <small>⌂　　▥　　▦　　☰</small>
  </div>
}

export default function LandingPage() {
  const [params] = useSearchParams()
  const native = params.get('app') === 'android'
  const login = native ? <a className="nutria-primary" href="/login">Iniciar sesión <ArrowRight /></a> : <Link className="nutria-primary" to="/login">Iniciar sesión <ArrowRight /></Link>
  return <div className="nutria-landing" id="inicio">
    <header className="nutria-header"><div className="nutria-wrap nutria-nav">
      <a href="#inicio" aria-label="NutriA, inicio"><img src={logo} alt="NutriA" /></a>
      <nav aria-label="Secciones">{sections.map(([id, title]) => <a key={id} href={'#' + id}>{title}</a>)}</nav>
      {login}
      <details className="nutria-menu"><summary aria-label="Abrir menú"><Menu /></summary><nav aria-label="Secciones móviles" onClick={event => {
        if (event.target.closest('a')) event.currentTarget.parentElement.open = false
      }}>{sections.map(([id, title]) => <a key={id} href={'#' + id}>{title}</a>)}</nav></details>
    </div></header>
    <main>
      <section className="nutria-hero"><div className="nutria-wrap nutria-split">
        <div><span className="nutria-pill">● Tecnología que acompaña tu consulta</span>
          <h1>La nutrición también ocurre <em>entre consultas.</em></h1>
          <p>NutriA conecta a nutriólogos y pacientes en una sola plataforma. Expedientes, planes alimenticios, citas, progreso y motivación diaria, con una experiencia diseñada para web y Android.</p>
          <div className="nutria-actions"><a className="nutria-primary" href="#ofrece">Descubre NutriA <ArrowRight /></a><a className="nutria-secondary" href="#contacto">Conoce NutriA</a></div>
          <div className="nutria-meta"><span><Monitor /> Plataforma web</span><span><Smartphone /> Android</span><span><Heart /> Nutrición conectada</span></div>
        </div>
        <div className="nutria-hero-art" aria-hidden="true"><Phone clinician /><Phone />
          <aside><ChartNoAxesColumnIncreasing /><small>Tu progreso, siempre visible</small><strong>En tus manos</strong></aside>
          <aside><Wallet /><small>Pagos en línea</small><strong>Menos fricción</strong></aside>
        </div>
      </div></section>
      <div className="nutria-strip"><div className="nutria-wrap">{[[ClipboardList,'Expediente digital'],[CalendarDays,'Agenda centralizada'],[ChartNoAxesColumnIncreasing,'Progreso y mediciones'],[Heart,'Hábitos y gamificación']].map(([Icon,label]) => <span key={label}><Icon />{label}</span>)}</div></div>
      <section id="ofrece" className="nutria-section"><div className="nutria-wrap">
        <div className="nutria-center"><span className="nutria-kicker">Una plataforma, todo conectado</span><h2>Menos administración.<br />Más atención a las personas.</h2><p>Desde la primera consulta hasta el seguimiento diario, NutriA reúne las herramientas esenciales para una atención nutricional más clara y organizada.</p></div>
        <div className="nutria-features">{features.map(([Icon,title,copy]) => <article key={title} className="nutria-card"><Icon className="nutria-icon" /><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </div></section>
      <section id="pagos" className="nutria-section nutria-dark"><div className="nutria-wrap nutria-split">
        <div><span className="nutria-kicker">Pagos en línea</span><h2>La cita es importante. <em>El cobro no debería complicarla.</em></h2><p>Reserva y paga en el mismo recorrido cuando tu consultorio tenga habilitado el cobro con tarjeta.</p>
          <ol className="nutria-steps">{steps.map(([title,copy],i) => <li key={title}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{title}</strong><p>{copy}</p></div></li>)}</ol>
          <a className="nutria-secondary" href="/terminos#pagos">Consulta las condiciones de pago <ArrowRight /></a>
        </div>
        <div className="nutria-payment"><article className="nutria-card"><Wallet className="nutria-icon" /><h3>Reserva de consulta</h3><p>Consulta nutricional · Precio de ejemplo</p><strong className="nutria-price">$650 <small>MXN</small></strong><ul><li>Horario elegido por el paciente</li><li>Pago procesado por Mercado Pago</li><li>Registro de la cita y aviso al especialista</li></ul><div className="nutria-pill">Ejemplo de flujo · Sin cobro real</div></article></div>
      </div></section>
      <section id="plataformas" className="nutria-section nutria-tint"><div className="nutria-wrap">
        <div className="nutria-center"><span className="nutria-kicker">Una sola experiencia, donde la necesites</span><h2>En tu consultorio.<br />En la palma de tu mano.</h2><p>El especialista trabaja con información organizada y el paciente lleva consigo lo necesario para continuar su plan.</p></div>
        <div className="nutria-pair">{[[Monitor,'Web','Tu consultorio, más organizado','Administra expedientes, pacientes, planes y agenda desde una web adaptable.'],[Smartphone,'Android','El seguimiento va contigo','Consulta tus citas, progreso y plan alimenticio desde NutriA.']].map(([Icon,label,title,copy]) => <article className="nutria-card" key={label}><span className="nutria-pill"><Icon />{label}</span><h3>{title}</h3><p>{copy}</p><div className="nutria-platform" aria-hidden="true">{label === 'Android' ? <Phone /> : <div className="nutria-fake-web"><strong>Vista de mi clínica</strong><div>{['Pacientes','Citas','Planes'].map((item,i) => <span key={item}><b>{[24,8,12][i]}</b>{item}</span>)}</div><hr/><hr/><hr/></div>}</div></article>)}</div>
      </div></section>
      <section id="ventajas" className="nutria-section"><div className="nutria-wrap">
        <span className="nutria-kicker">¿Por qué NutriA?</span><h2>El valor está en conectar el cuidado.</h2><p>La experiencia del paciente y el trabajo del especialista forman parte del mismo flujo.</p>
        <div className="nutria-pair nutria-compare"><article className="nutria-card"><h3>Con herramientas separadas</h3><ul><li>Expedientes, agendas y archivos en diferentes lugares.</li><li>Planes compartidos en mensajes o documentos estáticos.</li><li>Seguimiento y cobros en herramientas distintas.</li></ul></article><article className="nutria-card"><h3>Con la visión de NutriA</h3><ul><li>Expediente, agenda, plan y seguimiento en una plataforma.</li><li>Experiencias para especialistas y pacientes.</li><li>Progreso, citas y recordatorios a la vista.</li></ul></article></div>
      </div></section>
      <section id="historia" className="nutria-section nutria-tint"><div className="nutria-wrap nutria-story">
        <div className="nutria-story-logo"><img src={logo} alt="Mascota de NutriA con un tazón de alimentos" loading="lazy" /></div>
        <div><span className="nutria-kicker">De dónde nace NutriA</span><h2>De una pregunta sencilla, ¿qué pasa <em>después</em> de la consulta?</h2><p>NutriA nace como un proyecto de ingeniería para responder a un problema real. El trabajo clínico suele quedar disperso y, entre citas, el paciente puede perder claridad o motivación para seguir su plan.</p><p>Imaginamos una herramienta que ayude al especialista a dedicar más tiempo a orientar y al paciente a <strong>ver su progreso, recordar sus citas y mantener presentes sus objetivos.</strong></p></div>
      </div></section>
      <section className="nutria-section"><div className="nutria-wrap nutria-split nutria-faq">
        <div><span className="nutria-kicker">Preguntas frecuentes</span><h2>Todo lo que necesitas saber.</h2></div>
        <div>{questions.map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </div></section>
      <section id="contacto" className="nutria-section nutria-dark nutria-contact"><div className="nutria-wrap nutria-split">
        <div><span className="nutria-kicker">El siguiente paso es tuyo</span><h2>Tu trabajo merece una plataforma que esté a su altura.</h2><p>Consulta tu plan o gestiona tu consultorio desde NutriA.</p></div><div>{login}</div>
      </div></section>
    </main>
    <footer className="nutria-footer"><div className="nutria-wrap"><span>© 2026 NutriA · Proyecto de innovación en gestión y seguimiento nutricional</span><nav aria-label="Información legal"><a href="/privacidad">Aviso de privacidad</a><a href="/terminos">Términos</a><a href="/fuentes-nutricionales">Fuentes nutricionales</a><a href="#inicio">Volver arriba ↑</a></nav></div></footer>
  </div>
}
