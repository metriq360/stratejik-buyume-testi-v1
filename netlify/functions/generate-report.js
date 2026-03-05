import fetch from 'node-fetch';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const { userInfo, total, engineScores, bottleneck } = body;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "GEMINI_API_KEY bulunamadı." }) 
      };
    }

    const prompt = `
      Sen METRIQ360 markasının "Kıdemli Büyüme Mühendisi"sin. 
      Müşteri: ${userInfo.name} ${userInfo.surname} | Sektör: ${userInfo.sector}
      Skor: ${total}/100 | Darboğaz: ${bottleneck}
      
      Skorlar (25 üzerinden): 
      Trafik: ${engineScores[1]}, 
      Lead: ${engineScores[2]}, 
      Satış: ${engineScores[3]}, 
      Değer: ${engineScores[4]}

      TALİMATLAR:
      1. Raporu METRIQ360'ın sert, net ve kanka tonunda yaz.
      2. "Kanka, senin asıl sızıntın ${bottleneck} tarafında..." diye gir.
      3. Bu skorla neden para kaybettiğini ve ölçeklenemediğini tokat gibi yüzüne vur.
      4. Çözüm için +90 537 948 48 68 numarasından randevu alması gerektiğini söyle.
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();
    const detailedReport = result.candidates?.[0]?.content?.parts?.[0]?.text || "Rapor oluşturulamadı kanka.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ detailedReport })
    };
  } catch (error) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "İç hata", message: error.message }) 
    };
  }
};
