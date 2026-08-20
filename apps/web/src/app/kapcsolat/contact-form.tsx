"use client";

import { useState } from "react";

interface ContactFormProps {
    nameLabel: string;
    namePlaceholder?: string;
    emailLabel: string;
    emailPlaceholder?: string;
    messageLabel: string;
    messagePlaceholder?: string;
    submitLabel: string;
    successTitle?: string;
    successMessage?: string;
    successButtonLabel?: string;
    errorMessage?: string;
    recipientEmail?: string | null;
}

export default function ContactForm({
    nameLabel,
    namePlaceholder = "Írja be nevét",
    emailLabel,
    emailPlaceholder = "pelda@remenysegf.hu",
    messageLabel,
    messagePlaceholder = "Írja le üzenetét, kérdését...",
    submitLabel,
    successTitle = "Köszönjük üzenetét!",
    successMessage = "Az üzenetet sikeresen elküldtük. Munkatársunk hamarosan felveszi Önnel a kapcsolatot a megadott e-mail címen.",
    successButtonLabel = "Új üzenet küldése",
    errorMessage = "Hiba történt az üzenet küldése során. Kérjük, próbálja meg később!",
    recipientEmail,
}: ContactFormProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [validationError, setValidationError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError("");

        // Simple validation check
        if (!name.trim() || !email.trim() || !message.trim()) {
            setValidationError("Kérjük, töltsön ki minden kötelező mezőt!");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setValidationError("Kérjük, érvényes e-mail címet adjon meg!");
            return;
        }

        setStatus("submitting");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    message: message.trim(),
                    recipientEmail: recipientEmail?.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || "Hálózati hiba történt");
            }

            setStatus("success");
            setName("");
            setEmail("");
            setMessage("");
        } catch (err) {
            console.error("Kapcsolatfelvételi hiba:", err);
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <div className="bg-white border border-[#E5DEC9] rounded-2xl p-8 text-center space-y-4 shadow-sm animate-fade-in">
                <div className="w-16 h-16 bg-green-50 border border-green-200 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h3 className="font-serif text-2xl font-bold text-warm-brown">{successTitle}</h3>
                <p className="text-sm text-[#302B27]/80 max-w-md mx-auto">
                    {successMessage}
                </p>
                <button
                    onClick={() => setStatus("idle")}
                    className="mt-4 px-6 py-2.5 bg-warm-brown hover:bg-brick-red text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer"
                >
                    {successButtonLabel}
                </button>
            </div>
        );
    }

    return (
        <form 
            onSubmit={handleSubmit} 
            className="bg-white border border-[#E5DEC9] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5 flex flex-col"
        >
            {validationError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>{validationError}</span>
                </div>
            )}

            {status === "error" && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Name Input */}
            <div className="flex flex-col space-y-1.5">
                <label htmlFor="contact-name" className="text-xs font-bold uppercase tracking-wider text-[#302B27]">
                    {nameLabel} <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="contact-name"
                    disabled={status === "submitting"}
                    placeholder={namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-cream-header border border-[#E5DEC9] rounded-xl text-sm focus:outline-none focus:border-brick-red text-[#302B27] font-sans disabled:opacity-60 transition-colors"
                />
            </div>

            {/* Email Input */}
            <div className="flex flex-col space-y-1.5">
                <label htmlFor="contact-email" className="text-xs font-bold uppercase tracking-wider text-[#302B27]">
                    {emailLabel} <span className="text-red-500">*</span>
                </label>
                <input
                    type="email"
                    id="contact-email"
                    disabled={status === "submitting"}
                    placeholder={emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-cream-header border border-[#E5DEC9] rounded-xl text-sm focus:outline-none focus:border-brick-red text-[#302B27] font-sans disabled:opacity-60 transition-colors"
                />
            </div>

            {/* Message Textarea */}
            <div className="flex flex-col space-y-1.5">
                <label htmlFor="contact-message" className="text-xs font-bold uppercase tracking-wider text-[#302B27]">
                    {messageLabel} <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="contact-message"
                    disabled={status === "submitting"}
                    rows={5}
                    placeholder={messagePlaceholder}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-cream-header border border-[#E5DEC9] rounded-xl text-sm focus:outline-none focus:border-brick-red text-[#302B27] font-sans disabled:opacity-60 transition-colors resize-y min-h-32"
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={status === "submitting"}
                className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-warm-brown hover:bg-brick-red text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow hover:shadow-md transition-all duration-200 disabled:opacity-60 cursor-pointer"
            >
                {status === "submitting" ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Küldés folyamatban...
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        {submitLabel}
                    </>
                )}
            </button>
        </form>
    );
}
