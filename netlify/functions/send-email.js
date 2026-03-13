import nodemailer from 'nodemailer';

const formatMarkdownToHTML = (text) => {
    if (!text) return "";
    return text
        .replace(/^## (.*$)/gim, '<h3 style="color:#f97316; font-size:18px; margin-top:25px; border-bottom:1px solid #eee; padding-bottom:5px;">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#111;">$1</strong>')
        .replace(/^\* (.*$)/gim, '<li style="margin-bottom:8px;">$1</li>')
        .replace(/\n/g, '<br>');
};

export const handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  try {
    const { userInfo, report, results, quizDetails } = JSON.parse(event.body);
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, port: 587, secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    // 1. MÜŞTERİ MAİLİ (Görseldeki Şablon)
    const userMailHTML = `
      <div style="font-family:sans-serif; max-width:600px; margin:auto; background:#fff; border:1px solid #eee; border-radius:15px; overflow:hidden;">
        <div style="text-align:center; padding:30px; border-bottom:5px solid #f97316;">
           <h1 style="margin:0; font-size:28px; color:#1e293b; letter-spacing:-1px;">METRIQ<span style="color:#f97316;">360</span></h1>
           <p style="margin:5px 0 0; font-size:10px; color:#64748b; letter-spacing:2px; text-transform:uppercase;">Stratejik Büyüme Laboratuvarı</p>
        </div>
        <div style="padding:30px; color:#334155;">
          <p style="font-size:16px;">Sayın <strong>${userInfo.name} ${userInfo.surname}</strong>,</p>
          <p style="font-size:14px; color:#64748b;">IQ360™ Büyüme Testi ön analiz sonuçlarınız aşağıdadır:</p>
          
          <div style="background:#f8fafc; border-radius:15px; padding:25px; text-align:center; margin:30px 0;">
             <p style="margin:0; font-size:11px; color:#94a3b8; font-weight:bold; text-transform:uppercase;">Genel Büyüme Puanınız</p>
             <h2 style="margin:10px 0; font-size:60px; color:#f97316;">${results.total} <span style="font-size:20px; color:#cbd5e1;">/ 100</span></h2>
             <p style="margin:0; font-size:13px; color:#64748b;">Ana Darboğaz: <strong>${results.bottleneck.toUpperCase()}</strong></p>
          </div>

          <div style="line-height:1.6;">${formatMarkdownToHTML(report)}</div>

          <div style="margin-top:40px; padding:30px; background:#fff7ed; border-radius:20px; border:1px solid #ffedd5; text-align:center;">
             <h3 style="margin-top:0; color:#c2410c;">Raporunuzun Detayları Hazırlanıyor ⚙️</h3>
             <p style="font-size:13px; color:#7c2d12;">Yukarıdaki bulgular ilk tespitlerdir. Uzmanımız <strong>Fikret Kara</strong>, cevaplarınızı bizzat inceleyip size özel <strong>Nihai Büyüme Stratejinizi</strong> hazırlayacak ve WhatsApp üzerinden iletişime geçecektir.</p>
             <a href="https://wa.me/905379484868" style="display:inline-block; background:#f97316; color:#fff; text-decoration:none; padding:18px 40px; border-radius:15px; font-weight:bold; margin-top:15px;">WHATSAPP'TAN UZMANA BAĞLAN</a>
          </div>
        </div>
        <div style="background:#0f172a; color:#fff; padding:30px; text-align:center; font-size:12px;">
           <p style="margin:0; font-weight:bold; color:#f97316;">METRIQ360 BÜYÜME EKİBİ</p>
           <p style="margin:10px 0 0; opacity:0.6;">+90 537 948 48 68 | www.metriq360.tr</p>
           <p style="margin:20px 0 0; opacity:0.4;">© 2026 Metriq360. Tüm Hakları Saklıdır.</p>
        </div>
      </div>
    `;

    // 2. ADMIN MAİLİ (Sana Giden Detaylı Rapor)
    const adminMailHTML = `
      <div style="font-family:sans-serif; padding:20px; color:#333;">
        <h2 style="color:#f97316; border-bottom:3px solid #f97316; padding-bottom:10px;">YENİ LEAD: ${userInfo.name} ${userInfo.surname}</h2>
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
          <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>E-posta:</strong></td><td>${userInfo.email}</td></tr>
          <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>WhatsApp:</strong></td><td><a href="https://wa.me/${userInfo.whatsapp}">${userInfo.whatsapp}</a></td></tr>
          <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Sektör:</strong></td><td>${userInfo.sector}</td></tr>
          <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Genel Skor:</strong></td><td>${results.total}</td></tr>
          <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Ana Darboğaz:</strong></td><td>${results.bottleneck}</td></tr>
        </table>
        
        <h3>Kullanıcı Yanıt Tablosu:</h3>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <tr style="background:#f8fafc;">
             <th style="padding:10px; border:1px solid #eee; text-align:left;">Soru</th>
             <th style="padding:10px; border:1px solid #eee; text-align:center;">Puan</th>
          </tr>
          ${quizDetails.map(q => `
            <tr>
              <td style="padding:10px; border:1px solid #eee;">${q.question}</td>
              <td style="padding:10px; border:1px solid #eee; text-align:center; font-weight:bold; color:#f97316;">${q.answer}</td>
            </tr>
          `).join('')}
        </table>

        <div style="margin-top:30px; background:#f1f5f9; padding:20px; border-radius:10px;">
          <h3 style="margin-top:0;">Hazırlanan AI Raporu:</h3>
          ${formatMarkdownToHTML(report)}
        </div>
      </div>
    `;

    await transporter.sendMail({ from: `"METRIQ360 Analiz" <${process.env.EMAIL_USER}>`, to: userInfo.email, subject: `IQ360™ Büyüme Analiz Raporun Hazır`, html: userMailHTML });
    await transporter.sendMail({ from: `"METRIQ360 Bildirim" <${process.env.EMAIL_USER}>`, to: process.env.ADMIN_EMAIL, subject: `YENİ LEAD: ${userInfo.name} (Skor: ${results.total})`, html: adminMailHTML });

    return { statusCode: 200, headers, body: JSON.stringify({ message: "OK" }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
