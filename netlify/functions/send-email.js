import nodemailer from 'nodemailer';

// Markdown içeriğini görseldeki profesyonel şablona uygun HTML'e çeviren fonksiyon
const formatMarkdownToHTML = (text) => {
    if (!text) return "";
    return text
        // Ana Başlıklar (##)
        .replace(/^## (.*$)/gim, '<h3 style="color:#1e293b; font-size:19px; margin-top:35px; margin-bottom:15px; border-bottom:2px solid #f97316; padding-bottom:8px; font-family:sans-serif; font-weight:900; text-transform:uppercase; italic">$1</h3>')
        // Alt Başlıklar/Vurgulu Başlıklar
        .replace(/^\* (.*$)/gim, '<div style="margin-bottom:10px; padding-left:10px; border-left:3px solid #f97316; font-size:14px; line-height:1.6; color:#334155;">$1</div>')
        // Kalın yazılar
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a; font-weight:800;">$1</strong>')
        // Liste elemanları (Eğer madde işareti varsa)
        .replace(/^- (.*$)/gim, '<li style="margin-bottom:8px; font-size:14px; color:#475569;">$1</li>')
        // Paragraf boşlukları
        .replace(/\n/g, '<br>');
};

export const handler = async (event) => {
  const headers = { 
    "Access-Control-Allow-Origin": "*", 
    "Access-Control-Allow-Headers": "Content-Type" 
  };
  
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  try {
    const { userInfo, report, results, quizDetails } = JSON.parse(event.body);
    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 587,
      secure: false,
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      }
    });

    // 1. MÜŞTERİ MAİLİ (Görseldeki Turuncu/Lacivert Şablon)
    const userMailHTML = `
      <div style="font-family:sans-serif; max-width:600px; margin:auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:24px; overflow:hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="text-align:center; padding:40px 30px; border-bottom:6px solid #f97316;">
           <h1 style="margin:0; font-size:32px; color:#1e293b; letter-spacing:-1.5px; font-weight:900;">METRIQ<span style="color:#f97316;">360</span></h1>
           <p style="margin:8px 0 0; font-size:11px; color:#64748b; letter-spacing:3px; text-transform:uppercase; font-weight:700;">Stratejik Büyüme Laboratuvarı</p>
        </div>
        
        <div style="padding:40px; color:#334155;">
          <p style="font-size:16px; margin-bottom:10px;">Sayın <strong>${userInfo.name} ${userInfo.surname}</strong>,</p>
          <p style="font-size:14px; color:#64748b; margin-bottom:30px;">IQ360™ Büyüme Testi ön analiz sonuçlarınız aşağıdadır:</p>
          
          <!-- Skor Kartı (Görseldeki Gri Alan) -->
          <div style="background:#f8fafc; border:1px solid #f1f5f9; border-radius:20px; padding:35px; text-align:center; margin-bottom:40px;">
             <p style="margin:0; font-size:12px; color:#94a3b8; font-weight:800; text-transform:uppercase; letter-spacing:1px;">Genel Büyüme Puanınız</p>
             <h2 style="margin:15px 0; font-size:72px; color:#f97316; font-weight:900; line-height:1;">${results.total} <span style="font-size:24px; color:#cbd5e1; font-weight:400;">/ 100</span></h2>
             <div style="display:inline-block; background:#fff; border:1px solid #e2e8f0; padding:6px 16px; border-radius:100px; font-size:13px; color:#475569; font-weight:700;">
                Ana Darboğaz: <span style="color:#ef4444;">${results.bottleneck.toUpperCase()}</span>
             </div>
          </div>

          <!-- AI Raporu -->
          <div style="line-height:1.7; font-size:15px;">
            ${formatMarkdownToHTML(report)}
          </div>

          <!-- CTA & Uzman Notu -->
          <div style="margin-top:50px; padding:35px; background:#fff7ed; border-radius:24px; border:2px dashed #fbd38d; text-align:center;">
             <h3 style="margin-top:0; color:#c2410c; font-size:20px; font-weight:900;">Raporunuzun Detayları Hazırlanıyor ⚙️</h3>
             <p style="font-size:14px; color:#7c2d12; line-height:1.6; margin-bottom:25px;">Yukarıdaki bulgular ilk tespitlerdir. Büyüme uzmanımız <strong>Fikret Kara</strong>, verdiğiniz tüm cevapları bizzat inceleyip size özel <strong>Nihai Büyüme Stratejinizi</strong> hazırlayacak ve WhatsApp üzerinden iletişime geçecektir.</p>
             <a href="https://wa.me/905379484868" style="display:inline-block; background:#f97316; color:#ffffff; text-decoration:none; padding:20px 45px; border-radius:16px; font-weight:900; font-size:16px; box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);">WHATSAPP'TAN UZMANA BAĞLAN</a>
             <p style="margin-top:20px; font-size:11px; color:#9a3412; font-weight:700;">⚠️ Detaylı raporunuz Metriq360 ekibi tarafından hazırlanıyor.</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#0f172a; color:#ffffff; padding:40px; text-align:center; font-size:13px;">
           <p style="margin:0; font-weight:900; color:#f97316; letter-spacing:1px; font-size:14px;">METRIQ360 BÜYÜME EKİBİ</p>
           <div style="margin:15px 0; color:#94a3b8;">
              📞 +90 537 948 48 68<br>
              ✉️ <a href="mailto:bilgi@metriq360.tr" style="color:#94a3b8; text-decoration:none;">bilgi@metriq360.tr</a><br>
              🌐 <a href="https://www.metriq360.tr" style="color:#94a3b8; text-decoration:none;">www.metriq360.tr</a>
           </div>
           <p style="margin:25px 0 0; opacity:0.5; font-size:11px;">© 2026 Metriq360. Tüm Hakları Saklıdır.</p>
        </div>
      </div>
    `;

    // 2. ADMIN MAİLİ (Senin için tam donanımlı lead dosyası)
    const adminMailHTML = `
      <div style="font-family:sans-serif; padding:30px; color:#1e293b; background:#f1f5f9;">
        <div style="background:#fff; border-radius:20px; padding:30px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
            <h2 style="color:#f97316; border-bottom:4px solid #f97316; padding-bottom:12px; margin-top:0;">YENİ BÜYÜME ANALİZİ TALEBİ</h2>
            
            <table style="width:100%; border-collapse:collapse; margin:25px 0;">
              <tr><td style="padding:12px; border-bottom:1px solid #f1f5f9;"><strong>Müşteri:</strong></td><td>${userInfo.name} ${userInfo.surname}</td></tr>
              <tr><td style="padding:12px; border-bottom:1px solid #f1f5f9;"><strong>WhatsApp:</strong></td><td><a href="https://wa.me/${userInfo.whatsapp}" style="color:#f97316; font-weight:bold;">${userInfo.whatsapp}</a></td></tr>
              <tr><td style="padding:12px; border-bottom:1px solid #f1f5f9;"><strong>E-posta:</strong></td><td>${userInfo.email}</td></tr>
              <tr><td style="padding:12px; border-bottom:1px solid #f1f5f9;"><strong>Sektör:</strong></td><td>${userInfo.sector}</td></tr>
              <tr><td style="padding:12px; border-bottom:1px solid #f1f5f9;"><strong>Genel Skor:</strong></td><td><span style="font-size:20px; font-weight:900; color:#f97316;">${results.total}</span> / 100</td></tr>
              <tr><td style="padding:12px; border-bottom:1px solid #f1f5f9;"><strong>Ana Darboğaz:</strong></td><td style="color:#ef4444; font-weight:bold;">${results.bottleneck}</td></tr>
            </table>
            
            <h3 style="background:#f8fafc; padding:15px; border-radius:10px;">Kullanıcı Yanıtları:</h3>
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:12px;">
                  <tr style="background:#1e293b; color:#fff;">
                     <th style="padding:12px; text-align:left;">Soru Metni</th>
                     <th style="padding:12px; text-align:center; width:60px;">Puan</th>
                  </tr>
                  ${quizDetails.map(q => `
                    <tr>
                      <td style="padding:10px; border-bottom:1px solid #f1f5f9;">${q.question}</td>
                      <td style="padding:10px; border-bottom:1px solid #f1f5f9; text-align:center; font-weight:bold; color:#f97316; font-size:14px;">${q.answer}</td>
                    </tr>
                  `).join('')}
                </table>
            </div>

            <div style="margin-top:40px; background:#fafafa; padding:25px; border-radius:15px; border:1px solid #e2e8f0;">
              <h3 style="margin-top:0; color:#0f172a;">Müşteriye Gönderilen AI Taslağı:</h3>
              <div style="color:#475569; font-style:italic;">
                ${formatMarkdownToHTML(report)}
              </div>
            </div>
        </div>
      </div>
    `;

    // Gönderimler
    await transporter.sendMail({ from: `"METRIQ360 Analiz" <${process.env.EMAIL_USER}>`, to: userInfo.email, subject: `IQ360™ Büyüme Analiz Raporunuz Hazır`, html: userMailHTML });
    await transporter.sendMail({ from: `"METRIQ360 Lead" <${process.env.EMAIL_USER}>`, to: process.env.ADMIN_EMAIL, subject: `YENİ LEAD: ${userInfo.name} (Skor: ${results.total})`, html: adminMailHTML });

    return { statusCode: 200, headers, body: JSON.stringify({ message: "Başarılı" }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
