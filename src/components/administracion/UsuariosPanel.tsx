import React, { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useConfirm } from '../../hooks';
import { MODULE_LABELS, ROLES, ROLE_LIST, type Role } from '../../auth/roles';
import type { AppUser } from '../../auth/userStore';
import { DataTable, FeedbackBanner, FormActions, FormField, ModalDialog, fieldClass, type Column } from '../common';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const EMPTY_FORM = { username: '', name: '', email: '', password: '', rol: 'VENDEDOR' as Role };

/** Registro y baja de usuarios. El rol define qué módulos ve cada uno. */
export const UsuariosPanel: React.FC = () => {
  const { users, registerUser, removeUser, user } = useApp();
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const closeModal = () => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = registerUser({ ...form, avatarUrl: '' });
    if (result.ok) closeModal();
    else setFormError(result.error);
  };

  const handleRemove = async (target: AppUser) => {
    const aceptado = await confirm({
      title: 'Eliminar usuario',
      message: `¿Eliminar al usuario "${target.username}"? Ya no podrá iniciar sesión.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!aceptado) return;
    const result = removeUser(target.username);
    setListError(result.ok ? null : result.error);
  };

  const columns: Column<AppUser>[] = [
    { header: 'Usuario', cell: (u) => u.username, className: 'font-bold text-slate-900' },
    { header: 'Nombre', cell: (u) => u.name },
    { header: 'Correo', cell: (u) => u.email || '—', className: 'text-slate-500 text-xs' },
    {
      header: 'Rol',
      cell: (u) => <Badge variant={u.rol === 'ADMIN' ? 'default' : 'secondary'}>{ROLES[u.rol].label}</Badge>,
    },
    {
      header: 'Módulos',
      cell: (u) => ROLES[u.rol].modules.map((m) => MODULE_LABELS[m]).join(', '),
      className: 'text-slate-500 text-xs',
    },
    {
      header: 'Acciones',
      align: 'center',
      cell: (u) =>
        u.username === user.username ? (
          <span className="text-[11px] text-slate-400">Sesión actual</span>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemove(u)}
            className="h-7 w-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
            title="Eliminar usuario"
          >
            <Trash2 />
          </Button>
        ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-xs text-slate-500">El rol define qué módulos ve cada usuario al iniciar sesión.</p>
        <Button variant="emerald" onClick={() => setModalOpen(true)}>
          <UserPlus />
          <span>Registrar usuario</span>
        </Button>
      </div>

      {listError && <FeedbackBanner className="mb-4">{listError}</FeedbackBanner>}

      <DataTable columns={columns} rows={users} rowKey={(u) => u.username} emptyMessage="No hay usuarios registrados." />

      <ModalDialog
        isOpen={modalOpen}
        onClose={closeModal}
        title="Registrar usuario"
        subtitle="Solo el administrador puede crear cuentas."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Usuario" required hint="Con este nombre inicia sesión.">
              <input
                className={fieldClass}
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Ej: mlopez"
                autoComplete="off"
              />
            </FormField>
            <FormField label="Contraseña" required hint="Mínimo 6 caracteres.">
              <input
                className={fieldClass}
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
              />
            </FormField>
          </div>

          <FormField label="Nombre completo" required>
            <input
              className={fieldClass}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: María López"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Correo">
              <input
                className={fieldClass}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="usuario@distrimarket.com"
              />
            </FormField>
            <FormField label="Rol" required hint={ROLES[form.rol].description}>
              <select
                className={fieldClass}
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value as Role })}
              >
                {ROLE_LIST.map((rol) => (
                  <option key={rol} value={rol}>
                    {ROLES[rol].label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {formError && <FeedbackBanner>{formError}</FeedbackBanner>}

          <FormActions onCancel={closeModal} submitLabel="Registrar" icon={<UserPlus className="w-3.5 h-3.5" />} />
        </form>
      </ModalDialog>
    </div>
  );
};
