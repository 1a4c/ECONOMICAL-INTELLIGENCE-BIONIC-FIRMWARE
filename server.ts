import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy init Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// AI Gait & Telemetry Analysis Endpoint
app.post('/api/analyze-telemetry', async (req, res) => {
  try {
    const { telemetryData, userQuestion } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.status(200).json({
        analysis: `[Simulator Fallback Mode] Gemini API key not configured in environment secrets.
Based on current telemetry:
• Hover Strength: ${telemetryData?.hoverStrength ?? 'Normal'} N/cm²
• FOG Detection: ${telemetryData?.fogDetected ? 'ALERT: Freezing of Gait detected!' : 'Normal gait flow'}
• Concave Efficiency: ${telemetryData?.efficiency ?? 92.4}%
• Leakage Bound Coeff: ${telemetryData?.leakageCoeff ?? 0.04}
Recommendation: Maintain attitude alignment between -3° and +5° pitch to minimize energy consumed during slanted terrain traversal.`
      });
    }

    const prompt = `You are an expert Biomechanical Telemetry & Legged Robotics Engineer specializing in Computer Vision (CV2) Gait Analysis, Freezing of Gait (FOG) Detection, Muscle-Verified Access Rings, and Energy Consumption Optimization.

Analyze the following telemetry snippet:
${JSON.stringify(telemetryData, null, 2)}

User Question / Context: ${userQuestion || 'Provide a concise clinical and technical diagnostic of the gait parameters, concave efficiency status, and suggested attitude/hover adjustments.'}

Provide a structured, insightful response formatted with clear Markdown headers, bullet points, and key metrics. Keep it highly practical and diagnostic.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      analysis: response.text || 'Analysis completed with no output.',
    });
  } catch (err: any) {
    console.error('Error in analyze-telemetry endpoint:', err);
    res.status(500).json({
      error: 'Failed to generate AI analysis',
      details: err?.message || String(err)
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
