import { AnalysisResult } from "../types";

const ANALYSIS_ENDPOINT = import.meta.env.VITE_ANALYSIS_API_URL || "/api/analyze";

export async function analyzeFoodImage(base64Image: string): Promise<AnalysisResult> {
  const response = await fetch(ANALYSIS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Image }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to analyze meal. Please try again.");
  }

  return payload as AnalysisResult;
}
