"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuItem } from "@/lib/types";

interface HeaderProps {
    headerTitle: string;
    headerSubtitle: string;
    headerSearchLabel: string;
    menuItems: MenuItem[];
}

export const Header: React.FC<HeaderProps> = ({
    headerTitle,
    headerSubtitle,
    headerSearchLabel,
    menuItems,
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    // Close mobile menu on route change during render without effect cascade
    const [prevPathname, setPrevPathname] = useState(pathname);
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);
        setIsMenuOpen(false);
    }

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMenuOpen]);

    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b border-[#E5DEC9] bg-[#FAF7F2]/95 backdrop-blur-md shadow-xs transition-all duration-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
                    {/* Brand Logo & Subtitle */}
                    <Link
                        href="/"
                        id="header-brand-logo"
                        className="flex flex-col select-none group focus:outline-none"
                    >
                        <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight sm:tracking-wide text-warm-brown group-hover:text-brick-red transition-colors duration-200">
                            {headerTitle}
                        </span>
                        <span className="text-[8px] sm:text-[10px] tracking-[0.18em] uppercase text-brick-red font-semibold -mt-0.5 sm:-mt-1">
                            {headerSubtitle}
                        </span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav
                        id="header-desktop-nav"
                        className="hidden md:flex items-center gap-6 lg:gap-8 font-medium text-sm text-warm-brown"
                    >
                        {menuItems.map((item, index) => {
                            const isActive = pathname === item.url;
                            return (
                                <Link
                                    key={index}
                                    href={item.url || "/"}
                                    className={`hover:text-brick-red transition-colors duration-200 relative py-2 ${
                                        isActive ? "text-brick-red font-bold" : "text-[#3C2F2F]"
                                    }`}
                                >
                                    {item.label || ""}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brick-red rounded-full" />
                                    )}
                                </Link>
                            );
                        })}

                        {/* Desktop Search Button */}
                        <Link
                            href="/kereses"
                            id="nav-link-search-desktop"
                            className="flex items-center gap-1.5 px-4 py-2 bg-warm-brown hover:bg-brick-red text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                            </svg>
                            {headerSearchLabel}
                        </Link>
                    </nav>

                    {/* Mobile Navigation Icons Cluster */}
                    <div className="flex md:hidden items-center gap-1">
                        {/* Mobile Search Icon Button */}
                        <Link
                            href="/kereses"
                            id="nav-link-search-mobile"
                            aria-label="Keresés megnyitása"
                            className="p-2.5 rounded-full text-[#3C2F2F] hover:bg-[#E5DEC9]/50 hover:text-brick-red active:scale-95 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                            </svg>
                        </Link>

                        {/* Mobile Dot Menu Button */}
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(true)}
                            aria-label="Menü megnyitása"
                            className="p-2.5 rounded-full text-[#3C2F2F] hover:bg-[#E5DEC9]/50 hover:text-brick-red active:scale-95 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                                <path d="M12 7a2 2 0 100-4 2 2 0 000 4zm0 7a2 2 0 100-4 2 2 0 000 4zm0 7a2 2 0 100-4 2 2 0 000 4z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Slide-Over Drawer & Backdrop */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex justify-end">
                    {/* Backdrop Overlay */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Drawer Panel */}
                    <div className="relative w-72 max-w-[80vw] bg-[#FAF7F2] h-full shadow-2xl border-l border-[#E5DEC9] flex flex-col justify-between p-6 z-10 animate-slide-left">
                        {/* Drawer Header */}
                        <div className="flex flex-col space-y-6">
                            <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-4">
                                <div className="flex flex-col">
                                    <span className="font-serif text-lg font-bold text-warm-brown">
                                        {headerTitle}
                                    </span>
                                    <span className="text-[8px] tracking-widest uppercase text-brick-red font-semibold">
                                        {headerSubtitle}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsMenuOpen(false)}
                                    aria-label="Menü bezárása"
                                    className="p-2 rounded-full text-[#3C2F2F] hover:bg-[#E5DEC9]/50 hover:text-brick-red transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Mobile Links List */}
                            <nav className="flex flex-col space-y-1.5">
                                {menuItems.map((item, index) => {
                                    const isActive = pathname === item.url;
                                    return (
                                        <Link
                                            key={index}
                                            href={item.url || "/"}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-between ${
                                                isActive
                                                    ? "bg-warm-brown text-white shadow-xs"
                                                    : "text-[#3C2F2F] hover:bg-[#E5DEC9]/40 hover:text-brick-red"
                                            }`}
                                        >
                                            <span>{item.label || ""}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 opacity-60">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </Link>
                                    );
                                })}

                                {/* Mobile Search Action in Drawer */}
                                <Link
                                    href="/kereses"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="mt-3 px-4 py-3 bg-[#FAF7F2] hover:bg-warm-brown hover:text-white border border-[#E5DEC9] text-[#3C2F2F] rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 shadow-2xs"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 text-brick-red">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                                    </svg>
                                    <span>{headerSearchLabel}</span>
                                </Link>
                            </nav>
                        </div>

                        {/* Drawer Footer */}
                        <div className="pt-6 border-t border-[#E5DEC9] text-center">
                            <p className="text-[10px] text-[#4E473F]/70 font-sans">
                                © {new Date().getFullYear()} Reménység Foglyai
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
