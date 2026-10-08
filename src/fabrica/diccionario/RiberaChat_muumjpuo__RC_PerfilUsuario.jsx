import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const RiberaChat_muumjpuo__RC_PerfilUsuario = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  const [perfil, setPerfil] = useState({ nombre: '', avatar_url: '', cargo: '' });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargar = async () => {
    setCargando(true);
    const res = await MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('rc_perfiles')}?ecosistema=${eco}`);
    if (res.ok && res.registros.length > 0) {
      setPerfil(res.registros[0]);
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    const payload = {
      id: perfil.id || `perf_${miId}`,
      usuario_id: miId,
      nombre: perfil.nombre,
      avatar_url: perfil.avatar_url,
      cargo: perfil.cargo
    };
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('rc_perfiles')}?ecosistema=${eco}`, {
      method: perfil.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setMensaje({ texto: MEITI.t('profile_saved', null, 'Perfil actualizado correctamente.'), tono: 'exito' });
        cargar();
        setGuardando(false);
      },
      alFallar: (err) => {
        setMensaje({ texto: err || MEITI.t('error_saving', null, 'Error al guardar.'), tono: 'peligro' });
        setGuardando(false);
      }
    });
  };

  if (cargando) return <UI.Tarjeta><div className="p-4 text-center"><Iconos.Loader className="animate-spin mx-auto" color={tema.colorPrimario} /></div></UI.Tarjeta>;

  return (
    <UI.Tarjeta>
      <div className="flex items-center gap-3 mb-4">
        <Iconos.UserCircle size={24} color={tema.colorPrimario} />
        <h2 className="text-xl font-bold" style={{ color: tema.texto }}>{MEITI.t('my_profile', null, 'Mi Perfil')}</h2>
      </div>
      {mensaje && <UI.Aviso mensaje={mensaje.texto} tono={mensaje.tono} onCerrar={() => setMensaje(null)} />}
      <form onSubmit={guardar} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex-1">
            <UI.Campo etiqueta={MEITI.t('display_name', null, 'Nombre a mostrar')} tipo="text" valor={perfil.nombre} onChange={e => setPerfil({...perfil, nombre: e.target.value})} placeholder="Ej: Ana Gómez" />
          </div>
          <div className="flex-1">
            <UI.Campo etiqueta={MEITI.t('job_title', null, 'Cargo / Rol')} tipo="text" valor={perfil.cargo} onChange={e => setPerfil({...perfil, cargo: e.target.value})} placeholder="Ej: Contadora Senior" />
          </div>
          <div className="md:col-span-2 flex-1">
            <UI.Campo etiqueta={MEITI.t('avatar_url', null, 'URL del Avatar (opcional)')} tipo="text" valor={perfil.avatar_url} onChange={e => setPerfil({...perfil, avatar_url: e.target.value})} placeholder="https://..." />
          </div>
        </div>
        <div className="flex justify-end">
          <UI.Boton tipo="submit" variante="primario" disabled={guardando}>
            <span className="flex items-center gap-2"><Iconos.Save size={16} /> {guardando ? MEITI.t('saving', null, 'Guardando...') : MEITI.t('save_profile', null, 'Guardar Perfil')}</span>
          </UI.Boton>
        </div>
      </form>
    </UI.Tarjeta>
  );
};

export default RiberaChat_muumjpuo__RC_PerfilUsuario;
