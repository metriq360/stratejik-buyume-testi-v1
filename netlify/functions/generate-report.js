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

    // HATA DEDEKTİFİ 1: API Key Netlify'da var mı?
    if (!apiKey || apiKey === "") {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ detailedReport: "SİSTEM HATASI: Netlify'da GEMINI_API_KEY eksik veya tanımlanmamış. Lütfen Netlify ayarlarını kontrol edin." })
        };
    }

    const systemPrompt = `
      Sen METRIQ360 markasının "Kıdemli Büyüme Mühendisi"sin. 
      Persona: Otoriter, stratejik, veriye dayalı konuşan bir uzmansın. 
      ÖNEMLİ: Raporu tam olarak şu bölümler altında yaz ve her bölümü net bir başlık (##) ile açıkla. Asla imza atma.
      
      BÖLÜMLER:
      1. ## Mevcut Dijital Röntgeniniz (Sektörel özet ve genel skor yorumu)
      2. ## Kritik Ciro Kayıpları ve Sızıntılar (Özellikle en zayıf motor olan ${bottleneck} üzerine odaklanarak finansal kayıpları açıkla)
      3. ## Gizli Büyüme Potansiyelleri (Mevcut eksikler giderildiğinde işletmenin kazanabileceği pazar payı ve gelir)
      4. ## İlk 3 Stratejik Hamle (Sektöre ve cevaplara özel, uygulanabilir 3 maddelik eylem planı)
    `;

    const userQuery = `
      Müşteri Bilgileri: ${userInfo.name} ${userInfo.surname} | Sektör: ${userInfo.sector}
      Genel Büyüme Skoru: ${total}/100 | Ana Darboğaz: ${bottleneck}
      Detaylı Motor Skorları: Trafik: ${engineScores[1]}, Lead: ${engineScores[2]}, Satış: ${engineScores[3]}, Değer: ${engineScores[4]}
      
      Lütfen bu verilere dayalı, profesyonel, sektörel gerçekleri yansıtan ve uydurma olmayan bir analiz raporu hazırla.
    `;

    // Modeli daha stabil olan 1.5-flash sürümüne sabitledik
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });

    // HATA DEDEKTİFİ 2: Google isteği reddetti mi? (Örn: API Key süresi dolmuşsa)
    if (!response.ok) {
        const errorData = await response.json();
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ detailedReport: `API REDDETTİ: ${errorData.error?.message || "Google AI bağlantı kurulamadı. API Key geçersiz olabilir."}` })
        };
    }

    const result = await response.json();
    const detailedReport = result.candidates?.[0]?.content?.parts?.[0]?.text || "İçerik oluşturulamadı.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ detailedReport })
    };
  } catch (error) {
    // HATA DEDEKTİFİ 3: Kodda bir çökme olursa
    return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ detailedReport: `SUNUCU HATASI: ${error.message}` }) 
    };
  }
};
