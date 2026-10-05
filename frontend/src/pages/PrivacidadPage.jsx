function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] px-6 py-12 text-[#173f34]">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm md:p-12">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-[#718557]">
          NutriA
        </p>

        <h1 className="mb-8 text-3xl font-bold">
          Política de Privacidad
        </h1>

        <div className="space-y-6 leading-7 text-gray-700">
          <p>
            Última actualización: 5 de octubre de 2026.
          </p>

          <p>
            NutriA es una plataforma diseñada para facilitar
            la gestión y el seguimiento nutricional entre
            profesionales de la nutrición y sus pacientes.
          </p>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#173f34]">
              Información que recopilamos
            </h2>

            <p>
              NutriA puede almacenar información proporcionada
              por los usuarios, como nombre, correo electrónico,
              datos de perfil, información relacionada con el
              seguimiento nutricional, mediciones y planes
              alimenticios.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#173f34]">
              Uso de la información
            </h2>

            <p>
              La información se utiliza exclusivamente para
              proporcionar las funciones de la plataforma,
              gestionar cuentas, facilitar el seguimiento
              nutricional y permitir la comunicación necesaria
              para el funcionamiento de NutriA.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#173f34]">
              Inicio de sesión con Google
            </h2>

            <p>
              NutriA puede utilizar servicios de autenticación
              de Google para permitir el acceso de usuarios
              autorizados. La aplicación utiliza únicamente la
              información necesaria para autenticar al usuario
              y administrar su acceso.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#173f34]">
              Envío de correos electrónicos
            </h2>

            <p>
              NutriA puede utilizar servicios de Google para
              enviar correos relacionados con el funcionamiento
              de la plataforma, como invitaciones para activar
              cuentas de pacientes. El acceso a estos servicios
              se utiliza exclusivamente para estas funciones.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#173f34]">
              Protección de la información
            </h2>

            <p>
              Se aplican medidas razonables de seguridad para
              proteger la información almacenada y limitar el
              acceso a usuarios autorizados.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#173f34]">
              Compartición de información
            </h2>

            <p>
              NutriA no vende la información personal de sus
              usuarios. La información solo podrá utilizarse
              con los proveedores tecnológicos necesarios para
              operar la plataforma o cuando exista una
              obligación legal aplicable.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#173f34]">
              Contacto
            </h2>

            <p>
              Para consultas relacionadas con esta Política de
              Privacidad puedes comunicarte con el responsable
              de NutriA mediante el correo de soporte registrado
              para la aplicación.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t pt-6">
          <a
            href="/"
            className="font-semibold text-[#246b55] hover:underline"
          >
            ← Volver a NutriA
          </a>
        </div>
      </div>
    </main>
  )
}

export default PrivacidadPage