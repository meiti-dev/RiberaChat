/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();

  const [termino, setTermino] = useState('');
  const [filtroCanal, setFiltroCanal] = useState('');
  const [filtroAutor, setFiltroAutor] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [soloArchivos, setSoloArchivos] = useState('0');

  const [canales, setCanales] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [buscado, setBuscado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarFiltros = async () => {
      const [resCanales, resPerfiles] = await Promise.all([
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('rc_canales')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('rc_perfiles')}?ecosistema=${eco}`)
      ]);
      if (resCanales.ok) setCanales(resCanales.registros || []);
      if (resPerfiles.ok) setPerfiles(resPerfiles.registros || []);
    };
    cargarFiltros();
  }, []);

  const ejecutarBusqueda = async (e) => {
    if (e) e.preventDefault();
    setCargando(true);
    setError(null);
    setBuscado(true);

    const resMsg = await MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('rc_mensajes')}?ecosistema=${eco}`);
    if (!resMsg.ok) {
      setError(resMsg.error || MEITI.t('search_error', null, 'No se pudieron cargar los mensajes para buscar.'));
      setCargando(false);
      return;
    }

    let filtrados = resMsg.registros || [];

    if (termino.trim()) {
      const t = termino.toLowerCase();
      filtrados = filtrados.filter(m => (m.texto || '').toLowerCase().includes(t));
    }
    if (filtroCanal) {
      filtrados = filtrados.filter(m => m.canal_id === filtroCanal);
    }
    if (filtroAutor) {
      filtrados = filtrados.filter(m => m.autor_id === filtroAutor);
    }
    if (soloArchivos === '1') {
      filtrados = filtrados.filter(m => m.adjunto_url && m.adjunto_url.trim() !== '');
    }
    if (filtroDesde) {
      filtrados = filtrados.filter(m => new Date(m.fecha_registro) >= new Date(filtroDesde));
    }
    if (filtroHasta) {
      const hasta = new Date(filtroHasta);
      hasta.setDate(hasta.getDate() + 1);
      filtrados = filtrados.filter(m => new Date(m.fecha_registro) < hasta);
    }

    setResultados(filtrados.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro)));
    setCargando(false);
  };

  const irAlContexto = async (msg) => {
    if (msg.canal_id) {
      const resPref = await MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('rc_preferencias')}?ecosistema=${eco}`);
      let pref = (resPref.ok && resPref.registros.length > 0) ? resPref.registros[0] : { id: 'pref_' + miId, usuario_id: miId };
      pref.canal_activo = msg.canal_id;
      
      await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('rc_preferencias')}?ecosistema=${eco}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pref)
      }, {
        alLograr: () => MEITI.irAPagina('canal'),
        alFallar: (err) => setError(err || MEITI.t('nav_error', null, 'No se pudo navegar al canal.'))
      });
    } else if (msg.receptor_id) {
      MEITI.irAPagina('mensajes_directos');
    }
  };

  const obtenerPerfil = (autorId) => perfiles.find(p => p.usuario_id === autorId || p.id === autorId) || {};
  const obtenerCanal = (canalId) => canales.find(c => c.id === canalId) || {};

  return (
    <div className="flex flex-col gap-6 h-full min-h-0">
      <Animacion.motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <UI.Tarjeta className="flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <Iconos.Search size={24} color={tema.colorPrimario} />
            <h2 className="text-xl font-black tracking-tight" style={{ color: tema.texto }}>
              {MEITI.t('search_title', null, 'Búsqueda Avanzada')}
            </h2>
          </div>

          <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />

          <form onSubmit={ejecutarBusqueda} className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <UI.Campo 
                  etiqueta={MEITI.t('search_term', null, 'Palabra clave o frase')}
                  tipo="text"
                  valor={termino}
                  onChange={(e) => setTermino(e.target.value)}
                  placeholder={MEITI.t('search_placeholder', null, 'Ej: reporte de ventas...')}
                />
              </div>
              <div className="w-full md:w-auto">
                <UI.Boton tipo="submit" variante="primario" disabled={cargando}>
                  <span className="flex items-center gap-2">
                    {cargando ? <Iconos.LoaderCircle size={18} className="animate-spin" /> : <Iconos.Search size={18} />}
                    {cargando ? MEITI.t('searching', null, 'Buscando...') : MEITI.t('search_btn', null, 'Buscar')}
                  </span>
                </UI.Boton>
              </div>
            </div>

            <div className="p-4 rounded-xl flex flex-col gap-4" style={{ backgroundColor: tema.fondo, border: `1px solid ${tema.colorPrimario}22` }}>
              <div className="flex items-center gap-2 opacity-70">
                <Iconos.Filter size={16} color={tema.texto} />
                <UI.Etiqueta>{MEITI.t('filters_title', null, 'Filtros adicionales')}</UI.Etiqueta>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex-1">
                  <UI.Campo 
                    etiqueta={MEITI.t('filter_channel', null, 'Canal')}
                    tipo="select"
                    valor={filtroCanal}
                    onChange={(e) => setFiltroCanal(e.target.value)}
                    opciones={[{ value: '', label: MEITI.t('all_channels', null, 'Todos los canales') }, ...canales.map(c => ({ value: c.id, label: c.nombre }))]}
                  />
                </div>
                <div className="flex-1">
                  <UI.Campo 
                    etiqueta={MEITI.t('filter_author', null, 'Autor')}
                    tipo="select"
                    valor={filtroAutor}
                    onChange={(e) => setFiltroAutor(e.target.value)}
                    opciones={[{ value: '', label: MEITI.t('all_authors', null, 'Cualquier autor') }, ...perfiles.map(p => ({ value: p.usuario_id || p.id, label: p.nombre }))]}
                  />
                </div>
                <div className="flex-1">
                  <UI.Campo 
                    etiqueta={MEITI.t('filter_date_from', null, 'Desde')}
                    tipo="date"
                    valor={filtroDesde}
                    onChange={(e) => setFiltroDesde(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <UI.Campo 
                    etiqueta={MEITI.t('filter_date_to', null, 'Hasta')}
                    tipo="date"
                    valor={filtroHasta}
                    onChange={(e) => setFiltroHasta(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 md:w-1/4">
                <UI.Campo 
                  etiqueta={MEITI.t('filter_attachments', null, 'Archivos adjuntos')}
                  tipo="select"
                  valor={soloArchivos}
                  onChange={(e) => setSoloArchivos(e.target.value)}
                  opciones={[
                    { value: '0', label: MEITI.t('attach_any', null, 'Mostrar todos') },
                    { value: '1', label: MEITI.t('attach_only', null, 'Solo mensajes con archivos') }
                  ]}
                />
              </div>
            </div>
          </form>
        </UI.Tarjeta>
      </Animacion.motion.div>

      <div className="flex flex-col flex-1 min-h-0">
        {buscado && (
          <div className="mb-3 flex items-center justify-between">
            <UI.Etiqueta>{MEITI.t('results_title', null, 'Resultados de la búsqueda')}</UI.Etiqueta>
            <UI.Chip tono="neutro">
              {MEITI.t('results_count', { n: resultados.length }, '{n} encontrados')}
            </UI.Chip>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 flex flex-col gap-3">
          {!buscado && !cargando && (
            <UI.EstadoVacio 
              icono="fa-magnifying-glass" 
              mensaje={MEITI.t('search_empty_state', null, 'Ingresa tus criterios arriba y presiona Buscar para encontrar mensajes o archivos.')} 
            />
          )}

          {buscado && !cargando && resultados.length === 0 && (
            <UI.EstadoVacio 
              icono="fa-inbox" 
              mensaje={MEITI.t('search_no_results', null, 'No se encontraron mensajes que coincidan con los filtros.')} 
            />
          )}

          <Animacion.AnimatePresence>
            {resultados.map((msg, index) => {
              const perfil = obtenerPerfil(msg.autor_id);
              const canal = obtenerCanal(msg.canal_id);
              const avatarUrl = perfil.avatar_url || 'avatares/memo_1.png';
              const fecha = new Date(msg.fecha_registro).toLocaleString();

              return (
                <Animacion.motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index < 10 ? index * 0.05 : 0 }}
                >
                  <div 
                    onClick={() => irAlContexto(msg)}
                    className="p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] shadow-sm hover:shadow-md flex flex-col gap-3"
                    style={{ backgroundColor: tema.superficie, border: `1px solid ${tema.texto}11` }}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <img src={avatarUrl} alt={perfil.nombre || 'Usuario'} className="w-10 h-10 rounded-full object-cover bg-black/5" />
                        <div className="flex flex-col">
                          <span className="font-bold text-sm" style={{ color: tema.texto }}>{perfil.nombre || MEITI.t('unknown_user', null, 'Usuario desconocido')}</span>
                          <span className="text-xs opacity-60 font-mono" style={{ color: tema.texto }}>{fecha}</span>
                        </div>
                      </div>
                      {canal.nombre && (
                        <UI.Chip tono="neutro">
                          <span className="flex items-center gap-1">
                            <Iconos.Hash size={12} /> {canal.nombre}
                          </span>
                        </UI.Chip>
                      )}
                    </div>

                    <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: tema.texto }}>
                      {msg.texto}
                    </p>

                    {msg.adjunto_url && (
                      <div className="flex items-center gap-2 p-2 rounded-lg mt-1 w-fit" style={{ backgroundColor: tema.fondo, border: `1px solid ${tema.colorPrimario}33` }}>
                        <Iconos.Paperclip size={16} color={tema.colorPrimario} />
                        <span className="text-xs font-bold" style={{ color: tema.colorPrimario }}>
                          {MEITI.t('attachment_included', null, 'Archivo adjunto')}
                        </span>
                      </div>
                    )}
                  </div>
                </Animacion.motion.div>
              );
            })}
          </Animacion.AnimatePresence>
        </div>
      </div>
    </div>
  );
}