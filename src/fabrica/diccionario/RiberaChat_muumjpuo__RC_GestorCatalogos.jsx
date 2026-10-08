import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const RiberaChat_muumjpuo__RC_GestorCatalogos = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const esAdmin = MEITI.miRolEnLaApp() === 'admin' || MEITI.soyDuenoDeLaApp();

  const [pestana, setPestana] = useState('temas');
  const [temasCat, setTemasCat] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const formVacioTema = { id: '', nombre: '', icono: '' };
  const formVacioEstado = { id: '', nombre: '', icono: '', color: '#10b981' };
  const [formTema, setFormTema] = useState(formVacioTema);
  const [formEstado, setFormEstado] = useState(formVacioEstado);
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    const [resTemas, resEstados] = await Promise.all([
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('rc_catalogos_temas')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('rc_catalogos_estados')}?ecosistema=${eco}`)
    ]);
    if (resTemas.ok) setTemasCat(resTemas.registros || []);
    if (resEstados.ok) setEstados(resEstados.registros || []);
    setCargando(false);
  };

  useEffect(() => {
    if (esAdmin) cargarDatos();
  }, [esAdmin]);

  if (!esAdmin) {
    return <UI.Aviso tono="peligro" mensaje={MEITI.t('admin_only', null, 'Acceso denegado: Esta sección es solo para administradores.')} />;
  }

  const guardarTema = async (e) => {
    e.preventDefault();
    if (!formTema.nombre.trim()) return setError(MEITI.t('err_name_req', null, 'El nombre es obligatorio.'));
    setGuardando(true); setError(null); setExito(null);
    const esNuevo = !formTema.id;
    const payload = { ...formTema, id: esNuevo ? 'tema_' + Date.now() : formTema.id };
    
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('rc_catalogos_temas')}?ecosistema=${eco}`, {
      method: esNuevo ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => { 
        setExito(MEITI.t('tema_saved', null, 'Tema guardado correctamente.')); 
        setFormTema(formVacioTema); 
        cargarDatos(); 
        setGuardando(false); 
      },
      alFallar: (err) => { 
        setError(err || MEITI.t('err_saving', null, 'Error al guardar el tema.')); 
        setGuardando(false); 
      }
    });
  };

  const guardarEstado = async (e) => {
    e.preventDefault();
    if (!formEstado.nombre.trim()) return setError(MEITI.t('err_name_req', null, 'El nombre es obligatorio.'));
    setGuardando(true); setError(null); setExito(null);
    const esNuevo = !formEstado.id;
    const payload = { ...formEstado, id: esNuevo ? 'est_' + Date.now() : formEstado.id };
    
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('rc_catalogos_estados')}?ecosistema=${eco}`, {
      method: esNuevo ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => { 
        setExito(MEITI.t('estado_saved', null, 'Estado guardado correctamente.')); 
        setFormEstado(formVacioEstado); 
        cargarDatos(); 
        setGuardando(false); 
      },
      alFallar: (err) => { 
        setError(err || MEITI.t('err_saving', null, 'Error al guardar el estado.')); 
        setGuardando(false); 
      }
    });
  };

  const borrarTema = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('del_tema_q', null, '¿Borrar este tema?'), { titulo: MEITI.t('delete', null, 'Borrar'), confirmar: MEITI.t('yes_delete', null, 'Sí, borrar'), tono: 'peligro' })) return;
    setError(null); setExito(null);
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('rc_catalogos_temas')}?ecosistema=${eco}&id=${id}`, { method: 'DELETE' }, {
      alLograr: () => { 
        setExito(MEITI.t('tema_deleted', null, 'Tema eliminado.')); 
        if (formTema.id === id) setFormTema(formVacioTema); 
        cargarDatos(); 
      },
      alFallar: (err) => setError(err || MEITI.t('err_deleting', null, 'Error al eliminar.'))
    });
  };

  const borrarEstado = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('del_estado_q', null, '¿Borrar este estado?'), { titulo: MEITI.t('delete', null, 'Borrar'), confirmar: MEITI.t('yes_delete', null, 'Sí, borrar'), tono: 'peligro' })) return;
    setError(null); setExito(null);
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('rc_catalogos_estados')}?ecosistema=${eco}&id=${id}`, { method: 'DELETE' }, {
      alLograr: () => { 
        setExito(MEITI.t('estado_deleted', null, 'Estado eliminado.')); 
        if (formEstado.id === id) setFormEstado(formVacioEstado); 
        cargarDatos(); 
      },
      alFallar: (err) => setError(err || MEITI.t('err_deleting', null, 'Error al eliminar.'))
    });
  };

  const editarTema = (fila) => {
    setFormTema({ id: fila.id, nombre: fila.nombre || '', icono: fila.icono || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editarEstado = (fila) => {
    setFormEstado({ id: fila.id, nombre: fila.nombre || '', icono: fila.icono || '', color: fila.color || '#10b981' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const colsTemas = [
    { clave: 'icono', etiqueta: MEITI.t('col_icon', null, 'Ícono'), render: (f) => f.icono ? <i className={`fa-solid ${f.icono}`} style={{ color: tema.colorPrimario }}></i> : '-' },
    { clave: 'nombre', etiqueta: MEITI.t('col_name', null, 'Nombre') }
  ];

  const colsEstados = [
    { clave: 'icono', etiqueta: MEITI.t('col_icon', null, 'Ícono'), render: (f) => f.icono ? <i className={`fa-solid ${f.icono}`} style={{ color: f.color || tema.texto }}></i> : '-' },
    { clave: 'nombre', etiqueta: MEITI.t('col_name', null, 'Nombre') },
    { clave: 'color', etiqueta: MEITI.t('col_color', null, 'Color'), render: (f) => (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: f.color || tema.texto }}></div>
        <span className="text-xs font-mono opacity-70">{f.color}</span>
      </div>
    )}
  ];

  return (
    <div className="flex flex-col gap-6">
      <UI.Pestanas 
        pestanas={[
          { id: 'temas', titulo: MEITI.t('tab_temas', null, 'Temas de Canales'), icono: 'fa-hashtag' },
          { id: 'estados', titulo: MEITI.t('tab_estados', null, 'Estados de Personal'), icono: 'fa-user-clock' }
        ]}
        activa={pestana}
        onCambio={(p) => { setPestana(p); setError(null); setExito(null); }}
      />

      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

      <Animacion.AnimatePresence mode="wait">
        {pestana === 'temas' && (
          <Animacion.motion.div key="temas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col gap-6">
            <UI.Tarjeta>
              <div className="flex items-center gap-2 mb-4">
                <Iconos.Hash size={20} color={tema.colorPrimario} />
                <UI.Etiqueta>{formTema.id ? MEITI.t('edit_tema', null, 'Editar Tema') : MEITI.t('new_tema', null, 'Nuevo Tema')}</UI.Etiqueta>
              </div>
              <form onSubmit={guardarTema} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex-1">
                    <UI.Campo etiqueta={MEITI.t('f_name', null, 'Nombre del tema')} tipo="text" valor={formTema.nombre} onChange={e => setFormTema({...formTema, nombre: e.target.value})} placeholder={MEITI.t('ph_tema_name', null, 'Ej: General, Soporte')} />
                  </div>
                  <div className="flex-1">
                    <UI.Campo etiqueta={MEITI.t('f_icon', null, 'Clase de Ícono (FontAwesome)')} tipo="text" valor={formTema.icono} onChange={e => setFormTema({...formTema, icono: e.target.value})} placeholder="fa-hashtag" />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <UI.Boton tipo="submit" variante="primario" disabled={guardando}>
                    <span className="flex items-center gap-2"><Iconos.Save size={16} /> {guardando ? MEITI.t('saving', null, 'Guardando...') : (formTema.id ? MEITI.t('btn_update', null, 'Actualizar') : MEITI.t('btn_create', null, 'Crear Tema'))}</span>
                  </UI.Boton>
                  {formTema.id && (
                    <UI.Boton tipo="button" variante="secundario" onClick={() => setFormTema(formVacioTema)}>
                      <span className="flex items-center gap-2"><Iconos.X size={16} /> {MEITI.t('btn_cancel', null, 'Cancelar')}</span>
                    </UI.Boton>
                  )}
                </div>
              </form>
            </UI.Tarjeta>

            <UI.Tarjeta className="flex flex-col flex-1 min-h-0">
              <UI.Etiqueta>{MEITI.t('list_temas', null, 'Temas Registrados')}</UI.Etiqueta>
              <div className="mt-4 flex-1 min-h-0">
                {cargando ? (
                  <p style={{color: tema.texto}} className="opacity-70">{MEITI.t('loading', null, 'Cargando...')}</p>
                ) : temasCat.length === 0 ? (
                  <UI.EstadoVacio icono="fa-hashtag" mensaje={MEITI.t('empty_temas', null, 'No hay temas registrados.')} />
                ) : (
                  <UI.TablaDatos columnas={colsTemas} datos={temasCat} claveId="id" onEditar={editarTema} onBorrar={(fila) => borrarTema(fila.id)} />
                )}
              </div>
            </UI.Tarjeta>
          </Animacion.motion.div>
        )}

        {pestana === 'estados' && (
          <Animacion.motion.div key="estados" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col gap-6">
            <UI.Tarjeta>
              <div className="flex items-center gap-2 mb-4">
                <Iconos.UserCog size={20} color={tema.colorPrimario} />
                <UI.Etiqueta>{formEstado.id ? MEITI.t('edit_estado', null, 'Editar Estado') : MEITI.t('new_estado', null, 'Nuevo Estado')}</UI.Etiqueta>
              </div>
              <form onSubmit={guardarEstado} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex-1">
                    <UI.Campo etiqueta={MEITI.t('f_name', null, 'Nombre del estado')} tipo="text" valor={formEstado.nombre} onChange={e => setFormEstado({...formEstado, nombre: e.target.value})} placeholder={MEITI.t('ph_estado_name', null, 'Ej: Disponible, Ocupado')} />
                  </div>
                  <div className="flex-1">
                    <UI.Campo etiqueta={MEITI.t('f_icon', null, 'Clase de Ícono')} tipo="text" valor={formEstado.icono} onChange={e => setFormEstado({...formEstado, icono: e.target.value})} placeholder="fa-circle-check" />
                  </div>
                  <div className="flex-1">
                    <UI.Campo etiqueta={MEITI.t('f_color', null, 'Color (Hex)')} tipo="text" valor={formEstado.color} onChange={e => setFormEstado({...formEstado, color: e.target.value})} placeholder="#10b981" />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <UI.Boton tipo="submit" variante="primario" disabled={guardando}>
                    <span className="flex items-center gap-2"><Iconos.Save size={16} /> {guardando ? MEITI.t('saving', null, 'Guardando...') : (formEstado.id ? MEITI.t('btn_update', null, 'Actualizar') : MEITI.t('btn_create', null, 'Crear Estado'))}</span>
                  </UI.Boton>
                  {formEstado.id && (
                    <UI.Boton tipo="button" variante="secundario" onClick={() => setFormEstado(formVacioEstado)}>
                      <span className="flex items-center gap-2"><Iconos.X size={16} /> {MEITI.t('btn_cancel', null, 'Cancelar')}</span>
                    </UI.Boton>
                  )}
                </div>
              </form>
            </UI.Tarjeta>

            <UI.Tarjeta className="flex flex-col flex-1 min-h-0">
              <UI.Etiqueta>{MEITI.t('list_estados', null, 'Estados Registrados')}</UI.Etiqueta>
              <div className="mt-4 flex-1 min-h-0">
                {cargando ? (
                  <p style={{color: tema.texto}} className="opacity-70">{MEITI.t('loading', null, 'Cargando...')}</p>
                ) : estados.length === 0 ? (
                  <UI.EstadoVacio icono="fa-user-clock" mensaje={MEITI.t('empty_estados', null, 'No hay estados registrados.')} />
                ) : (
                  <UI.TablaDatos columnas={colsEstados} datos={estados} claveId="id" onEditar={editarEstado} onBorrar={(fila) => borrarEstado(fila.id)} />
                )}
              </div>
            </UI.Tarjeta>
          </Animacion.motion.div>
        )}
      </Animacion.AnimatePresence>
    </div>
  );
};

export default RiberaChat_muumjpuo__RC_GestorCatalogos;
