import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, LogOut, Settings, User, Check, Palette } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { MainModule } from '../../types/distrimarket';

export const HeaderNavbar: React.FC = () => {
    const { user, theme, activeModule, setActiveModule, logout, setAccountModalOpen } = useApp();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navItems: { id: MainModule; label: string }[] = [
        { id: 'stock', label: 'Stock' },
        { id: 'compra', label: 'Compra' },
        { id: 'venta', label: 'Venta' },
        { id: 'promociones', label: 'Promociones' },
    ];

    return (
        <header
            className="w-full text-white shadow-md transition-colors duration-200 z-40 sticky top-0"
            style={{ backgroundColor: theme.primaryHex }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Left: Brand Logo */}
                <div
                    onClick={() => setActiveModule('stock')}
                    className="flex items-center space-x-2.5 cursor-pointer select-none group"
                >
                    <div className="bg-white/20 p-1.5 rounded-xl backdrop-blur-xs flex items-center justify-center transition-transform group-hover:scale-105">
                        <ShoppingCart className="w-5 h-5 text-white stroke-[2.5]" />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-white">
                        DistriMarket
                    </span>
                </div>

                {/* Center: Main Module Navigation Tabs */}
                <nav className="flex items-center space-x-1 sm:space-x-8">
                    {navItems.map((item) => {
                        const isActive = activeModule === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveModule(item.id)}
                                className={`relative py-2 px-3 text-sm font-semibold transition-all duration-150 flex flex-col items-center ${isActive
                                    ? 'text-white'
                                    : 'text-white/80 hover:text-white hover:bg-white/10 rounded-lg'
                                    }`}
                            >
                                <span>{item.label}</span>
                                {isActive && (
                                    <span className="absolute -bottom-2 w-8 h-1 bg-white rounded-full transition-all" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Right: User Profile & Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center space-x-2.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-white/40"
                        title="Opciones de cuenta"
                    >
                        <span className="text-sm font-semibold text-white hidden sm:inline-block">
                            {user.name}
                        </span>
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-white/40 bg-white/20 flex items-center justify-center shrink-0">
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <User className="w-4 h-4 text-white" />
                            )}
                        </div>
                    </button>

                    {/* Account Dropdown Menu */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                            {/* User Header Info */}
                            <div className="px-4 py-3 border-b border-slate-100">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="truncate">
                                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-semibold rounded-full">
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action 1: Configuración de Cuenta */}
                            <button
                                onClick={() => {
                                    setDropdownOpen(false);
                                    setAccountModalOpen(true);
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                            >
                                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <Palette className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">Personalizar UI y Cuenta</p>
                                    <p className="text-xs text-slate-500">Color de tema, foto y datos</p>
                                </div>
                            </button>

                            {/* Action 2: Cerrar Sesión */}
                            <button
                                onClick={() => {
                                    setDropdownOpen(false);
                                    logout();
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left border-t border-slate-100 mt-1"
                            >
                                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                                    <LogOut className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-semibold">Cerrar sesión (Log out)</p>
                                    <p className="text-xs text-red-400">Volver a pantalla de inicio</p>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
