import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";
import { setCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = new Headers();
  setCorsHeaders(headers);

  if (req.method === "OPTIONS") {
    return new Response("OK", { headers });
  }

  try {
    const { content, slug } = await req.json();
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return new Response("Unauthorized", { status: 401, headers });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response("Unauthorized", { status: 401, headers });
    }

    const { error: insertError } = await supabaseClient.from("comments").insert({
      content,
      slug,
      user_id: user.id,
    });

    if (insertError) {
      return new Response("Failed to submit comment", { status: 500, headers });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response("Error: " + error.message, { status: 500, headers });
  }
});
