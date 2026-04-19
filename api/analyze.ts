import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    is_food: { type: Type.BOOLEAN, description: "Whether the image contains food or a meal." },
    dish_name: { type: Type.STRING },
    short_description: { type: Type.STRING },
    visible_ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    portion_estimate: { type: Type.STRING },
    estimated_calories: { type: Type.INTEGER },
    protein_g: { type: Type.INTEGER },
    carbs_g: { type: Type.INTEGER },
    fat_g: { type: Type.INTEGER },
    confidence_score: { type: Type.NUMBER, description: "Confidence level between 0 and 1." },
    healthy_or_indulgent: { type: Type.STRING, enum: ["healthy", "balanced", "indulgent"] },
    one_short_health_note: { type: Type.STRING },
    one_healthier_alternative: { type: Type.STRING },
    error_message: { type: Type.STRING, description: "If not food, describe why." },
  },
  required: ["is_food"],
};

const prompt = `
  Analyze this food image.
  1. Identify the dish.
  2. Estimate portion size.
  3. Estimate calories and macros (protein, carbs, fat in grams) conservatively.
  4. List only visible or strongly inferable ingredients.
  5. Determine if it is healthy, balanced, or indulgent.
  6. Provide one short health note and one healthier alternative, each under 20 words.
  7. If the image is not food, set is_food to false and provide an error_message.
  Avoid fake precision. Return only valid JSON.
`;

function parseImageData(base64Image: string) {
  const [mimeType, data] = base64Image.split(",");
  const mime = mimeType.match(/:(.*?);/)?.[1] || "image/jpeg";

  if (!data) {
    throw new Error("Invalid image payload.");
  }

  return { data, mime };
}

function normalizeResult(result: any) {
  if (result.is_food === false) {
    return {
      is_food: false,
      dish_name: "",
      short_description: "",
      visible_ingredients: [],
      portion_estimate: "",
      estimated_calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      confidence_score: 0,
      healthy_or_indulgent: "balanced",
      one_short_health_note: "",
      one_healthier_alternative: "",
      error_message: result.error_message || "This image does not appear to contain a meal or snack.",
    };
  }

  return {
    is_food: true,
    dish_name: result.dish_name || "Unknown dish",
    short_description: result.short_description || "A food image with estimated nutrition details.",
    visible_ingredients: Array.isArray(result.visible_ingredients) ? result.visible_ingredients : [],
    portion_estimate: result.portion_estimate || "Unable to estimate portion from this image.",
    estimated_calories: Number(result.estimated_calories) || 0,
    protein_g: Number(result.protein_g) || 0,
    carbs_g: Number(result.carbs_g) || 0,
    fat_g: Number(result.fat_g) || 0,
    confidence_score: Math.min(1, Math.max(0, Number(result.confidence_score) || 0.5)),
    healthy_or_indulgent: ["healthy", "balanced", "indulgent"].includes(result.healthy_or_indulgent)
      ? result.healthy_or_indulgent
      : "balanced",
    one_short_health_note: result.one_short_health_note || "Nutrition estimates are approximate.",
    one_healthier_alternative: result.one_healthier_alternative || "Try adding more vegetables or lean protein.",
  };
}

async function analyzeFoodImage(base64Image: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  const { data, mime } = parseImageData(base64Image);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data,
              mimeType: mime,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    },
  });

  const resultText = response.text || "";
  return normalizeResult(JSON.parse(resultText));
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!body?.image) {
      return res.status(400).json({ error: "Image is required." });
    }

    const result = await analyzeFoodImage(body.image);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Meal analysis error:", error);
    const message = error instanceof Error ? error.message : "Failed to analyze meal.";
    return res.status(500).json({ error: message });
  }
}
