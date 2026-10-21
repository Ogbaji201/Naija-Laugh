import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { openai } from "@/lib/openai";

const MODEL = "gpt-6-luna";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Job ID is required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    /* ---------------------------------------------
       LOAD JOB
       --------------------------------------------- */

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (jobError) {
      console.error("Load job error:", jobError);

      return NextResponse.json(
        { error: jobError.message },
        { status: 500 }
      );
    }

    if (!job) {
      return NextResponse.json(
        { error: "Job not found." },
        { status: 404 }
      );
    }

    /* ---------------------------------------------
       PREPARE JOB MATERIAL
       --------------------------------------------- */

    const jobMaterial = {
      title: job.title,
      company_name: job.company_name,
      category: job.category,
      experience_level: job.experience_level,
      employment_type: job.employment_type,
      work_type: job.work_type,
      location: job.location,
      country: job.country,
      summary: job.summary,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency,
      application_url: job.application_url,
      application_deadline: job.application_deadline,
      source_name: job.source_name,
      source_url: job.source_url,
    };

    /* ---------------------------------------------
       AI REVIEW
       --------------------------------------------- */

    const response = await openai.responses.create({
      model: MODEL,

      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: `
You are the editorial job-verification assistant for NaijaLaughs.

Your job is to assess whether a job listing appears suitable for publication.

You are NOT the final publisher.

Review the listing for:

1. Completeness
2. Employer and role clarity
3. Application information
4. Internal consistency
5. Potential scam or fraud indicators
6. Unrealistic or suspicious claims
7. Missing important information
8. Overall editorial suitability

Do not claim that a job is definitely genuine or definitely fraudulent unless the supplied evidence supports that conclusion.

Use cautious language when evidence is limited.

Return ONLY valid JSON in exactly this structure:

{
  "recommendation": "approve" | "flag" | "reject",
  "confidence": 0,
  "summary": "Short overall assessment",
  "notes": [
    "Observation 1",
    "Observation 2",
    "Observation 3"
  ],
  "red_flags": [
    "Red flag 1"
  ],
  "missing_information": [
    "Missing information 1"
  ]
}

Rules:

- confidence must be a number between 0 and 100.
- Use "approve" when the listing appears suitable for editorial review/publication.
- Use "flag" when there are concerns that require human attention.
- Use "reject" only when there are substantial problems.
- Do not invent facts.
- Do not browse the internet.
- Do not make the final publishing decision.
              `.trim(),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(
                jobMaterial,
                null,
                2
              ),
            },
          ],
        },
      ],

      text: {
        format: {
          type: "json_object",
        },
      },
    });

    /* ---------------------------------------------
       PARSE AI RESPONSE
       --------------------------------------------- */

    const outputText =
      response.output_text?.trim();

    if (!outputText) {
      throw new Error(
        "AI returned an empty review."
      );
    }

    let review: {
      recommendation:
        | "approve"
        | "flag"
        | "reject";
      confidence: number;
      summary: string;
      notes: string[];
      red_flags: string[];
      missing_information: string[];
    };

    try {
      review = JSON.parse(outputText);
    } catch (parseError) {
      console.error(
        "AI review JSON parse error:",
        parseError
      );

      console.error(
        "AI output:",
        outputText
      );

      throw new Error(
        "AI returned invalid review data."
      );
    }

    /* ---------------------------------------------
       VALIDATE REVIEW
       --------------------------------------------- */

    const allowedRecommendations = [
      "approve",
      "flag",
      "reject",
    ];

    if (
      !allowedRecommendations.includes(
        review.recommendation
      )
    ) {
      throw new Error(
        "AI returned an invalid recommendation."
      );
    }

    const confidence = Math.min(
      100,
      Math.max(
        0,
        Number(review.confidence) || 0
      )
    );

    const notes = Array.isArray(review.notes)
      ? review.notes
      : [];

    const redFlags = Array.isArray(
      review.red_flags
    )
      ? review.red_flags
      : [];

    const missingInformation = Array.isArray(
      review.missing_information
    )
      ? review.missing_information
      : [];

    const combinedNotes = [
      review.summary
        ? `Summary: ${review.summary}`
        : null,

      ...notes.map(
        (note) => `Observation: ${note}`
      ),

      ...redFlags.map(
        (flag) => `Red flag: ${flag}`
      ),

      ...missingInformation.map(
        (item) =>
          `Missing information: ${item}`
      ),
    ]
      .filter(Boolean)
      .join("\n\n");

    /* ---------------------------------------------
       SAVE REVIEW
       --------------------------------------------- */

    const { data: updatedJob, error: updateError } =
      await supabase
        .from("jobs")
        .update({
          ai_review_status:
            review.recommendation === "approve"
              ? "reviewed"
              : review.recommendation === "flag"
                ? "flagged"
                : "rejected",

          ai_review_notes:
            combinedNotes || null,

          ai_confidence: confidence,

          ai_model: MODEL,

          ai_reviewed_at:
            new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

    if (updateError) {
      console.error(
        "Save AI review error:",
        updateError
      );

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      review: {
        recommendation:
          review.recommendation,

        confidence,

        summary:
          review.summary || "",

        notes,

        red_flags: redFlags,

        missing_information:
          missingInformation,
      },

      job: updatedJob,
    });
  } catch (error) {
    console.error(
      "Job AI review error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to review job.",
      },
      { status: 500 }
    );
  }
}