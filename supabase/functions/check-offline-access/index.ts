import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface OfflineRequest {
  token: string;
  device_id: string;
  song_ids?: string[];
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

    const params: OfflineRequest = await req.json();

    if (!params.token || !params.device_id) {
      return new Response(
        JSON.stringify({ error: "Token and device_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: offlineToken, error: tokenError } = await supabase
      .from("offline_tokens")
      .select("*, profiles!inner(username, subscription:subscriptions(plan_type, status))")
      .eq("token", params.token)
      .eq("device_id", params.device_id)
      .eq("is_revoked", false)
      .single();

    if (tokenError || !offlineToken) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid or revoked token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(offlineToken.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: "Token expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hasOfflineAccess = offlineToken.profiles?.subscription?.plan_type !== "free";

    let songs = [];
    if (params.song_ids && params.song_ids.length > 0 && hasOfflineAccess) {
      const { data: songData } = await supabase
        .from("songs")
        .select("id, title, artist_id, duration, audio_url, cover_url")
        .in("id", params.song_ids)
        .eq("is_published", true);

      songs = songData || [];
    }

    return new Response(
      JSON.stringify({
        valid: true,
        has_offline_access: hasOfflineAccess,
        plan_type: offlineToken.profiles?.subscription?.plan_type || "free",
        expires_at: offlineToken.expires_at,
        songs: hasOfflineAccess ? songs : [],
        max_downloads: hasOfflineAccess ? -1 : 0,
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
