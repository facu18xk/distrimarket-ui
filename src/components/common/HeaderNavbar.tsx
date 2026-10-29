import React, { useState, useRef, useEffect } from 'react';
import {
    ShoppingCart,
    LogOut,
    User,
    Palette,
    ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MODULE_LABELS, homeModule, modulesFor } from '../../auth/roles';
import { MODULE_SUBSECTIONS } from '../../routing/navigation';
import type { MainModule } from '../../types';

export const HeaderNavbar: React.FC = () => {
    const {
        user,
        theme,
        activeModule,
        setActiveModule,
        navigateToSubTab,
        ventaSubTab,
        stockSubTab,
        compraSubTab,
        adminSubTab,
        logout,
        setAccountModalOpen,
    } = useApp();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [hoveredModule, setHoveredModule] = useState<MainModule | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const closeTimeoutRef = useRef<number | null>(null);

    // Close user dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close menus on Escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setDropdownOpen(false);
                setHoveredModule(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Cleanup close timeout on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, []);

    const handleMouseEnter = (moduleId: MainModule) => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setHoveredModule(moduleId);
    };

    const handleMouseLeave = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }
        closeTimeoutRef.current = window.setTimeout(() => {
            setHoveredModule(null);
        }, 150);
    };

    const getActiveSubTab = (moduleId: MainModule): string => {
        switch (moduleId) {
            case 'venta':
                return ventaSubTab;
            case 'stock':
                return stockSubTab;
            case 'compra':
                return compraSubTab;
            case 'administracion':
                return adminSubTab;
        }
    };

    // Cada usuario ve las pestañas de todos sus roles (puede tener varios).
    const navItems = modulesFor(user.roles).map((id) => ({ id, label: MODULE_LABELS[id] }));

    return (
        <header className="w-full backdrop-blur-xl bg-white/85 sticky top-0 z-40 border-b border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors duration-200 print:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                {/* Left: Refined Brand Mark */}
                <div
                    onClick={() => {
                        setHoveredModule(null);
                        setActiveModule(homeModule(user.roles));
                    }}
                    className="flex items-center space-x-2.5 cursor-pointer select-none group shrink-0"
                >
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs transition-transform duration-200 group-hover:scale-105"
                        style={{ backgroundColor: theme.primaryHex }}
                    >
                        <ShoppingCart className="w-4 h-4 text-white stroke-[2.3]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-tight">
                            DistriMarket
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase leading-none">
                            PRO
                        </span>
                    </div>
                </div>

                {/* Center: Floating Capsule Segmented Navigation Track */}
                <nav className="inline-flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] min-w-0 mx-auto overflow-x-auto md:overflow-visible scrollbar-none">
                    {navItems.map((item) => {
                        const isActive = activeModule === item.id;
                        const isHovered = hoveredModule === item.id;
                        const subItems = MODULE_SUBSECTIONS[item.id] ?? [];
                        const currentSub = getActiveSubTab(item.id);

                        return (
                            <div
                                key={item.id}
                                className="relative"
                                onMouseEnter={() => handleMouseEnter(item.id)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHoveredModule(null);
                                        setActiveModule(item.id);
                                    }}
                                    className={`relative px-3 sm:px-3.5 py-1.5 text-xs sm:text-[13px] rounded-full transition-all duration-200 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer select-none ${
                                        isActive
                                            ? 'bg-white text-slate-900 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                                    }`}
                                >
                                    {isActive && (
                                        <span
                                            className="w-1.5 h-1.5 rounded-full shrink-0"
                                            style={{ backgroundColor: theme.primaryHex }}
                                        />
                                    )}
                                    <span>{item.label}</span>
                                    {subItems.length > 0 && (
                                        <ChevronDown
                                            className={`w-3 h-3 transition-transform duration-200 ${
                                                isHovered ? 'rotate-180 text-slate-900' : 'text-slate-400'
                                            }`}
                                        />
                                    )}
                                </button>

                                {/* Apple-grade Glass Dropdown Card */}
                                {isHovered && subItems.length > 0 && (
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150">
                                        <div className="backdrop-blur-2xl bg-white/95 rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.12)] border border-slate-200/80 p-1.5 min-w-[210px] text-slate-800">
                                            {subItems.map((sub) => {
                                                const isSubActive = isActive && currentSub === sub.id;
                                                const Icon = sub.icon;

                                                return (
                                                    <button
                                                        key={sub.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setHoveredModule(null);
                                                            navigateToSubTab(item.id, sub.id);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all duration-150 text-left select-none cursor-pointer ${
                                                            isSubActive
                                                                ? 'bg-slate-100 text-slate-900 font-bold'
                                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                                        }`}
                                                    >
                                                        <div className="flex items-center space-x-2.5 truncate">
                                                            <Icon
                                                                className={`w-4 h-4 shrink-0 transition-colors ${
                                                                    isSubActive ? 'text-slate-900 stroke-[2]' : 'text-slate-400'
                                                                }`}
                                                            />
                                                            <span className="truncate">{sub.label}</span>
                                                        </div>
                                                        {isSubActive && (
                                                            <span
                                                                className="w-1.5 h-1.5 rounded-full shrink-0 ml-2"
                                                                style={{ backgroundColor: theme.primaryHex }}
                                                            />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Right: User Profile */}
                <div className="relative shrink-0" ref={dropdownRef}>
                    {/* User Profile Pill */}
                    <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center space-x-2 p-1 pr-2.5 sm:pr-3 rounded-full hover:bg-slate-100/80 border border-slate-200/50 hover:border-slate-200 transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-slate-300 cursor-pointer"
                        title="Opciones de cuenta"
                    >
                        <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <User className="w-3.5 h-3.5 text-slate-500" />
                            )}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 hidden sm:inline-block truncate max-w-[120px]">
                            {user.name}
                        </span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Account Dropdown Menu (Glass Sheet) */}
                    {dropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 backdrop-blur-2xl bg-white/95 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-200/80 p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">
                            {/* User Header Info */}
                            <div className="px-3 py-2.5 mb-1 bg-slate-50/80 rounded-xl border border-slate-100">
                                <div className="flex items-center space-x-2.5">
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.name}
                                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="truncate">
                                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                                        <p className="text-[11px] text-slate-500 truncate">@{user.username}{user.cargo ? ` · ${user.cargo}` : ''}</p>
                                        <span className="inline-block mt-0.5 px-2 py-0.2 bg-slate-200/60 text-slate-700 text-[10px] font-semibold rounded-full">
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action 1: Configuración de Cuenta */}
                            <button
                                type="button"
                                onClick={() => {
                                    setDropdownOpen(false);
                                    setAccountModalOpen(true);
                                }}
                                className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100/80 rounded-xl transition-colors text-left cursor-pointer"
                            >
                                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                                    <Palette className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-xs">Personalizar UI y Cuenta</p>
                                    <p className="text-[10px] text-slate-400">Color de tema, foto y datos</p>
                                </div>
                            </button>

                            {/* Action 2: Cerrar Sesión */}
                            <button
                                type="button"
                                onClick={() => {
                                    setDropdownOpen(false);
                                    logout();
                                }}
                                className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50/80 rounded-xl transition-colors text-left mt-0.5 cursor-pointer"
                            >
                                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                    <LogOut className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-xs">Cerrar sesión</p>
                                    <p className="text-[10px] text-rose-400">Volver a pantalla de inicio</p>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
