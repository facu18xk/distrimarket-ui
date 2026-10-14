import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { FeedbackBanner, FormActions, ModalDialog, PersonaFields } from '../common';
import { useAsyncAction } from '../../hooks';
import { ventasApi } from '../../services';
import { hasPersonaErrors, personaARequest, personaDesdeDto, personaDesdeTexto, personaErrors } from '../../lib/persona';
import type { ClienteResponseDTO } from '../../types/api';

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Recibe el cliente tal como lo devolvió el backend. */
  onSaved: (cliente: ClienteResponseDTO) => void;
  /** Con cliente = modificar; sin cliente = registrar. */
  cliente?: ClienteResponseDTO | null;
  /** Lo que el usuario ya había escrito al buscar (un nombre, una CI o un RUC). */
  textoInicial?: string;
}

export const ClienteFormModal: React.FC<ClienteFormModalProps> = ({ isOpen, onClose, onSaved, cliente, textoInicial = '' }) => (
  <ModalDialog
    isOpen={isOpen}
    onClose={onClose}
    title={cliente ? 'Modificar cliente' : 'Registrar cliente'}
    subtitle="Una persona física necesita cédula; una jurídica, RUC."
    maxWidth="md"
  >
    {/* El contenido se monta cada vez que se abre, así el formulario siempre empieza limpio. */}
    <ClienteForm onClose={onClose} onSaved={onSaved} cliente={cliente} textoInicial={textoInicial} />
  </ModalDialog>
);

const ClienteForm: React.FC<Omit<ClienteFormModalProps, 'isOpen'>> = ({ onClose, onSaved, cliente, textoInicial = '' }) => {
  const guardar = useAsyncAction();
  const [persona, setPersona] = useState(() => (cliente ? personaDesdeDto(cliente.persona) : personaDesdeTexto(textoInicial)));
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const errores = personaErrors(persona, cliente ? (cliente.persona.ruc ?? '') : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntentoEnviar(true);
    if (hasPersonaErrors(errores)) return;

    const request = { persona: personaARequest(persona) };
    let guardado: ClienteResponseDTO | undefined;
    const ok = await guardar.run(async () => {
      guardado = cliente
        ? await ventasApi.clientes.update(cliente.idCliente, request)
        : await ventasApi.clientes.create(request);
    });
    if (ok && guardado) {
      onSaved(guardado);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PersonaFields value={persona} onChange={setPersona} errors={errores} showAllErrors={intentoEnviar} />

      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

      <FormActions
        onCancel={onClose}
        submitLabel={cliente ? 'Guardar cambios' : 'Registrar cliente'}
        loading={guardar.loading}
        icon={<UserPlus className="w-3.5 h-3.5" />}
      />
    </form>
  );
};
