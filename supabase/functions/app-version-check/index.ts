import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface VersionRequest {
  platform: "ios" | "android" | "web";
  current_version: string;
  build_number?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const params: VersionRequest = await req.json();

    if (!params.platform || !params.current_version) {
      return new Response(
        JSON.stringify({ error: "platform and current_version are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validPlatforms = ["ios", "android", "web"];
    if (!validPlatforms.includes(params.platform)) {
      return new Response(
        JSON.stringify({ error: "Invalid platform. Use: ios, android, or web" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: latestVersion, error } = await supabase
      .from("app_versions")
      .select("*")
      .eq("platform", params.platform)
      .order("build_number", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!latestVersion) {
      return new Response(
        JSON.stringify({
          update_available: false,
          is_required: false,
          latest_version: params.current_version,
          message: "No version info available",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentBuild = params.build_number || 0;
    const updateAvailable = latestVersion.build_number > currentBuild;
    const isRequired = latestVersion.is_required && updateAvailable;

    return new Response(
      JSON.stringify({
        update_available: updateAvailable,
        is_required: isRequired,
        latest_version: latestVersion.version,
        current_version: params.current_version,
        build_number: latestVersion.build_number,
        download_url: latestVersion.download_url,
        release_notes: latestVersion.release_notes,
        message: isRequired
          ? "This version is no longer supported. Please update to continue."
          : updateAvailable
          ? "A new version is available."
          : "You have the latest version.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
