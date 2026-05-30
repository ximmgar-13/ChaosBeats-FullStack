import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string;
  type: "like" | "comment" | "follow" | "donation" | "system" | "new_song" | "playlist_update" | "subscription";
  data?: Record<string, unknown>;
  send_push?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: NotificationPayload = await req.json();

    if (!payload.user_id || !payload.title || !payload.body || !payload.type) {
      return new Response(
        JSON.stringify({ error: "user_id, title, body, and type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validTypes = ["like", "comment", "follow", "donation", "system", "new_song", "playlist_update", "subscription"];
    if (!validTypes.includes(payload.type)) {
      return new Response(
        JSON.stringify({ error: `Invalid type. Must be one of: ${validTypes.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: notification, error: insertError } = await supabase
      .from("notifications")
      .insert({
        user_id: payload.user_id,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload.data || {},
      })
      .select()
      .single();

    if (insertError) throw insertError;

    if (payload.send_push !== false) {
      const { data: pushTokens } = await supabase
        .from("user_push_tokens")
        .select("push_token, platform")
        .eq("user_id", payload.user_id);

      if (pushTokens && pushTokens.length > 0) {
        const pushPromises = pushTokens.map(async (pt) => {
          const pushPayload = {
            to: pt.push_token,
            sound: "default",
            title: payload.title,
            body: payload.body,
            data: {
              type: payload.type,
              notification_id: notification.id,
              ...payload.data,
            },
          };

          const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(pushPayload),
          });

          return response.json();
        });

        const pushResults = await Promise.allSettled(pushPromises);

        return new Response(
          JSON.stringify({
            success: true,
            notification,
            push_results: pushResults.map((r) =>
              r.status === "fulfilled" ? r.value : { error: r.reason }
            ),
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, notification, push_sent: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
