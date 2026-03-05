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
      Persona: Otoriter, stratejik, veriye dayalı konuşan bir uzmansın. 
      ÖNEMLİ: Raporun sonuna asla "Saygılarımla", "[Adınız Soyadınız]", "İmza" gibi yer tutucular ekleme. Raporu doğrudan sonuç cümlesiyle bitir.
      Dil Tonu: Profesyonel, ciddi ve uyarıcı. İşletme sahibinin parasının nerede yandığını açıkça göster.
    `;

    const userQuery = `
      Müşteri: ${userInfo.name} ${userInfo.surname} | Sektör: ${userInfo.sector}
      Skor: ${total}/100 | Ana Darboğaz: ${bottleneck}
      Detaylı Skorlar (25 üzerinden): Trafik: ${engineScores[1]}, Lead: ${engineScores[2]}, Satış: ${engineScores[3]}, Değer: ${engineScores[4]}

      RAPOR İÇERİĞİ (Markdown kullan):
      1. ## Stratejik Analiz: Bu skorun (özellikle ${userInfo.sector} sektörü için) neden tehlikeli olduğunu açıkla.
      2. ## Darboğaz Teşhisi: ${bottleneck} bölgesindeki sızıntının neden tüm sistemi felç ettiğini anlat.
      3. ## Motor Analizleri: Her bir motorun (Trafik, Lead, Satış, Değer) skorunu yorumla ve neden düşük olduğunu belirt.
      4. ## Acil Eylem Çağrısı: Analiz bittiğinde, bu sızıntıyı durdurmak için tek yolun +90 537 948 48 68 numarasından randevu almak olduğunu vurgula.

      DİKKAT: Raporun sonunda imza veya isim soyisim alanı bırakma. Direkt eylem çağrısıyla bitir.
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
    const detailedReport = result.candidates?.[0]?.content?.parts?.[0]?.text || "Analiz raporu oluşturulamadı.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ detailedReport })
    };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
