import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface SearchParams {
  query: string;
  genre?: string;
  artist?: string;
  limit?: number;
  offset?: number;
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

    const params: SearchParams = await req.json();

    if (!params.query || params.query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Query must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const limit = Math.min(params.limit || 20, 50);
    const offset = params.offset || 0;
    const searchTerm = params.query.trim();

    let query = supabase
      .from("songs")
      .select(`
        *,
        artist:profiles!songs_artist_id_fkey(id, username, display_name, avatar_url)
      `, { count: "exact" })
      .textSearch("title", searchTerm, { config: "spanish" })
      .eq("is_published", true)
      .limit(limit)
      .offset(offset);

    if (params.genre) {
      query = query.eq("genre", params.genre);
    }

    if (params.artist) {
      query = query.ilike("artist_id::text", `%${params.artist}%`);
    }

    const { data: songs, error, count } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({
        data: songs,
        count,
        limit,
        offset,
        query: searchTerm,
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
