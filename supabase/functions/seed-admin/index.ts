import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const ADMIN_EMAIL = "admin@universalreciters.com";
    const ADMIN_PASSWORD = "Admin@UR2024!";
    const ADMIN_NAME = "Super Admin";

    // Check if admin user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);

    let adminUserId: string;

    if (existingAdmin) {
      adminUserId = existingAdmin.id;
      console.log("Admin user already exists:", adminUserId);
    } else {
      // Create admin auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: ADMIN_NAME,
          ward: "Central",
          lga: "Abuja Municipal",
          state: "FCT",
          country: "Nigeria",
        },
      });

      if (createError) throw createError;
      adminUserId = newUser.user.id;
      console.log("Created admin user:", adminUserId);
    }

    // Ensure profile exists
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", adminUserId)
      .single();

    if (!profile) {
      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: adminUserId,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        ward: "Central",
        lga: "Abuja Municipal",
        state: "FCT",
        country: "Nigeria",
        is_active: true,
        referral_code: "ADMIN0001",
      });
      if (profileError) console.error("Profile error:", profileError);
    }

    // Ensure admin role exists
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .single();

    if (!role) {
      const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
        user_id: adminUserId,
        role: "admin",
      });
      if (roleError) console.error("Role error:", roleError);
      else console.log("Admin role assigned");
    } else {
      console.log("Admin role already assigned");
    }

    // Also activate the profile
    await supabaseAdmin
      .from("profiles")
      .update({ is_active: true })
      .eq("id", adminUserId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin account seeded successfully",
        credentials: {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
