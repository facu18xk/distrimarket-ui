import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';
import { useApp } from '../../context/AppContext';

export const ContactModal: React.FC = () => {
  const { contactModalOpen, setContactModalOpen, user, sendContactMessage, theme } = useApp();
  const [nombre, setNombre] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !asunto.trim() || !mensaje.trim()) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    sendContactMessage(nombre, email, asunto, mensaje);
    setIsSent(true);
    setError('');

    // Reset after 3 seconds or allow manual close
    setTimeout(() => {
      setIsSent(false);
      setAsunto('');
      setMensaje('');
      setContactModalOpen(false);
    }, 2500);
  };

  const handleClose = () => {
    setIsSent(false);
    setError('');
    setContactModalOpen(false);
  };

  return (
    <ModalDialog
      isOpen={contactModalOpen}
      onClose={handleClose}
      title="Contactar al Equipo de Sistemas"
      subtitle="Envía un ticket o consulta directa al correo de los administradores (soporte@distrimarket.com)"
      maxWidth="md"
    >
      {isSent ? (
        <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-slate-800">¡Mensaje enviado con éxito!</h4>
          <p className="text-xs text-slate-500 max-w-sm">
            Tu consulta ha sido enviada al buzón del equipo de infraestructura y desarrollo. Recibirás respuesta en tu correo <strong className="text-slate-700">{email}</strong>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre y Apellido *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
                placeholder="ejemplo@distrimarket.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Asunto del Ticket o Consulta *
            </label>
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
              placeholder="Ej: Problema al transferir stock entre depósitos"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mensaje o Descripción del Problema *
            </label>
            <textarea
              rows={4}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
              placeholder="Detalla qué estabas haciendo o qué solicitud tienes para los administradores..."
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ backgroundColor: theme.primaryHex }}
              className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center space-x-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar a Soporte</span>
            </button>
          </div>
        </form>
      )}
    </ModalDialog>
  );
};
