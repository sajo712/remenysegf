import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Handle CORS Preflight OPTIONS requests dynamically
export async function OPTIONS(request: Request) {
    const origin = request.headers.get("origin") || "*";
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
        },
    });
}

interface TagSuggestion {
    tag: string;
    score: number;
    status: "existing" | "new";
    originalConcept: string;
}

// Handle POST tag suggestions from Sanity Studio
export async function POST(request: Request) {
    const origin = request.headers.get("origin") || "*";

    try {
        const body = await request.json();
        const { title, subtitle, content, existingTags, model } = body;

        const selectedModel = model || "gemini-3.5-flash-lite";

        if (!title) {
            return NextResponse.json(
                { error: "A cikk címe kötelező!" },
                {
                    status: 400,
                    headers: { "Access-Control-Allow-Origin": origin }
                }
            );
        }

        const apiKey = process.env.REMENYSEGF_GEMINI_API_KEY?.trim();
        if (!apiKey) {
            console.error("Gemini API kulcs (REMENYSEGF_GEMINI_API_KEY) nincs beállítva a környezeti változók között!");
            return NextResponse.json(
                { error: "Gemini API kulcs nincs beállítva a szerveren!" },
                {
                    status: 500,
                    headers: { "Access-Control-Allow-Origin": origin }
                }
            );
        }

        // Initialize Google GenAI Client
        const ai = new GoogleGenAI({ apiKey });

        const tagsContext = existingTags && existingTags.length > 0
            ? `Létező címkék a rendszerben: ${JSON.stringify(existingTags)}`
            : "Nincsenek még meglévő címkék a rendszerben.";

        const prompt = `
Te egy professzionális szerkesztő vagy a "Reménység foglyai" keresztény folyóiratnál.
Feladatod, hogy a megadott cikk címe, alcíme és szöveges tartalma alapján javasolj összesen 8-10 darab releváns témakört/címkét egy kétlépcsős pontozási és egyeztetési eljárás keretében.

SZABÁLYOK A CÍMKEJAVASLATOKHOZ:
1. Összesen 8-10 darab címkejavaslatot kell adnod a 'suggestions' listában, relevancia szerint csökkenő sorrendben.
2. Megoszlás a meglévő és új címkék között:
   - A javaslatok közül LEGFELJEBB a fele (maximum 5-6 darab) származzon a rendszerben már létező címkék közül ("status": "existing").
   - A többi javaslat (a javaslatok másik fele, legalább 4-5 darab) legyen ÚJ címke ("status": "new"), amely még nem szerepel a létező címkék listájában.
   - Ne erőltesd rá a cikkre a meglévő címkéket, ha azok tartalmilag nem illenek hozzá! Ha nincs elég releváns meglévő címke, adj több új címkét a 8-10 darabos keret feltöltéséhez.

A kétlépcsős folyamat leírása:
1. Lépés (Tartalmi elemzés és súlyozás):
   Elemezd a cikk tartalmát, és határozz meg 8-10 olyan kulcsfogalmat/témát, amelyek a leginkább leírják a cikk tartalmát. Rendelj mindegyikhez egy relevancia pontszámot (score) 1 és 10 között, ahol 10 a leginkább releváns.
2. Lépés (Egyeztetés a meglévő címkékkel és új címkék képzése):
   - Meglévő címke ("status": "existing"): Ha egy kulcsfogalom tartalmilag egyezik egy létező címkével (pl. szinonimák, mint "ima" vs "imádság", vagy azonos szóalak eltérő toldalékolással, mint "bűnbánó" vs "bűnbánat"), és a meglévő címkék kerete még nem telt be (legfeljebb 5-6 db), akkor használd a létező címke pontos nevét a "tag" mezőben, az "originalConcept" legyen az eredeti fogalom.
   - Új címke ("status": "new"): Javasolj friss, releváns kulcsfogalmakat új címkeként (1-2 szavas magyar kifejezés), amelyek nincsenek a meglévő címkék között. A "tag" és az "originalConcept" mezőbe is az új címke neve kerüljön.

${tagsContext}

Cikk címe: "${title}"
Cikk alcíme: "${subtitle || "nincs"}"
Cikk tartalma:
"${content || ""}"
`;

        const result = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        suggestions: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    tag: { type: "STRING" },
                                    score: { type: "INTEGER" },
                                    status: { type: "STRING", enum: ["existing", "new"] },
                                    originalConcept: { type: "STRING" }
                                },
                                required: ["tag", "score", "status", "originalConcept"]
                            }
                        }
                    },
                    required: ["suggestions"]
                }
            }
        });
        const responseText = (result.text || "").trim();

        let parsedSuggestions: TagSuggestion[] = [];
        try {
            const cleanJson = responseText.replace(/```json|```/g, "").trim();
            const parsedData = JSON.parse(cleanJson);
            parsedSuggestions = parsedData.suggestions || [];
        } catch (parseErr) {
            console.error("JSON parsing error on Gemini output:", parseErr, responseText);
            throw new Error("Nem sikerült elemezni a Gemini válaszát.");
        }

        // Return the suggested tags with CORS headers
        return new NextResponse(JSON.stringify({ suggestions: parsedSuggestions }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });

    } catch (error) {
        const err = error as Error;
        console.error("API suggest-tags error:", err);
        return new NextResponse(JSON.stringify({ error: err.message || "Belső szerverhiba történt." }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": origin,
            },
        });
    }
}
