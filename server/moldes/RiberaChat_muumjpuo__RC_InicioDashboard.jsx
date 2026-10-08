/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  const [canales, setCanales] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const [resCanales, resMensajes] = await Promise.all([
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('rc_canales')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('rc_mensajes')}?ecosistema=${eco}`)
      ]);
      if (resCanales.ok) setCanales(resCanales.registros);
      if (resMensajes.ok) setMensajes(resMensajes.registros);
      setCargando(false);
    };
    cargar();
  }, []);

  if (cargando) {
    return (
      <UI.Tarjeta>
        <div className="p-8 flex justify-center items-center">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl" style={{ color: tema.colorPrimario }}></i>
        </div>
      </UI.Tarjeta>
    );
  }

  const misDms = mensajes.filter(m => !m.canal_id && m.receptor_id === miId);
  const mensajesRecientes = mensajes.filter(m => m.canal_id).sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro)).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UI.Tarjeta className="flex flex-col items-center justify-center p-6 text-center">
          <i className="fa-solid fa-hashtag text-3xl mb-2" style={{ color: tema.colorPrimario }}></i>
          <span className="text-3xl font-black" style={{ color: tema.texto }}>{canales.length}</span>
          <span className="text-sm opacity-70 uppercase tracking-wider font-bold mt-1" style={{ color: tema.texto }}>
            {MEITI.t('active_channels', null, 'Canales Activos')}
          </span>
        </UI.Tarjeta>
        <UI.Tarjeta className="flex flex-col items-center justify-center p-6 text-center">
          <i className="fa-solid fa-message text-3xl mb-2" style={{ color: tema.colorSecundario }}></i>
          <span className="text-3xl font-black" style={{ color: tema.texto }}>{misDms.length}</span>
          <span className="text-sm opacity-70 uppercase tracking-wider font-bold mt-1" style={{ color: tema.texto }}>
            {MEITI.t('direct_messages', null, 'Mensajes Directos')}
          </span>
        </UI.Tarjeta>
        <UI.Tarjeta className="flex flex-col items-center justify-center p-6 text-center">
          <i className="fa-solid fa-at text-3xl mb-2" style={{ color: tema.colorPrimario }}></i>
          <span className="text-3xl font-black" style={{ color: tema.texto }}>0</span>
          <span className="text-sm opacity-70 uppercase tracking-wider font-bold mt-1" style={{ color: tema.texto }}>
            {MEITI.t('mentions', null, 'Menciones Nuevas')}
          </span>
        </UI.Tarjeta>
      </div>

      <UI.Tarjeta>
        <div className="flex items-center gap-2 mb-4">
          <i className="fa-solid fa-chart-line text-xl" style={{ color: tema.colorSecundario }}></i>
          <h3 className="font-bold text-lg" style={{ color: tema.texto }}>
            {MEITI.t('recent_activity', null, 'Actividad Reciente')}
          </h3>
        </div>
        {mensajesRecientes.length === 0 ? (
          <UI.EstadoVacio icono="fa-comment-slash" mensaje={MEITI.t('no_recent_activity', null, 'No hay actividad reciente en los canales.')} />
        ) : (
          <div className="flex flex-col gap-3">
            {mensajesRecientes.map(m => {
              const canal = canales.find(c => c.id === m.canal_id);
              return (
                <div key={m.id} className="p-3 rounded-xl flex flex-col gap-1" style={{ backgroundColor: tema.texto + '08' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ backgroundColor: tema.colorPrimario + '22', color: tema.colorPrimario }}>
                      #{canal?.nombre || MEITI.t('unknown', null, 'Desconocido')}
                    </span>
                    <span className="text-xs opacity-50" style={{ color: tema.texto }}>
                      {new Date(m.fecha_registro).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2 mt-1" style={{ color: tema.texto }}>{m.texto}</p>
                </div>
              );
            })}
          </div>
        )}
      </UI.Tarjeta>
    </div>
  );
}