export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  try {
    const data = JSON.parse(event.body);
    const { userInfo, total, engineScores, bottleneck } = data;
    const apiKey = process.env.GEMINI_API_KEY;

    const systemPrompt = `
      Sen METRIQ360 markasının "Kıdemli Büyüme Mühendisi"sin. 
      Persona: Otoriter, veriye dayalı konuşan, işletme sahibinin stratejik hatalarını profesyonel bir dille yüzüne çarpan bir uzmansın.
      Dil Tonu: "Kanka" gibi aşırı lakayıt kelimelerden kaçın. Bunun yerine "Dostum", "Analizimiz gösteriyor ki" veya "Bak burası kritik" gibi daha ciddi bir ton kullan.
      Amaç: İşletmedeki finansal sızıntıyı göstermek ve acil randevu almasını sağlamak.
    `;

    const userQuery = `
      Müşteri: ${userInfo.name} ${userInfo.surname} | Sektör: ${userInfo.sector}
      Genel Skor: ${total}/100 | Ana Darboğaz: ${bottleneck}
      Motor Skorları (25 üzerinden): Trafik: ${engineScores[1]}, Lead: ${engineScores[2]}, Satış: ${engineScores[3]}, Değer: ${engineScores[4]}

      RAPOR YAPISI (Markdown formatında yaz):
      1. ## Stratejik Analiz: Skorun neden düşük olduğunu ve mobilya sektöründeki rekabette bu skorun ne anlama geldiğini anlat.
      2. ## Darboğaz Teşhisi: ${bottleneck} tarafındaki sızıntının neden tüm büyümeyi durdurduğunu açıkla.
      3. ## Kritik Sızıntılar: Trafik, Lead, Satış ve Değer motorlarını analiz et.
      4. ## Sonuç: Neden acil olarak +90 537 948 48 68 numarasından randevu alması gerektiğini vurgula.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });

    const result = await response.json();
    const detailedReport = result.candidates?.[0]?.content?.parts?.[0]?.text || "Analiz raporu hazırlanamadı.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ detailedReport })
    };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
