import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

import { createAdminClient } from "@/lib/supabase/admin";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const MODEL = "gpt-image-1";

/* =========================================================
   OPENAI
   ========================================================= */

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY is not configured."
  );
}

const openai = new OpenAI({
  apiKey,
});

/* =========================================================
   ROUTE
   ========================================================= */

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Cartoon ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = createAdminClient();

    /* =====================================================
       LOAD CARTOON
       ===================================================== */

    const {
      data: cartoon,
      error: cartoonError,
    } = await supabase
      .from("cartoons")
      .select(`
        id,
        article_id,
        concept,
        prompt,
        image_url,
        alt_text,
        caption,
        status
      `)
      .eq("id", id)
      .single();

    if (cartoonError || !cartoon) {
      console.error(
        "Cartoon lookup error:",
        cartoonError
      );

      return NextResponse.json(
        {
          error: "Cartoon could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       VALIDATE STATUS
       ===================================================== */

    if (cartoon.status !== "approved") {
      return NextResponse.json(
        {
          error:
            "The cartoon must be approved before an AI image can be generated.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       LOAD RELATED ARTICLE
       ===================================================== */

    const {
      data: article,
      error: articleError,
    } = await supabase
      .from("articles")
      .select(`
        id,
        headline,
        summary,
        slug
      `)
      .eq("id", cartoon.article_id)
      .single();

    if (articleError || !article) {
      console.error(
        "Related article lookup error:",
        articleError
      );

      return NextResponse.json(
        {
          error:
            "The related article could not be found.",
          details:
            articleError?.message || null,
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       BUILD IMAGE PROMPT
       ===================================================== */

    const finalPrompt = `
Create an original professional editorial cartoon
illustration for the Nigerian news and humour publication
"NaijaLaughs".

The image must visually communicate the actual news story
and the approved cartoon concept.

NEWS HEADLINE:
${article.headline || "Untitled news story"}

NEWS SUMMARY:
${article.summary || "No summary provided."}

CARTOON CONCEPT:
${cartoon.concept || "No concept provided."}

EDITORIAL CAPTION:
${cartoon.caption || "No caption provided."}

CREATIVE DIRECTION:
${cartoon.prompt || "Use the concept and news context to determine the visual scene."}

EDITORIAL VISUAL STYLE:

- Nigerian editorial cartoon
- Funny, clever and visually immediate
- Colourful but professional
- Strong visual storytelling
- Expressive and exaggerated characters
- Contemporary Nigerian environment
- Authentic Nigerian visual details where relevant
- Nigerian streets, airports, markets, offices, public transport,
  football culture, phones, social media or other relevant
  environments when appropriate
- Cartoon illustration rather than photorealistic photography
- Polished publication-quality artwork
- Clean composition
- Distinct foreground, middle ground and background
- Suitable for a reputable Nigerian news and humour website

MOST IMPORTANT TEXT RULE:

DO NOT PUT ANY TEXT IN THE IMAGE.

Do not add:

- headlines
- captions
- subtitles
- labels
- newspaper text
- signs containing words
- speech bubbles
- thought bubbles
- logos
- watermarks
- written jokes
- typography of any kind

The humour must be communicated entirely through the
characters, setting, objects, facial expressions, body
language and visual situation.

The editorial caption will be displayed separately by the
NaijaLaughs website.

COMPOSITION:

Create one strong editorial scene with a clear visual joke.

The image should communicate the central idea of the story
without requiring any written words.

Use visual exaggeration to make the situation immediately
funny and recognisable to a Nigerian audience.

SAFETY AND EDITORIAL RULES:

- Humour should target the situation, policy, public experience
  or circumstances.
- Do not mock victims of tragedy.
- Do not depict children in harmful or exploitative situations.
- Do not make unsupported allegations about identifiable people.
- Do not portray protected characteristics as the joke.
- Do not imitate the artistic style of a living cartoonist.
- Do not create defamatory visual claims.
- Do not add fictional facts that materially change the story.

FINAL REQUIREMENT:

Generate only the clean editorial illustration.

No text.
No caption.
No headline.
No watermark.
No logo.

The finished image should look like an original NaijaLaughs
editorial cartoon that can be placed beside separately
rendered website typography.
`.trim();

    /* =====================================================
       GENERATE IMAGE
       ===================================================== */

    const result =
      await openai.images.generate({
        model: MODEL,
        prompt: finalPrompt,
        size: "1536x1024",
        quality: "high",
      });

    const imageData =
      result.data?.[0];

    if (!imageData) {
      return NextResponse.json(
        {
          error:
            "OpenAI did not return an image.",
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       GET IMAGE DATA
       ===================================================== */

    let imageBuffer: Buffer;

    if (imageData.b64_json) {
      imageBuffer = Buffer.from(
        imageData.b64_json,
        "base64"
      );
    } else if (imageData.url) {
      const imageResponse =
        await fetch(imageData.url);

      if (!imageResponse.ok) {
        throw new Error(
          "Unable to download generated image."
        );
      }

      const arrayBuffer =
        await imageResponse.arrayBuffer();

      imageBuffer = Buffer.from(
        arrayBuffer
      );
    } else {
      throw new Error(
        "OpenAI returned neither image data nor an image URL."
      );
    }

    /* =====================================================
       STORAGE PATH
       ===================================================== */

    const filePath =
      `cartoons/${id}-${Date.now()}.png`;

    /* =====================================================
       UPLOAD TO SUPABASE STORAGE
       ===================================================== */

    const {
      error: uploadError,
    } = await supabase.storage
      .from("Naija Laugh")
      .upload(
        filePath,
        imageBuffer,
        {
          contentType: "image/png",
          upsert: false,
        }
      );

    if (uploadError) {
      console.error(
        "Cartoon image upload error:",
        uploadError
      );

      throw new Error(
        uploadError.message ||
          "Unable to upload generated image."
      );
    }

    /* =====================================================
       GET PUBLIC URL
       ===================================================== */

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("Naija Laugh")
      .getPublicUrl(filePath);

    const imageUrl =
      publicUrlData.publicUrl;

    if (!imageUrl) {
      throw new Error(
        "Unable to create public image URL."
      );
    }

    /* =====================================================
       SAVE IMAGE URL
       ===================================================== */

    const {
      error: updateError,
    } = await supabase
      .from("cartoons")
      .update({
        image_url: imageUrl,
      })
      .eq("id", id);

    if (updateError) {
      console.error(
        "Cartoon update error:",
        updateError
      );

      throw new Error(
        updateError.message ||
          "Unable to save generated image."
      );
    }

    /* =====================================================
       REVALIDATE
       ===================================================== */

    revalidatePath(
      `/admin/cartoons/${id}`
    );

    revalidatePath(
      "/admin/cartoons"
    );

    revalidatePath("/cartoons");

    revalidatePath("/");

    /* =====================================================
       RESPONSE
       ===================================================== */

    return NextResponse.json({
      success: true,
      image_url: imageUrl,
    });

  } catch (error) {
    console.error(
      "Generate cartoon image error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate cartoon image.",
      },
      {
        status: 500,
      }
    );
  }
}