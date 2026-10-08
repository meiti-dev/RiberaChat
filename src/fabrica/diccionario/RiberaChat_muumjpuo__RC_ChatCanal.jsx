import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const RiberaChat_muumjpuo__RC_ChatCanal = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  
  const [canales, setCanales] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [prefs, setPrefs] = useState({ canal_activo: null });
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const cargarTodo = async () => {
    const [resCan, resMsgs, resPerf, resPrefs] = await Promise.all([
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('rc_canales')}?ecosistema=${eco}`),
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('rc_mensajes')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('rc_perfiles')}?ecosistema=${eco}`),
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('rc_preferencias')}?ecosistema=${eco}`)
    ]);
    
    if (resCan.ok) setCanales(resCan.registros);
    if (resPerf.ok) setPerfiles(resPerf.registros);
    
    let canalActivoId = null;
    if (resPrefs.ok && resPrefs.registros.length > 0) {
      setPrefs(resPrefs.registros[0]);
      canalActivoId = resPrefs.registros[0].canal_activo;
    }
    
    if (!canalActivoId && resCan.ok && resCan.registros.length > 0) {
      canalActivoId = resCan.registros[0].id;
      cambiarCanal(canalActivoId, resPrefs.registros[0]?.id);
    }

    if (resMsgs.ok && canalActivoId) {
      setMensajes(resMsgs.registros.filter(m => m.canal_id === canalActivoId && !m.hilo_id).sort((a, b) => new Date(a.fecha_registro) - new Date(b.fecha_registro)));
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarTodo();
    const interval = setInterval(cargarTodo, 5000);
    return () => clearInterval(interval);
  }, []);

  const cambiarCanal = async (canalId, prefId = prefs.id) => {
    setCargando(true);
    const payload = { id: prefId || `pref_${miId}`, usuario_id: miId, canal_activo: canalId };
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('rc_preferencias')}?ecosistema=${eco}`, {
      method: prefId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => { setPrefs(payload); cargarTodo(); }
    });
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !prefs.canal_activo) return;
    setEnviando(true);
    const payload = {
      id: `msg_${Date.now()}`,
      canal_id: prefs.canal_activo,
      autor_id: miId,
      usuario_id: miId,
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

  const canalActual = canales.find(c => c.id === prefs.canal_activo);

  const historialMapeado = mensajes.map(m => {
    const autor = perfiles.find(p => p.usuario_id === m.autor_id) || { nombre: MEITI.t('unknown_user', null, 'Usuario'), avatar_url: 'avatares/toon_1.png' };
    return {
      id: m.id,
      texto: m.texto,
      esMio: m.autor_id === miId,
      autor: autor.nombre,
      avatar: autor.avatar_url || 'avatares/toon_1.png',
      fecha: m.fecha_registro
    };
  });

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full min-h-0">
      <UI.Tarjeta className="md:w-64 flex flex-col gap-2 min-h-0">
        <div className="text-xs uppercase tracking-wider opacity-60 px-2 py-1 font-bold" style={{ color: tema.texto }}>
          {MEITI.t('channels', null, 'Canales')}
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0">
          {canales.length === 0 ? (
            <UI.EstadoVacio icono="fa-hashtag" mensaje={MEITI.t('no_channels', null, 'No hay canales disponibles')} />
          ) : (
            canales.map(c => (
              <button 
                key={c.id} 
                onClick={() => cambiarCanal(c.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors text-left"
                style={{ 
                  backgroundColor: prefs.canal_activo === c.id ? tema.colorPrimario + '22' : 'transparent', 
                  color: prefs.canal_activo === c.id ? tema.colorPrimario : tema.texto 
                }}
              >
                <i className="fa-solid fa-hashtag opacity-70 text-xs"></i>
                <span className="truncate">{c.nombre}</span>
              </button>
            ))
          )}
        </div>
      </UI.Tarjeta>

      <UI.Tarjeta className="flex-1 flex flex-col min-h-0 p-0 overflow-hidden">
        {cargando && mensajes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <i className="fa-solid fa-circle-notch fa-spin text-3xl" style={{ color: tema.colorPrimario }}></i>
          </div>
        ) : !canalActual ? (
          <UI.EstadoVacio icono="fa-hashtag" mensaje={MEITI.t('select_channel', null, 'Selecciona un canal para empezar')} />
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="p-4 border-b flex items-center gap-3 shadow-sm z-10" style={{ borderColor: tema.texto + '11', backgroundColor: tema.superficie }}>
              <i className="fa-solid fa-hashtag text-xl" style={{ color: tema.colorPrimario }}></i>
              <div>
                <h2 className="font-bold text-lg leading-tight" style={{ color: tema.texto }}>{canalActual.nombre}</h2>
                <p className="text-xs opacity-60" style={{ color: tema.texto }}>{canalActual.descripcion || MEITI.t('no_description', null, 'Sin descripción')}</p>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <UI.Chat 
                historial={historialMapeado} 
                valor={nuevoMensaje} 
                onCambio={(v) => setNuevoMensaje(v?.target ? v.target.value : v)} 
                onEnviar={enviarMensaje} 
                escribiendo={enviando} 
              />
            </div>
          </div>
        )}
      </UI.Tarjeta>
    </div>
  );
};

export default RiberaChat_muumjpuo__RC_ChatCanal;
