import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
    const API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      throw new Error("Cloudinary credentials not configured");
    }

    const { file, folder, resource_type } = await req.json();

    if (!file) {
      throw new Error("No file data provided");
    }

    const timestamp = Math.round(Date.now() / 1000).toString();

    // Build params to sign (sorted alphabetically)
    const paramsToSign: Record<string, string> = { timestamp };
    if (folder) paramsToSign.folder = folder;
    if (resource_type) paramsToSign.resource_type = resource_type;

    // Create signature string
    const sortedKeys = Object.keys(paramsToSign).sort();
    const signatureString =
      sortedKeys.map((k) => `${k}=${paramsToSign[k]}`).join("&") + API_SECRET;

    // SHA-1 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Upload to Cloudinary
    const uploadType = resource_type || "auto";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", API_KEY);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    if (folder) formData.append("folder", folder);

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${uploadType}/upload`,
      { method: "POST", body: formData }
    );

    const result = await cloudinaryRes.json();

    if (!cloudinaryRes.ok) {
      throw new Error(
        `Cloudinary upload failed [${cloudinaryRes.status}]: ${JSON.stringify(result)}`
      );
    }

    return new Response(
      JSON.stringify({
        secure_url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        duration: result.duration,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Cloudinary upload error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
