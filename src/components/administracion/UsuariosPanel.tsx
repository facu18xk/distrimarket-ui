import React, { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsyncAction, usePagedResource, useRemove } from '../../hooks';
import { MODULE_LABELS, ROLES, ROLE_LIST, modulesFor } from '../../auth/roles';
import { authApi, errorMessage, inventarioApi } from '../../services';
import { normalizeCi } from '../../lib/paraguay';
import type { EmpleadoResponseDTO, PersonaResponseDTO, RolUsuario, UsuarioResponseDTO } from '../../types/api';
import { ActionButtons, EmpleadoPicker, FeedbackBanner, FormActions, FormField, ModalDialog, PagedTable, fieldClass, type Column } from '../common';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

/**
 * Usuarios del sistema, guardados en el microservicio de seguridad (/auth/usuarios).
 * Cada usuario pertenece a una persona (o a un empleado) y puede tener varios roles.
 */
export const UsuariosPanel: React.FC = () => {
  const { user } = useApp();
  const usuarios = usePagedResource<UsuarioResponseDTO>(authApi.usuarios.list, { sort: 'id' });
  const baja = useRemove(usuarios.reload);
  const [formOpen, setFormOpen] = useState(false);
  const [enEdicion, setEnEdicion] = useState<UsuarioResponseDTO | null>(null);

  const abrir = (usuario: UsuarioResponseDTO | null) => {
    setEnEdicion(usuario);
    setFormOpen(true);
  };

  const columns: Column<UsuarioResponseDTO>[] = [
    { header: 'Usuario', cell: (u) => u.username, className: 'font-bold text-slate-900' },
    { header: 'Nombre', cell: (u) => u.nombreCompleto ?? '—' },
    { header: 'Documento', cell: (u) => u.documento ?? '—', className: 'text-slate-600' },
    { header: 'Cargo', cell: (u) => u.cargo ?? 'No es empleado', className: 'text-slate-600 text-xs' },
    {
      header: 'Roles',
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.map((rol) => (
            <Badge key={rol} variant={rol === 'ADMIN' ? 'default' : 'secondary'}>
              {ROLES[rol]?.label ?? rol}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: 'Módulos',
      cell: (u) => modulesFor(u.roles).map((m) => MODULE_LABELS[m]).join(', '),
      className: 'text-slate-500 text-xs',
    },
    {
      header: 'Acciones',
      align: 'center',
      cell: (u) =>
        u.username === user.username ? (
          <span className="text-[11px] text-slate-400">Sesión actual</span>
        ) : (
          <ActionButtons
            onEdit={() => abrir(u)}
            onDelete={() =>
              baja.remove(
                { title: 'Dar de baja usuario', message: `¿Dar de baja a "${u.username}"? Ya no podrá iniciar sesión.` },
                () => authApi.usuarios.remove(u.idUsuario)
              )
            }
          />
        ),
    },
  ];

  return (
    <>
      {baja.error && <FeedbackBanner className="mb-4">{baja.error}</FeedbackBanner>}

      <PagedTable
        resource={usuarios}
        columns={columns}
        rowKey={(u) => u.idUsuario}
        label="usuarios"
        searchPlaceholder="Buscar por usuario, nombre o documento..."
        emptyMessage="No hay usuarios que coincidan con la búsqueda."
        filters={
          <Button variant="emerald" onClick={() => abrir(null)}>
            <UserPlus />
            <span>Registrar usuario</span>
          </Button>
        }
      />

      <ModalDialog
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={enEdicion ? `Modificar usuario "${enEdicion.username}"` : 'Registrar usuario'}
        subtitle="Los roles definen qué módulos ve y qué puede hacer en cada microservicio."
        maxWidth="md"
      >
        <UsuarioForm usuario={enEdicion} onClose={() => setFormOpen(false)} onSaved={(u, nuevo) => (nuevo ? usuarios.reload() : usuarios.replaceItem((row) => row.idUsuario === u.idUsuario, u))}
        />
      </ModalDialog>
    </>
  );
};

type Vinculo = 'empleado' | 'persona';

interface UsuarioFormProps {
  usuario: UsuarioResponseDTO | null;
  onClose: () => void;
  /** Recibe el usuario guardado: al modificar, la fila se reemplaza sin volver a pedir la página. */
  onSaved: (usuario: UsuarioResponseDTO, nuevo: boolean) => void;
}

/** Se monta al abrir el modal: cada apertura empieza con el formulario limpio. */
const UsuarioForm: React.FC<UsuarioFormProps> = ({ usuario, onClose, onSaved }) => {
  const guardar = useAsyncAction();
  const [username, setUsername] = useState(usuario?.username ?? '');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<RolUsuario[]>(usuario?.roles ?? ['VENDEDOR']);
  const [vinculo, setVinculo] = useState<Vinculo>('empleado');
  const [empleado, setEmpleado] = useState<EmpleadoResponseDTO | null>(null);
  const [ci, setCi] = useState('');
  const [persona, setPersona] = useState<PersonaResponseDTO | null>(null);
  const [errorPersona, setErrorPersona] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  const alternarRol = (rol: RolUsuario) =>
    setRoles((actuales) => (actuales.includes(rol) ? actuales.filter((r) => r !== rol) : [...actuales, rol]));

  const buscarPersona = async () => {
    setBuscando(true);
    setPersona(null);
    setErrorPersona(null);
    try {
      setPersona(await inventarioApi.personas.porCi(normalizeCi(ci)));
    } catch (e) {
      setErrorPersona(errorMessage(e));
    } finally {
      setBuscando(false);
    }
  };

  const faltaVinculo = !usuario && (vinculo === 'empleado' ? !empleado : !persona);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roles.length === 0 || faltaVinculo) return;
    let guardado: UsuarioResponseDTO | null = null;
    const ok = await guardar.run(async () => {
      guardado = await (usuario
        ? authApi.usuarios.update(usuario.idUsuario, { username: username.trim(), roles, password: password || undefined })
        : authApi.usuarios.create({
            username: username.trim(),
            password,
            roles,
            ...(vinculo === 'empleado' ? { idEmpleado: empleado!.id } : { idPersona: persona!.id }),
          }));
    });
    if (ok && guardado) {
      onSaved(guardado, !usuario);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Usuario" required hint="Letras, números, punto, guion o guion bajo.">
          <input
            className={fieldClass}
            required
            minLength={3}
            maxLength={50}
            pattern="[A-Za-z0-9._\-]+"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ej: mlopez"
            autoComplete="off"
          />
        </FormField>
        <FormField
          label={usuario ? 'Nueva contraseña' : 'Contraseña'}
          required={!usuario}
          hint={usuario ? 'Vacía = no se cambia. Mínimo 8 caracteres.' : 'Mínimo 8 caracteres. Se guarda cifrada.'}
        >
          <input
            className={fieldClass}
            type="password"
            required={!usuario}
            minLength={8}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </FormField>
      </div>

      <FormField label="Roles" required hint="Puede tener más de uno; ve la suma de sus módulos.">
        <div className="grid grid-cols-2 gap-2">
          {ROLE_LIST.map((rol) => (
            <label
              key={rol}
              className={`flex items-start gap-2 rounded-xl border px-3 py-2 cursor-pointer text-xs ${
                roles.includes(rol) ? 'border-slate-800 bg-slate-50' : 'border-slate-200'
              }`}
            >
              <input type="checkbox" className="mt-0.5" checked={roles.includes(rol)} onChange={() => alternarRol(rol)} />
              <span>
                <span className="font-semibold text-slate-800 block">{ROLES[rol].label}</span>
                <span className="text-slate-500">{ROLES[rol].description}</span>
              </span>
            </label>
          ))}
        </div>
        {roles.length === 0 && <p className="text-[11px] text-rose-600 mt-1">Elija al menos un rol.</p>}
      </FormField>

      {usuario ? (
        <p className="text-xs text-slate-500">
          Pertenece a <strong>{usuario.nombreCompleto ?? 'una persona'}</strong>
          {usuario.documento ? ` (${usuario.documento})` : ''}; la persona asociada no se cambia.
        </p>
      ) : (
        <FormField label="¿A quién pertenece?" required>
          <div className="flex gap-2 mb-2">
            {(['empleado', 'persona'] as Vinculo[]).map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() => setVinculo(opcion)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  vinculo === opcion ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600'
                }`}
              >
                {opcion === 'empleado' ? 'Un empleado' : 'Otra persona (por CI)'}
              </button>
            ))}
          </div>

          {vinculo === 'empleado' ? (
            <EmpleadoPicker value={empleado} onChange={setEmpleado} placeholder="Seleccione un empleado" />
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  className={fieldClass}
                  value={ci}
                  onChange={(e) => {
                    setCi(e.target.value);
                    setPersona(null);
                  }}
                  placeholder="CI de la persona"
                  inputMode="numeric"
                />
                <Button type="button" variant="outline" onClick={buscarPersona} disabled={!ci.trim() || buscando}>
                  <Search />
                  <span>{buscando ? 'Buscando...' : 'Buscar'}</span>
                </Button>
              </div>
              {persona && (
                <FeedbackBanner variant="success">
                  {persona.nombreCompleto} (CI {persona.ci})
                </FeedbackBanner>
              )}
              {errorPersona && <FeedbackBanner>{errorPersona}</FeedbackBanner>}
            </div>
          )}
        </FormField>
      )}

      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

      <FormActions
        onCancel={onClose}
        submitLabel={usuario ? 'Guardar cambios' : 'Registrar usuario'}
        loading={guardar.loading}
        disabled={roles.length === 0 || faltaVinculo}
        icon={<UserPlus className="w-3.5 h-3.5" />}
      />
    </form>
  );
};
