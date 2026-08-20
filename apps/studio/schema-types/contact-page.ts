import { defineField, defineType } from "sanity";
import { EnvelopeIcon } from "@sanity/icons/Envelope";

export const contactPage = defineType({
    name: "contactPage",
    title: "Kapcsolat Oldal (Contact)",
    type: "document",
    icon: EnvelopeIcon,
    fields: [
        defineField({
            name: "title",
            title: "Oldal Címe",
            description: "A Kapcsolat oldal főcíme (alapértelmezett: 'Kapcsolat').",
            type: "string",
            initialValue: "Kapcsolat",
        }),
        defineField({
            name: "content",
            title: "Tartalom / Bevezető",
            description: "Az űrlap mellett megjelenő részletes tájékoztató szöveg. Ha üres, az alapértelmezett leírás jelenik meg.",
            type: "richText",
        }),
        defineField({
            name: "recipientEmail",
            title: "Címzett E-mail Cím (Értesítések)",
            description: "Az űrlapon keresztül beküldött megkeresések erre az e-mail címre kerülnek továbbításra (pl. kapcsolat@remenysegf.hu).",
            type: "string",
            validation: (Rule) => Rule.email().error("Kérjük, adjon meg érvényes e-mail címet!"),
        }),
        defineField({
            name: "formNameLabel",
            title: "Űrlap: Név Mező Címke",
            description: "A név beviteli mező felirata (alapértelmezett: 'Név').",
            type: "string",
            initialValue: "Név",
        }),
        defineField({
            name: "formNamePlaceholder",
            title: "Űrlap: Név Mező Helyőrző (Placeholder)",
            description: "A név beviteli mezőben látható halvány minta szöveg (alapértelmezett: 'Írja be nevét').",
            type: "string",
            initialValue: "Írja be nevét",
        }),
        defineField({
            name: "formEmailLabel",
            title: "Űrlap: Email Mező Címke",
            description: "Az email mező felirata (alapértelmezett: 'E-mail').",
            type: "string",
            initialValue: "E-mail",
        }),
        defineField({
            name: "formEmailPlaceholder",
            title: "Űrlap: Email Mező Helyőrző (Placeholder)",
            description: "Az e-mail beviteli mezőben látható minta cím (alapértelmezett: 'pelda@remenysegf.hu').",
            type: "string",
            initialValue: "pelda@remenysegf.hu",
        }),
        defineField({
            name: "formMessageLabel",
            title: "Űrlap: Üzenet Mező Címke",
            description: "Az üzenet mező felirata (alapértelmezett: 'Üzenet').",
            type: "string",
            initialValue: "Üzenet",
        }),
        defineField({
            name: "formMessagePlaceholder",
            title: "Űrlap: Üzenet Mező Helyőrző (Placeholder)",
            description: "Az üzenet beviteli mezőben látható minta szöveg (alapértelmezett: 'Írja le üzenetét, kérdését...').",
            type: "string",
            initialValue: "Írja le üzenetét, kérdését...",
        }),
        defineField({
            name: "formSubmitButtonLabel",
            title: "Űrlap: Küldés Gomb Felirat",
            description: "A küldés gomb szövege (alapértelmezett: 'Üzenet küldése').",
            type: "string",
            initialValue: "Üzenet küldése",
        }),
        defineField({
            name: "formSuccessTitle",
            title: "Űrlap: Sikeres Küldés Cím",
            description: "Alapértelmezett: 'Köszönjük üzenetét!'.",
            type: "string",
            initialValue: "Köszönjük üzenetét!",
        }),
        defineField({
            name: "formSuccessMessage",
            title: "Űrlap: Sikeres Küldés Szöveg",
            description: "Alapértelmezett: 'Az üzenetet sikeresen elküldtük. Munkatársunk hamarosan felveszi Önnel a kapcsolatot a megadott e-mail címen.'",
            type: "text",
            rows: 2,
        }),
        defineField({
            name: "formSuccessButtonLabel",
            title: "Űrlap: Új Üzenet Gomb Felirat",
            description: "Alapértelmezett: 'Új üzenet küldése'.",
            type: "string",
            initialValue: "Új üzenet küldése",
        }),
        defineField({
            name: "formErrorMessage",
            title: "Űrlap: Hibaüzenet",
            description: "Alapértelmezett: 'Hiba történt az üzenet küldése során. Kérjük, próbálja meg később!'",
            type: "string",
            initialValue: "Hiba történt az üzenet küldése során. Kérjük, próbálja meg később!",
        }),
    ],
    preview: {
        prepare() {
            return {
                title: "Kapcsolat Oldal Beállításai",
                subtitle: "Űrlap feliratok és bevezető szöveg",
                media: EnvelopeIcon,
            };
        },
    },
});
