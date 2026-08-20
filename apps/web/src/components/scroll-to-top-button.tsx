"use client";

import React, { useState, useEffect } from "react";

export const ScrollToTopButton: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            // Show after scrolling past approximately 1.5 - 2 screen heights (or > 700px)
            const threshold = Math.max(window.innerHeight * 1.5, 700);
            if (window.scrollY > threshold) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility, { passive: true });
        toggleVisibility();

        return () => {
            window.removeEventListener("scroll", toggleVisibility);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <button
            type="button"
            onClick={scrollToTop}
            aria-label="Vissza a tetejére"
            title="Vissza a tetejére"
            className={`fixed bottom-6 left-6 z-40 sm:bottom-8 sm:left-8 p-3 rounded-full bg-cream-header hover:bg-warm-brown text-warm-brown hover:text-white border border-[#E5DEC9] shadow-md hover:shadow-lg transition-all duration-300 transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-brick-red/50 ${
                isVisible
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-4 scale-90 pointer-events-none"
            }`}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
        </button>
    );
};
