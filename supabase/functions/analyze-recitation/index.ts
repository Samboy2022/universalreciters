import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WordResult {
  word: string;
  expected: string;
  status: "correct" | "incorrect" | "partial";
  similarity: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcribedText, expectedText } = await req.json();

    if (!transcribedText || !expectedText) {
      return new Response(
        JSON.stringify({ error: "Missing transcribedText or expectedText" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log("Analyzing recitation...");
    console.log("Expected:", expectedText);
    console.log("Transcribed:", transcribedText);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert Arabic Quran recitation analyzer. Compare the transcribed recitation with the expected Arabic text word-by-word. 
            
For each word, determine:
- If it matches exactly or is very close (>90% similarity): "correct"
- If it's partially correct (50-90% similarity): "partial"  
- If it's wrong or missing (<50% similarity): "incorrect"

Consider Arabic pronunciation variations and common transcription differences. Be lenient with diacritical marks but strict on consonants.`
          },
          {
            role: "user",
            content: `Analyze this recitation word-by-word:

Expected Arabic: ${expectedText}
Transcribed: ${transcribedText}

Return the analysis.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_recitation",
              description: "Analyze recitation word-by-word and return results",
              parameters: {
                type: "object",
                properties: {
                  wordResults: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        word: { type: "string", description: "The transcribed word" },
                        expected: { type: "string", description: "The expected word" },
                        status: { type: "string", enum: ["correct", "incorrect", "partial"] },
                        similarity: { type: "number", description: "Similarity score 0-100" }
                      },
                      required: ["word", "expected", "status", "similarity"]
                    }
                  },
                  overallScore: { type: "number", description: "Overall accuracy score 0-100" },
                  totalWords: { type: "number" },
                  correctWords: { type: "number" },
                  incorrectWords: { type: "number" },
                  feedback: { type: "string", description: "Brief feedback on the recitation" }
                },
                required: ["wordResults", "overallScore", "totalWords", "correctWords", "incorrectWords", "feedback"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_recitation" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));

    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No analysis result from AI");
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);
    console.log("Analysis result:", analysisResult);

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in analyze-recitation:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
