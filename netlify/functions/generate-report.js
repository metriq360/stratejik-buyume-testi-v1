export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    const { userInfo, total, engineScores, bottleneck } = data;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { 
        statusCode: 500, 
        headers,
        body: JSON.stringify({ error: "Netlify panelinde GEMINI_API_KEY eksik kanka!" }) 
      };
    }

    const systemPrompt = "Sen METRIQ360 markasının kıdemli büyüme mühendisisin. Sert, dürüst ve kanka tonunda konuşursun. İşletme sahiplerine gerçekleri tokat gibi çarparsın.";
    const userQuery = `
      Müşteri: ${userInfo.name} ${userInfo.surname} | Sektör: ${userInfo.sector}
      Skor: ${total}/100 | Ana Darboğaz: ${bottleneck}
      Skor Detayları: Trafik: ${engineScores[1]}, Lead: ${engineScores[2]}, Satış: ${engineScores[3]}, Değer: ${engineScores[4]}
      Lütfen bu verilere dayanarak, işletmenin neden para kaybettiğini anlatan sert bir rapor yaz. Sonunda +90 537 948 48 68 numarasından randevu almasını söyle.
    `;

    // Model ismi gemini-2.5-flash olarak güncellendi
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return { 
        statusCode: response.status, 
        headers, 
        body: JSON.stringify({ error: "Google API hata verdi", details: result }) 
      };
    }

    const detailedReport = result.candidates?.[0]?.content?.parts?.[0]?.text || "Rapor oluşturulamadı kanka.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ detailedReport })
    };

  } catch (error) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: "Fonksiyon içi hata", message: error.message }) 
    };
  }
};
