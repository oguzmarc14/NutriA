function TerminosPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] px-6 py-12 text-[#173f34]">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm md:p-12">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-[#718557]">
          NutriA
        </p>

        <h1 className="mb-8 text-3xl font-bold">
          Términos y Condiciones de Servicio
        </h1>

        <div className="space-y-6 leading-7 text-gray-700">
          <p>
            Última actualización: 5 de octubre de 2026.
          </p>

          <p>
            Al utilizar NutriA, el usuario acepta los presentes
            Términos y Condiciones de Servicio.
          </p>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#173f34]">
              Finalidad de NutriA
            </h2>

            <p>
              NutriA es una herramienta tecnológica destinada
              a apoyar la administración y seguimiento de
              información nutricional entre profesionales de
              la nutrición y sus pacientes.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#173f34]">
              Cuentas de usuario
            </h2>

            <p>
              Los usuarios son responsables de mantener segura
              su cuenta y de proporcionar información correcta.
              El acceso a determinadas funciones puede estar
              limitado según el tipo y permisos de cada usuario.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#173f34]">
              Uso adecuado
            </h2>

            <p>
              El usuario se compromete a utilizar NutriA de
              forma legítima y a no intentar acceder a cuentas,
              información o funciones para las cuales no tenga
              autorización.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#173f34]">
              Información nutricional
            </h2>

            <p>
              NutriA funciona como herramienta de apoyo para
              profesionales y pacientes. La plataforma no
              sustituye el criterio profesional ni constituye
              por sí misma diagnóstico o tratamiento médico.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#173f34]">
              Servicios de terceros
            </h2>

            <p>
              Algunas funciones pueden depender de servicios
              proporcionados por terceros, incluyendo servicios
              de Google utilizados para autenticación y envío
              de comunicaciones.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#173f34]">
              Disponibilidad
            </h2>

            <p>
              Se procura mantener NutriA disponible y en
              funcionamiento, aunque pueden existir
              interrupciones temporales por mantenimiento,
              actualizaciones o causas externas.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-[#173f34]">
              Cambios en estos términos
            </h2>

            <p>
              Estos términos podrán actualizarse cuando sea
              necesario para reflejar cambios en la plataforma,
              sus funciones o requisitos aplicables.
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

export default TerminosPage