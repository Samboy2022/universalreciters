import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file to Cloudinary via edge function.
 * Returns the public secure_url.
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder: string,
  resourceType: "auto" | "image" | "video" = "auto"
): Promise<string> {
  // Convert to base64 data URI
  const base64 = await fileToBase64(file);

  const { data, error } = await supabase.functions.invoke("cloudinary-upload", {
    body: { file: base64, folder, resource_type: resourceType },
  });

  if (error) {
    throw new Error(error.message || "Upload failed");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data.secure_url;
}

function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
