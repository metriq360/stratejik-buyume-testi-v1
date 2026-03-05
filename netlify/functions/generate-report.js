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
    const data = JSON.parse(event.body);
    const { userInfo, total, engineScores, bottleneck } = data;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return { 
        statusCode: 500, 
        headers,
        body: JSON.stringify({ error: "GEMINI_API_KEY Netlify panelinde eksik kanka!" }) 
      };
    }

    const prompt = `
      Sen METRIQ360 markasının kıdemli büyüme mühendisisin.
      Müşteri: ${userInfo.name} ${userInfo.surname} | Sektör: ${userInfo.sector}
      Skor: ${total}/100 | Darboğaz Bölgesi: ${bottleneck}
      
      Detaylı Skorlar (25 üzerinden): 
      Trafik: ${engineScores[1]}, Lead: ${engineScores[2]}, Satış: ${engineScores[3]}, Değer: ${engineScores[4]}

      TALİMATLAR:
      1. Raporu METRIQ360'ın sert, dürüst ve kanka tonunda yaz.
      2. "Kanka, senin dükkanın asıl sızıntısı ${bottleneck} tarafında..." diyerek gerçekleri yüzüne vur.
      3. Bu skorlarla neden para kaybettiğini anlat.
      4. Çözüm için +90 537 948 48 68 numarasından randevu alması gerektiğini belirt.
    `;

    // Yerel (native) fetch kullanımı (Node 18+)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini API Hata Detayı:", result);
      return { statusCode: response.status, headers, body: JSON.stringify({ error: "AI motoru patladı", details: result }) };
    }

    const detailedReport = result.candidates?.[0]?.content?.parts?.[0]?.text || "Analiz şu an yapılamıyor kanka, skorun yukarıda.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ detailedReport })
    };
  } catch (error) {
    console.error("Fonksiyon Hatası:", error.message);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ error: "Sunucu içi hata", message: error.message }) 
    };
  }
};
