import React, { useState, useCallback } from 'react';
import { useFormValue, useClient, insert } from 'sanity';
import { Card, Button, Stack, Text, Flex, Spinner, Badge, Select } from '@sanity/ui';
import { SparklesIcon } from '@sanity/icons/Sparkles';

const generateKey = () => Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

const slugify = (input: string) =>
    input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .slice(0, 96);

interface TagSuggestion {
    tag: string;
    score: number;
    status: 'existing' | 'new';
    originalConcept: string;
}

export function TagsAITagger(props: any) {
    const { value, onChange } = props;
    const client = useClient({ apiVersion: '2026-05-31' });
    
    const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash-lite');
    const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Retrieve other form fields to send as context to Gemini
    const title = useFormValue(['title']) as string || '';
    const subtitle = useFormValue(['subtitle']) as string || '';
    const contentPT = useFormValue(['content']);

    const getPlainText = (portableText: any) => {
        if (!Array.isArray(portableText)) return '';
        return portableText
            .map(block => {
                if (block._type !== 'block' || !block.children) return '';
                return block.children.map((child: any) => child.text).join('');
            })
            .join('\n');
    };

    const getApiUrl = () => {
        const origin = window.location.origin;
        if (origin.includes("localhost:3333")) {
            return "http://localhost:3000/api/suggest-tags";
        }
        return `${origin}/api/suggest-tags`;
    };

    const fetchSuggestions = async () => {
        if (!title) {
            setError("Adj meg egy cikk címet előbb!");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Fetch existing tags in Sanity
            const existingTags = await client.fetch(`*[_type == "tag"]{ _id, title }`);
            const existingTagTitles = existingTags.map((t: any) => t.title);

            // 2. Format plain text body
            const plainText = getPlainText(contentPT);

            // 3. Make POST request to Next.js suggest-tags API route
            const apiUrl = getApiUrl();
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    subtitle,
                    content: plainText.slice(0, 8000), // Safe chunk of text to Gemini
                    existingTags: existingTagTitles,
                    model: selectedModel
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `HTTP Hiba: ${res.status}`);
            }

            const data = await res.json();
            setSuggestions(data.suggestions || []);
        } catch (err: any) {
            console.error("Tags suggestion error:", err);
            setError(err.message || "Nem sikerült lekérni az AI címkéket.");
        } finally {
            setIsLoading(false);
        }
    };

    const addTagReference = useCallback(async (tagName: string) => {
        try {
            setIsLoading(true);
            setError(null);

            // 1. Fetch current list of tags to check if it exists
            const query = `*[_type == "tag" && title match $title][0]{ _id, title }`;
            let tagDoc = await client.fetch(query, { title: tagName });

            // 2. Create the tag in Sanity if it does not exist
            if (!tagDoc) {
                tagDoc = await client.create({
                    _type: 'tag',
                    title: tagName,
                    slug: {
                        _type: 'slug',
                        current: slugify(tagName)
                    }
                });
            }

            const tagId = tagDoc._id;
            const currentValue = value || [];

            // 3. Check if this tag reference is already added to the article
            const alreadySelected = currentValue.some((ref: any) => ref._ref === tagId);
            if (alreadySelected) {
                setError(`A(z) "${tagName}" címke már hozzá van adva!`);
                setIsLoading(false);
                return;
            }

            // 4. Create reference object and append to tags array
            const referenceBlock = {
                _type: 'reference',
                _ref: tagId,
                _key: generateKey()
            };

            onChange(insert([referenceBlock], 'after', [-1]));
            
            // Remove from suggestions array visually
            setSuggestions(prev => prev.filter(t => t.tag.toLowerCase() !== tagName.toLowerCase()));
        } catch (err: any) {
            console.error("Add tag error:", err);
            setError(err.message || "Nem sikerült hozzáadni a címkét.");
        } finally {
            setIsLoading(false);
        }
    }, [client, value, onChange]);

    return (
        <Stack space={3}>
            {/* AI tagger section card */}
            <Card padding={3} border radius={2} tone="transparent">
                <Stack space={3}>
                    <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
                        <Flex align="center" gap={2}>
                            <SparklesIcon style={{ fontSize: 20, color: '#f5a623' }} />
                            <Text size={1} weight="bold">Pro AI Címke Asszisztens</Text>
                        </Flex>
                        <Flex align="center" gap={2}>
                            <Select
                                fontSize={1}
                                padding={2}
                                value={selectedModel}
                                onChange={(e: any) => setSelectedModel(e.currentTarget.value)}
                                disabled={isLoading}
                            >
                                <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite</option>
                                <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                                <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
                                <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
                            </Select>
                            <Button
                                fontSize={1}
                                padding={2}
                                mode="ghost"
                                tone="primary"
                                icon={SparklesIcon}
                                text={isLoading ? "Elemzés..." : "Címkék generálása"}
                                disabled={isLoading}
                                onClick={fetchSuggestions}
                            />
                        </Flex>
                    </Flex>

                    {isLoading && (
                        <Flex align="center" justify="center" padding={2} gap={2}>
                            <Spinner size={1} />
                            <Text size={1} muted>A Gemini elemzi a cikk tartalmát...</Text>
                        </Flex>
                    )}

                    {error && (
                        <Card padding={2} tone="critical" radius={2}>
                            <Text size={1}>{error}</Text>
                        </Card>
                    )}

                    {suggestions.length > 0 && (
                        <Stack space={2}>
                            <Text size={1} muted>Kattints a címkére a hozzáadáshoz:</Text>
                            <Flex wrap="wrap" gap={2}>
                                {suggestions.map((item, idx) => (
                                    <Button
                                        key={idx}
                                        fontSize={1}
                                        padding={2}
                                        mode="outline"
                                        tone={item.status === 'existing' ? 'positive' : 'default'}
                                        disabled={isLoading}
                                        onClick={() => addTagReference(item.tag)}
                                    >
                                        <Flex align="center" gap={2}>
                                            <Badge tone={item.status === 'existing' ? 'positive' : 'primary'}>
                                                {item.status === 'existing' ? 'Meglévő' : 'Új'}
                                            </Badge>
                                            <Text size={1} weight="bold">
                                                {item.tag}
                                            </Text>
                                            <Text size={1} muted>
                                                ({item.score}/10)
                                            </Text>
                                            {item.status === 'existing' && item.originalConcept.toLowerCase() !== item.tag.toLowerCase() && (
                                                <Text size={1} muted style={{ fontStyle: 'italic', opacity: 0.8 }}>
                                                    &larr; {item.originalConcept}
                                                </Text>
                                            )}
                                        </Flex>
                                    </Button>
                                ))}
                            </Flex>
                        </Stack>
                    )}
                </Stack>
            </Card>

            {/* Standard array input representation */}
            {props.renderDefault(props)}
        </Stack>
    );
}

