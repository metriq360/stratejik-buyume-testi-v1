export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userInfo, total, engineScores, bottleneck } = JSON.parse(event.body);
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "API Anahtarı (GEMINI_API_KEY) Netlify panelinde eksik kanka!" }) 
      };
    }

    const prompt = `
      Sen METRIQ360'ın sert ve samimi (kanka tonunda) kıdemli büyüme mühendisisin.
      Müşteri: ${userInfo.name} | Sektör: ${userInfo.sector}
      Skor: ${total}/100 | Darboğaz: ${bottleneck}
      
      TALİMAT:
      1. Raporu sert ve tokat gibi bir gerçeklikle yaz. 
      2. "Kanka, senin dükkanın asıl sızıntısı ${bottleneck} tarafında..." diye gir.
      3. Çözüm için +90 537 948 48 68 numarasından randevu alması gerektiğini belirt.
    `;

    // Modern Node.js (18+) kullandığımız için dışarıdan kütüphaneye (node-fetch) gerek yok, global fetch kullanıyoruz.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();
    const detailedReport = result.candidates?.[0]?.content?.parts?.[0]?.text || "AI şu an meşgul, ama skorun belli kanka!";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ detailedReport })
    };
  } catch (error) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Fonksiyon çöktü", message: error.message }) 
    };
  }
};
