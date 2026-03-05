import nodemailer from 'nodemailer';

const formatMarkdownToHTML = (text) => {
    if (!text) return "";
    return text
        .replace(/^## (.*$)/gim, '<h2 style="color:#f97316; font-family:sans-serif; border-bottom:2px solid #eee; padding-bottom:10px; margin-top:30px; font-size:20px;">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#111; font-weight:800;">$1</strong>')
        .replace(/\n/g, '<br>');
};

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    // 1. MÜŞTERİYE GİDEN MAİL ŞABLONU
    const userMailOptions = {
      from: `"METRIQ360 Analiz Merkezi" <${process.env.EMAIL_USER}>`,
      to: userInfo.email,
      subject: `IQ360™ Büyüme Analiz Raporun Hazır (Skor: ${results.total}/100)`,
      html: `
        <div style="font-family:sans-serif; max-width:650px; margin:auto; padding:40px; border:1px solid #e2e8f0; border-radius:40px; background-color:#ffffff; color:#1e293b;">
          <div style="text-align:center; margin-bottom:40px;">
            <h1 style="color:#f97316; margin:0; font-size:36px; letter-spacing:-1px; font-weight:900;">METRIQ360</h1>
            <p style="color:#64748b; text-transform:uppercase; font-size:12px; letter-spacing:4px; margin-top:5px; font-weight:700;">IQ360™ Stratejik Analiz Sistemi</p>
          </div>
          
          <div style="background:#0f172a; color:#ffffff; padding:35px; border-radius:30px; margin-bottom:40px; text-align:center;">
            <p style="margin:0; opacity:0.6; font-size:13px; text-transform:uppercase; font-weight:700;">Analiz Sonuç Skoru</p>
            <h2 style="margin:10px 0; font-size:64px; color:#f97316; font-weight:900;">${results.total} <span style="font-size:24px; opacity:0.4;">/ 100</span></h2>
            <div style="display:inline-block; background:rgba(249, 115, 22, 0.1); border:1px solid #f97316; padding:8px 20px; border-radius:100px; color:#f97316; font-size:14px; font-weight:800; margin-top:10px;">
              ANA DARBOĞAZ: ${results.bottleneck.toUpperCase()}
            </div>
          </div>

          <div style="line-height:1.8; font-size:16px; color:#334155;">
            ${formatMarkdownToHTML(report)}
          </div>

          <div style="margin-top:50px; padding:40px; background:#fff7ed; border-radius:30px; text-align:center; border:2px dashed #f97316;">
            <p style="font-weight:900; color:#c2410c; font-size:18px; margin-bottom:20px;">BU SIZINTIYI DURDURMAK İÇİN ACİL RANDEVU ALIN</p>
            <a href="https://wa.me/905379484868" style="background:#f97316; color:#ffffff; padding:20px 40px; text-decoration:none; border-radius:20px; font-weight:900; font-size:18px; display:inline-block; box-shadow:0 10px 15px -3px rgba(249,115,22,0.4);">
              STRATEJİ SEANSINI BAŞLAT
            </a>
            <p style="margin-top:20px; font-size:16px; font-weight:700; color:#0f172a;">WhatsApp: +90 537 948 48 68</p>
          </div>

          <div style="margin-top:40px; padding-top:20px; border-top:1px solid #eee; text-align:center; color:#94a3b8; font-size:14px;">
            <p>Saygılarımızla,</p>
            <p style="font-weight:bold; color:#0f172a;">METRIQ360 Strateji Ekibi</p>
          </div>
        </div>
      `
    };

    // 2. SANA (ADMIN) GİDEN DETAYLI DOSYA
    const adminMailOptions = {
      from: `"SİSTEM BİLDİRİMİ" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `YENİ ANALİZ: ${userInfo.name} ${userInfo.surname} (Skor: ${results.total})`,
      html: `
        <div style="font-family:sans-serif; padding:30px; background:#f8fafc;">
          <h1 style="color:#0f172a; border-bottom:4px solid #f97316; padding-bottom:10px;">Yeni Analiz Tamamlandı</h1>
          
          <div style="background:#fff; padding:20px; border-radius:15px; margin:20px 0; border:1px solid #e2e8f0;">
            <h3 style="margin-top:0;">Müşteri Bilgileri</h3>
            <p><strong>Ad Soyad:</strong> ${userInfo.name} ${userInfo.surname}</p>
            <p><strong>E-posta:</strong> ${userInfo.email}</p>
            <p><strong>Sektör:</strong> ${userInfo.sector}</p>
            <p><strong>Toplam Skor:</strong> ${results.total}/100</p>
            <p><strong>Darboğaz:</strong> ${results.bottleneck}</p>
          </div>
          
          <h3>Kullanıcı Yanıtları Tablosu:</h3>
          <table style="width:100%; border-collapse:collapse; background:#fff; border-radius:10px; overflow:hidden;">
            <thead>
              <tr style="background:#0f172a; color:#fff; text-align:left;">
                <th style="padding:12px; border:1px solid #334155;">Bölüm</th>
                <th style="padding:12px; border:1px solid #334155;">Soru</th>
                <th style="padding:12px; border:1px solid #334155;">Puan</th>
              </tr>
            </thead>
            <tbody>
              ${quizDetails.map(q => `
                <tr>
                  <td style="padding:10px; border:1px solid #e2e8f0; font-size:12px;">${q.section}</td>
                  <td style="padding:10px; border:1px solid #e2e8f0; font-size:12px;">${q.question}</td>
                  <td style="padding:10px; border:1px solid #e2e8f0; font-weight:bold; color:#f97316; text-align:center;">${q.answer}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <hr style="margin:40px 0; border:0; border-top:2px solid #e2e8f0;"/>
          
          <h3 style="color:#0f172a;">Müşteriye Gönderilen AI Raporu:</h3>
          <div style="background:#fff; padding:30px; border-radius:20px; border:1px solid #e2e8f0; line-height:1.6;">
            ${formatMarkdownToHTML(report)}
          </div>
        </div>
      `
    };

    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(adminMailOptions);

    return { statusCode: 200, headers, body: JSON.stringify({ message: "Mailler uçtu!" }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
