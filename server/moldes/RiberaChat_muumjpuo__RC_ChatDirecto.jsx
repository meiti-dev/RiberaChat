/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  const [perfiles, setPerfiles] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [prefs, setPrefs] = useState({ dm_activo: null });
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const cargarTodo = async () => {
    const [resPerf, resMsgs, resPrefs] = await Promise.all([
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('rc_perfiles')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('rc_mensajes')}?ecosistema=${eco}`),
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('rc_preferencias')}?ecosistema=${eco}`)
    ]);
    
    if (resPerf.ok) setPerfiles(resPerf.registros.filter(p => p.usuario_id !== miId));
    
    let dmActivoId = null;
    if (resPrefs.ok && resPrefs.registros.length > 0) {
      setPrefs(resPrefs.registros[0]);
      dmActivoId = resPrefs.registros[0].dm_activo;
    }

    if (resMsgs.ok && dmActivoId) {
      setMensajes(resMsgs.registros.filter(m => !m.canal_id && ((m.autor_id === miId && m.receptor_id === dmActivoId) || (m.autor_id === dmActivoId && m.receptor_id === miId))).sort((a, b) => new Date(a.fecha_registro) - new Date(b.fecha_registro)));
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarTodo();
    const interval = setInterval(cargarTodo, 5000);
    return () => clearInterval(interval);
  }, []);

  const cambiarDM = async (usuarioId, prefId = prefs.id) => {
    setCargando(true);
    const payload = { id: prefId || `pref_${miId}`, usuario_id: miId, dm_activo: usuarioId };
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('rc_preferencias')}?ecosistema=${eco}`, {
      method: prefId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => { setPrefs(payload); cargarTodo(); }
    });
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !prefs.dm_activo) return;
    setEnviando(true);
    const payload = {
      id: `msg_${Date.now()}`,
      canal_id: null,
      receptor_id: prefs.dm_activo,
      autor_id: miId,
      texto: nuevoMensaje.trim(),
      fecha_registro: new Date().toISOString()
    };
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('rc_mensajes')}?ecosistema=${eco}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => { setNuevoMensaje(''); cargarTodo(); setEnviando(false); },
      alFallar: () => setEnviando(false)
    });
  };

  const perfilActivo = perfiles.find(p => p.usuario_id === prefs.dm_activo);

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <UI.Tarjeta className="md:w-64 flex flex-col gap-2 overflow-y-auto">
        <div className="text-xs uppercase tracking-wider opacity-60 px-2 py-1 font-bold" style={{ color: tema.texto }}>{MEITI.t('contacts', null, 'Contactos')}</div>
        {perfiles.length === 0 ? (
          <p className="text-xs opacity-50 px-2" style={{ color: tema.texto }}>{MEITI.t('no_contacts', null, 'No hay otros usuarios registrados.')}</p>
        ) : (
          perfiles.map(p => (
            <button 
              key={p.id} 
              onClick={() => cambiarDM(p.usuario_id)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors text-left"
              style={{ 
                backgroundColor: prefs.dm_activo === p.usuario_id ? tema.colorPrimario + '22' : 'transparent', 
                color: prefs.dm_activo === p.usuario_id ? tema.colorPrimario : tema.texto 
              }}
            >
              <img src={p.avatar_url || 'avatares/toon_1.png'} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
              <span className="truncate">{p.nombre}</span>
            </button>
          ))
        )}
      </UI.Tarjeta>

      <UI.Tarjeta className="flex-1 flex flex-col min-h-0 p-0 overflow-hidden">
        {cargando && mensajes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center"><Iconos.Loader className="animate-spin" color={tema.colorPrimario} /></div>
        ) : !perfilActivo ? (
          <UI.EstadoVacio icono="fa-user-group" mensaje={MEITI.t('select_contact', null, 'Selecciona un contacto para chatear')} />
        ) : (
          <>
            <div className="p-4 border-b flex items-center gap-3 shadow-sm z-10" style={{ borderColor: tema.texto + '11', backgroundColor: tema.superficie }}>
              <img src={perfilActivo.avatar_url || 'avatares/toon_1.png'} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <h2 className="font-bold text-lg leading-tight" style={{ color: tema.texto }}>{perfilActivo.nombre}</h2>
                <p className="text-xs opacity-60" style={{ color: tema.texto }}>{perfilActivo.cargo || 'Compañero'}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
              {mensajes.length === 0 ? (
                <UI.EstadoVacio icono="fa-hand-wave" mensaje={MEITI.t('no_dms_yet', null, 'Envía el primer mensaje directo.')} />
              ) : (
                mensajes.map(m => {
                  const esMio = m.autor_id === miId;
                  return (
                    <div key={m.id} className={`flex flex-col max-w-[75%] ${esMio ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div className="px-4 py-2 rounded-2xl text-sm" style={{ backgroundColor: esMio ? tema.colorPrimario : tema.texto + '08', color: esMio ? '#fff' : tema.texto, borderBottomRightRadius: esMio ? '4px' : '16px', borderBottomLeftRadius: !esMio ? '4px' : '16px' }}>
                        {m.texto}
                      </div>
                      <span className="text-xs opacity-40 mt-1 px-1" style={{ color: tema.texto }}>{new Date(m.fecha_registro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t" style={{ borderColor: tema.texto + '11', backgroundColor: tema.superficie }}>
              <form onSubmit={enviarMensaje} className="flex gap-2">
                <div className="flex-1">
                  <UI.Campo tipo="text" valor={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)} placeholder={MEITI.t('type_dm', { nombre: perfilActivo.nombre }, 'Mensaje para {nombre}...')} />
                </div>
                <UI.Boton tipo="submit" variante="primario" disabled={enviando || !nuevoMensaje.trim()}>
                  <Iconos.Send size={18} />
                </UI.Boton>
              </form>
            </div>
          </>
        )}
      </UI.Tarjeta>
    </div>
  );
}