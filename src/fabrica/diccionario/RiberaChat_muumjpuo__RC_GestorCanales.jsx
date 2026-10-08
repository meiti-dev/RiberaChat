import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const RiberaChat_muumjpuo__RC_GestorCanales = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  const [canales, setCanales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [form, setForm] = useState({ id: '', nombre: '', descripcion: '', tipo: 'publico' });

  const cargar = async () => {
    setCargando(true);
    const res = await MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('rc_canales')}?ecosistema=${eco}`);
    if (res.ok) setCanales(res.registros);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null); setExito(null);
    if (!form.nombre.trim()) return setError(MEITI.t('channel_name_req', null, 'El nombre del canal es obligatorio.'));
    
    const payload = {
      id: form.id || `can_${Date.now()}`,
      nombre: form.nombre.trim().toLowerCase().replace(/\s+/g, '-'),
      descripcion: form.descripcion.trim(),
      tipo: form.tipo,
      creador_id: miId,
      fecha_creacion: form.id ? undefined : new Date().toISOString()
    };

    const res = await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('rc_canales')}?ecosistema=${eco}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(form.id ? MEITI.t('channel_updated', null, 'Canal actualizado.') : MEITI.t('channel_created', null, 'Canal creado.'));
        setForm({ id: '', nombre: '', descripcion: '', tipo: 'publico' });
        cargar();
      },
      alFallar: (err) => setError(err || MEITI.t('error_saving', null, 'Error al guardar.'))
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('delete_channel_q', null, '¿Borrar este canal y todos sus mensajes?'), { titulo: MEITI.t('delete', null, 'Borrar'), confirmar: MEITI.t('yes_delete', null, 'Sí, borrar'), tono: 'peligro' })) return;
    setError(null); setExito(null);
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('rc_canales')}?ecosistema=${eco}&id=${id}`, { method: 'DELETE' }, {
      alLograr: () => {
        setExito(MEITI.t('channel_deleted', null, 'Canal borrado.'));
        if (form.id === id) setForm({ id: '', nombre: '', descripcion: '', tipo: 'publico' });
        cargar();
      },
      alFallar: (err) => setError(err || MEITI.t('error_deleting', null, 'Error al borrar.'))
    });
  };

  const editar = (fila) => {
    setForm({ id: fila.id, nombre: fila.nombre, descripcion: fila.descripcion || '', tipo: fila.tipo || 'publico' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const columnas = [
    { clave: 'nombre', etiqueta: MEITI.t('name', null, 'Nombre'), render: (f) => <span className="font-bold">#{f.nombre}</span> },
    { clave: 'descripcion', etiqueta: MEITI.t('description', null, 'Descripción') },
    { clave: 'tipo', etiqueta: MEITI.t('type', null, 'Tipo'), render: (f) => <UI.Chip tono={f.tipo === 'publico' ? 'exito' : 'alerta'}>{f.tipo}</UI.Chip> },
    { clave: 'fecha_creacion', etiqueta: MEITI.t('created', null, 'Creado'), tipo: 'fecha' }
  ];

  return (
    <div className="flex flex-col gap-6">
      <UI.Tarjeta>
        <div className="flex items-center gap-2 mb-4">
          <Iconos.Hash size={20} color={tema.colorPrimario} />
          <UI.Etiqueta>{form.id ? MEITI.t('edit_channel', null, 'Editar Canal') : MEITI.t('new_channel', null, 'Nuevo Canal')}</UI.Etiqueta>
        </div>
        <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
        <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />
        <form onSubmit={guardar} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex-1">
              <UI.Campo etiqueta={MEITI.t('channel_name', null, 'Nombre del canal')} tipo="text" valor={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="ej: anuncios-generales" />
            </div>
            <div className="flex-1">
              <UI.Campo etiqueta={MEITI.t('visibility', null, 'Visibilidad')} tipo="select" valor={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} opciones={[{value:'publico', label: MEITI.t('public', null, 'Público')}, {value:'privado', label: MEITI.t('private', null, 'Privado')}]} />
            </div>
            <div className="md:col-span-3 flex-1">
              <UI.Campo etiqueta={MEITI.t('description', null, 'Descripción')} tipo="text" valor={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Propósito de este canal" />
            </div>
          </div>
          <div className="flex gap-2">
            <UI.Boton tipo="submit" variante="primario">{form.id ? MEITI.t('update', null, 'Actualizar') : MEITI.t('create', null, 'Crear')}</UI.Boton>
            {form.id && <UI.Boton tipo="button" variante="secundario" onClick={() => setForm({ id: '', nombre: '', descripcion: '', tipo: 'publico' })}>{MEITI.t('cancel', null, 'Cancelar')}</UI.Boton>}
          </div>
        </form>
      </UI.Tarjeta>

      <UI.Tarjeta>
        <UI.Etiqueta>{MEITI.t('directory', null, 'Directorio de Canales')}</UI.Etiqueta>
        {cargando ? <p style={{color: tema.texto}} className="mt-4">{MEITI.t('loading', null, 'Cargando...')}</p> : canales.length === 0 ? <UI.EstadoVacio icono="fa-hashtag" mensaje={MEITI.t('no_channels', null, 'No hay canales creados.')} /> : (
          <div className="mt-4">
            <UI.TablaDatos columnas={columnas} datos={canales} claveId="id" onEditar={editar} onBorrar={(fila) => borrar(fila.id)} />
          </div>
        )}
      </UI.Tarjeta>
    </div>
  );
};

export default RiberaChat_muumjpuo__RC_GestorCanales;
