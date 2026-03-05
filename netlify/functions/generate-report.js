import fetch from 'node-fetch';

export const handler = async (event) => {
  // CORS Ayarları: Tarayıcıyı sakinleştirelim
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Tarayıcı "OPTIONS" isteği atarsa (Pre-flight) "OK" ver ve geç
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const { userInfo, total, engineScores, bottleneck } = JSON.parse(event.body);
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      console.error("HATA: GEMINI_API_KEY eksik!");
      return { 
        statusCode: 500, 
        headers,
        body: JSON.stringify({ error: "API Anahtarı Netlify panelinde eksik kanka!" }) 
      };
    }

    const prompt = `
      Sen METRIQ360'ın sert ve samimi kıdemli büyüme mühendisisin.
      Müşteri: ${userInfo.name} | Sektör: ${userInfo.sector}
      Skor: ${total}/100 | Darboğaz: ${bottleneck}
      
      TALİMAT:
      1. Raporu sert ve tokat gibi bir gerçeklikle yaz. 
      2. "Kanka, senin dükkanın asıl sızıntısı ${bottleneck} tarafında..." diye gir.
      3. Çözüm için +90 537 948 48 68 numarasından randevu alması gerektiğini belirt.
    `;

    // Gemini API isteği
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Hatası:", errorData);
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Gemini API patladı", details: errorData }) };
    }

    const result = await response.json();
    const detailedReport = result.candidates?.[0]?.content?.parts?.[0]?.text || "AI şu an meşgul, ama skorun belli kanka!";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ detailedReport })
    };
  } catch (error) {
    console.error("Fonksiyon İçi Kritik Hata:", error.message);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ error: "Fonksiyon çöktü", message: error.message }) 
    };
  }
};
