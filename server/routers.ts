import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import { createTranscription } from "./db";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Storage operations
  storage: router({
    uploadAudio: protectedProcedure
      .input(z.object({
        audioData: z.string(), // Base64 encoded audio data
        mimeType: z.string().default("audio/webm"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Decode base64 to buffer
          const audioBuffer = Buffer.from(input.audioData, 'base64');
          
          // Generate unique filename
          const timestamp = Date.now();
          const filename = `audio/${ctx.user.id}/${timestamp}.webm`;
          
          // Upload to storage
          const result = await storagePut(filename, audioBuffer, input.mimeType);
          
          return {
            url: result.url,
            key: result.key,
          };
        } catch (error) {
          console.error("Audio upload failed:", error);
          throw new Error(`Audio upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }),
  }),

  // Transcription and AI features
  transcribe: router({
    audio: protectedProcedure
      .input(z.object({
        audioUrl: z.string(),
        language: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await transcribeAudio({
            audioUrl: input.audioUrl,
            language: input.language,
          });
          
          if ('error' in result) {
            throw new Error(result.error);
          }
          
          // Store transcription in database
          const sessionId = `session-${Date.now()}`;
          await createTranscription({
            userId: ctx.user.id,
            sessionId,
            text: result.text,
            language: result.language,
            duration: Math.round(result.duration),
          });
          
          return result;
        } catch (error) {
          console.error("Transcription error:", error);
          throw new Error(`Transcription failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }),
  }),

  // Translation feature
  translate: router({
    text: protectedProcedure
      .input(z.object({
        text: z.string(),
        targetLanguage: z.string(),
        context: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const languageNames: Record<string, string> = {
            "ja": "Japanese",
            "es": "Spanish",
            "zh": "Chinese",
            "fr": "French",
            "it": "Italian",
            "ko": "Korean",
            "ar": "Arabic",
            "hi": "Hindi",
            "ru": "Russian",
            "id": "Indonesian",
            "en": "English",
          };
          
          const targetLangName = languageNames[input.targetLanguage] || input.targetLanguage;
          
          const prompt = input.context
            ? `You are a professional translator. Translate the following text to ${targetLangName}. Context: "${input.context}". Text to translate: "${input.text}". Only return the translation without explanations.`
            : `You are a professional translator. Translate the following text to ${targetLangName}: "${input.text}". Only return the translation without explanations.`;
          
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a professional translator. Provide accurate and natural translations." },
              { role: "user", content: prompt },
            ],
          });
          
          const translation = response.choices[0]?.message?.content || "";
          
          // Extract text if content is an array
          let translationText = "";
          if (typeof translation === "string") {
            translationText = translation;
          } else if (Array.isArray(translation)) {
            translationText = translation
              .filter(item => item && typeof item === 'object' && 'text' in item)
              .map(item => (item as any).text)
              .join("");
          }
          
          return { translation: translationText, targetLanguage: input.targetLanguage };
        } catch (error) {
          console.error("Translation error:", error);
          throw new Error(`Translation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }),
  }),

  // Summary generation feature
  summary: router({
    generate: protectedProcedure
      .input(z.object({
        text: z.string(),
        type: z.enum(["short", "medium", "detailed"]).default("medium"),
        language: z.string().default("en"),
      }))
      .mutation(async ({ input }) => {
        try {
          const languageNames: Record<string, string> = {
            "en": "English",
            "ja": "Japanese",
            "es": "Spanish",
            "zh": "Chinese",
            "fr": "French",
            "it": "Italian",
            "ko": "Korean",
            "ar": "Arabic",
            "hi": "Hindi",
            "ru": "Russian",
            "id": "Indonesian",
          };
          
          const targetLangName = languageNames[input.language] || input.language;
          const langInstruction = input.language !== "en" ? `Please provide your response in ${targetLangName}.` : "";
          
          let prompt = "";
          
          if (input.type === "short") {
            prompt = `You are a professional executive assistant. Analyze the following transcript and provide a SHORT summary in exactly 4-5 lines. Focus on the most critical points, key decisions, and actionable outcomes. Write in a professional, executive-level tone.

Requirements:
- Exactly 4-5 lines of text
- No bullet points, lists, or markdown formatting
- Focus on main conclusions, decisions, and next steps
- Professional business language

${langInstruction}

Transcript: ${input.text}`;
          } else if (input.type === "medium") {
            prompt = `You are a professional business analyst. Analyze the following transcript and provide a MEDIUM-length summary that balances comprehensive coverage with readability.

Requirements:
- 3-4 well-structured paragraphs (150-250 words total)
- Cover main topics, key points, and strategic context
- Include important details, decisions, and action items
- Professional business writing style

${langInstruction}

Transcript: ${input.text}`;
          } else {
            prompt = `You are a professional business analyst. Provide a comprehensive analysis of the following transcript covering: transcript analysis, detailed summary, executive summary, main topics, key arguments, and conclusions.

${langInstruction}

Transcript: ${input.text}`;
          }
          
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a professional business analyst and executive assistant specializing in creating clear, actionable summaries." },
              { role: "user", content: prompt },
            ],
          });
          
          const summary = response.choices[0]?.message?.content || "";
          
          // Extract text if content is an array
          let summaryText = "";
          if (typeof summary === "string") {
            summaryText = summary;
          } else if (Array.isArray(summary)) {
            summaryText = summary
              .filter(item => item && typeof item === 'object' && 'text' in item)
              .map(item => (item as any).text)
              .join("");
          }
          
          return { summary: summaryText, type: input.type, language: input.language };
        } catch (error) {
          console.error("Summary generation error:", error);
          throw new Error(`Summary generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;

