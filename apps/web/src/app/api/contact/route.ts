import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, message, recipientEmail } = body;

        // Basic validation
        if (!name || typeof name !== "string" || !name.trim()) {
            return NextResponse.json(
                { error: "A név megadása kötelező!" },
                { status: 400 }
            );
        }

        if (!email || typeof email !== "string" || !email.trim()) {
            return NextResponse.json(
                { error: "Az e-mail cím megadása kötelező!" },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return NextResponse.json(
                { error: "Kérjük, érvényes e-mail címet adjon meg!" },
                { status: 400 }
            );
        }

        if (!message || typeof message !== "string" || !message.trim()) {
            return NextResponse.json(
                { error: "Az üzenet megadása kötelező!" },
                { status: 400 }
            );
        }

        const targetRecipient = (recipientEmail && typeof recipientEmail === "string" && recipientEmail.trim())
            ? recipientEmail.trim()
            : process.env.CONTACT_FORM_RECIPIENT || "info@remenysegf.hu";

        // Log notification to server console
        console.log(`[Kapcsolatfelvétel] Új üzenet érkezett:
  - Címzett: ${targetRecipient}
  - Feladó neve: ${name.trim()}
  - Feladó email: ${email.trim()}
  - Üzenet hossza: ${message.trim().length} karakter`);

        return NextResponse.json({
            success: true,
            message: "Az üzenetet sikeresen továbbítottuk!",
            recipient: targetRecipient,
        });
    } catch (error) {
        console.error("Hiba a kapcsolatfelvételi űrlap feldolgozásakor:", error);
        return NextResponse.json(
            { error: "Hiba történt az üzenet feldolgozása során. Kérjük, próbálja meg később!" },
            { status: 500 }
        );
    }
}
