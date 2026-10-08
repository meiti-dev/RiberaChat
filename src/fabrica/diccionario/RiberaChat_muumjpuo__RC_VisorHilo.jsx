import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const RiberaChat_muumjpuo__RC_VisorHilo = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  const [hiloId, setHiloId] = useState(null);
  const [mensajePadre, setMensajePadre] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [nuevaRespuesta, setNuevaRespuesta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const cargar = async () => {
    const [resPrefs, resMsgs, resPerf] = await Promise.all([
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('rc_preferencias')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('rc_mensajes')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('rc_perfiles')}?ecosistema=${eco}`)
    ]);

    if (resPerf.ok) setPerfiles(resPerf.registros);

    if (resPrefs.ok && resPrefs.registros.length > 0) {
      const idActivo = resPrefs.registros[0].hilo_activo;
      setHiloId(idActivo);
      if (resMsgs.ok && idActivo) {
        const padre = resMsgs.registros.find(m => m.id === idActivo);
        const resps = resMsgs.registros.filter(m => m.hilo_id === idActivo).sort((a, b) => new Date(a.fecha_registro) - new Date(b.fecha_registro));
        setMensajePadre(padre);
        setRespuestas(resps);
      }
    }
    setCargando(false);
  };

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 5000);
    return () => clearInterval(interval);
  }, []);

  const enviarRespuesta = async (e) => {
    e.preventDefault();
    if (!nuevaRespuesta.trim() || !hiloId) return;
    setEnviando(true);
    const payload = {
      id: `msg_${Date.now()}`,
      canal_id: mensajePadre?.canal_id,
      hilo_id: hiloId,
      autor_id: miId,
      texto: nuevaRespuesta.trim(),
      fecha_registro: new Date().toISOString()
    };
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('rc_mensajes')}?ecosistema=${eco}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => { setNuevaRespuesta(''); cargar(); setEnviando(false); },
      alFallar: () => setEnviando(false)
    });
  };

  if (cargando) return <UI.Tarjeta><div className="p-8 text-center"><Iconos.Loader className="animate-spin mx-auto" color={tema.colorPrimario} /></div></UI.Tarjeta>;
  if (!mensajePadre) return <UI.Tarjeta><UI.EstadoVacio icono="fa-thread" mensaje={MEITI.t('no_thread_selected', null, 'No hay ningún hilo seleccionado.')} /></UI.Tarjeta>;

  const autorPadre = perfiles.find(p => p.usuario_id === mensajePadre.autor_id) || { nombre: 'Usuario', avatar_url: 'avatares/toon_1.png' };

  return (
    <UI.Tarjeta className="flex flex-col p-0 overflow-hidden">
      <div className="p-4 border-b flex items-center gap-3 shadow-sm z-10" style={{ borderColor: tema.texto + '11', backgroundColor: tema.superficie }}>
        <button onClick={() => MEITI.irAPagina('canal')} className="p-2 rounded-full hover:bg-black/5 transition-colors">
          <Iconos.ArrowLeft size={20} color={tema.texto} />
        </button>
        <h2 className="font-bold text-lg" style={{ color: tema.texto }}>{MEITI.t('thread', null, 'Hilo')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div className="flex gap-3 pb-6 border-b" style={{ borderColor: tema.texto + '11' }}>
          <img src={autorPadre.avatar_url || 'avatares/toon_1.png'} alt="avatar" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-base font-bold" style={{ color: tema.texto }}>{autorPadre.nombre}</span>
              <span className="text-xs opacity-50" style={{ color: tema.texto }}>{new Date(mensajePadre.fecha_registro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <p className="text-base" style={{ color: tema.texto }}>{mensajePadre.texto}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-xs font-bold opacity-50 uppercase tracking-wider" style={{ color: tema.texto }}>{respuestas.length} {MEITI.t('replies', null, 'Respuestas')}</span>
          {respuestas.map(r => {
            const autor = perfiles.find(p => p.usuario_id === r.autor_id) || { nombre: 'Usuario', avatar_url: 'avatares/toon_1.png' };
            return (
              <div key={r.id} className="flex gap-3">
                <img src={autor.avatar_url || 'avatares/toon_1.png'} alt="avatar" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 mt-1" />
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold" style={{ color: tema.texto }}>{autor.nombre}</span>
                    <span className="text-xs opacity-50" style={{ color: tema.texto }}>{new Date(r.fecha_registro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-sm" style={{ color: tema.texto }}>{r.texto}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t" style={{ borderColor: tema.texto + '11', backgroundColor: tema.superficie }}>
        <form onSubmit={enviarRespuesta} className="flex gap-2">
          <div className="flex-1">
            <UI.Campo tipo="text" valor={nuevaRespuesta} onChange={e => setNuevaRespuesta(e.target.value)} placeholder={MEITI.t('reply_placeholder', null, 'Responde a este hilo...')} />
          </div>
          <UI.Boton tipo="submit" variante="primario" disabled={enviando || !nuevaRespuesta.trim()}>
            <Iconos.Send size={18} />
          </UI.Boton>
        </form>
      </div>
    </UI.Tarjeta>
  );
};

export default RiberaChat_muumjpuo__RC_VisorHilo;
