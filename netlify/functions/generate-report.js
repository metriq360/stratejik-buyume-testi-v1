const fetch = require('node-fetch');

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const body = JSON.parse(event.body);
    const { userInfo, total, engineScores, bottleneck } = body;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) throw new Error("GEMINI_API_KEY eksik.");

    const prompt = `
      Sen METRIQ360 markasının "Kıdemli Büyüme Mühendisi"sin. 
      İşletmelerin ciro akışındaki kopuklukları bulan "IQ360 Büyüme Röntgeni" sistemisin.
      
      Müşteri: ${userInfo.name} ${userInfo.surname}
      Sektör: ${userInfo.sector}
      Genel Büyüme Skoru: ${total}/100
      Tespit Edilen Ana Darboğaz: ${bottleneck}
      
      Alt Motor Skorları (25 üzerinden):
      - Trafik: ${engineScores[1]}
      - Lead: ${engineScores[2]}
      - Satış: ${engineScores[3]}
      - Değer: ${engineScores[4]}

      STRATEJİK TEŞHİS TALİMATLARI:
      1. Raporu METRIQ360'ın sert, net, samimi ve "Kanka" tonundaki o meşhur diliyle yaz.
      2. ŞOK ETKİSİ (Tokat): "Kanka, senin sorunun reklamda değil ${bottleneck}'nda..." diye başla. 
      3. PARA KAÇAĞI HESABI: Bu sızıntılar yüzünden ayda tahminen kaç TL potansiyel ciroyu yere düşürdüğünü (sektöre göre tahmini bir rakam ver) BÜYÜK ve ÇARPICI bir şekilde vurgula.
      4. STRATEJİK ÖNGÖRÜ: Bu darboğazı tıkarsak bütçe artırmadan cironun yüzde kaç artabileceğini söyle.
      5. KAPANIŞ: Raporu tam bir çözümle bitirme; "Bu rakamlar sadece ön izleme kanka, gel 30 dakikada matematiksel simülasyon yapalım" diyerek randevuya (tel: +90 537 948 48 68) yönlendir.
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "AI servisi hata verdi.");

    const detailedReport = result.candidates?.[0]?.content?.parts?.[0]?.text || "Rapor hazırlanırken bir sorun oluştu.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ detailedReport }),
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
