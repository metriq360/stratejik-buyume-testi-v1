import nodemailer from 'nodemailer';

const formatMarkdownToHTML = (text) => {
    if (!text) return "";
    return text
        .replace(/^## (.*$)/gim, '<h2 style="color:#f97316; font-family:sans-serif; border-bottom:1px solid #eee; padding-bottom:10px; margin-top:25px;">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f97316;">$1</strong>')
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

    // 1. MÜŞTERİYE GİDEN ŞIK MAİL
    const userMailOptions = {
      from: `"METRIQ360" <${process.env.EMAIL_USER}>`,
      to: userInfo.email,
      subject: `IQ360™ Büyüme Analiz Raporun Hazır (Skor: ${results.total}/100)`,
      html: `
        <div style="font-family:sans-serif; max-width:650px; margin:auto; padding:30px; border:1px solid #eee; border-radius:30px; background-color:#fff;">
          <h1 style="color:#f97316; text-align:center;">METRIQ360</h1>
          <div style="background:#0f172a; color:#fff; padding:20px; border-radius:20px; text-align:center; margin:20px 0;">
            <p style="margin:0; font-size:12px; opacity:0.7;">GENEL SKORUN</p>
            <h2 style="margin:0; font-size:48px; color:#f97316;">${results.total} / 100</h2>
          </div>
          <div style="color:#334155;">${formatMarkdownToHTML(report)}</div>
          <div style="text-align:center; margin-top:40px;">
            <a href="https://wa.me/905379484868" style="background:#f97316; color:#fff; padding:15px 30px; text-decoration:none; border-radius:10px; font-weight:bold;">RANDEVU AL</a>
          </div>
        </div>
      `
    };

    // 2. SANA (ADMIN) GİDEN DETAYLI MAİL
    const adminMailOptions = {
      from: `"SİSTEM BİLDİRİMİ" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `YENİ LEAD: ${userInfo.name} (Skor: ${results.total})`,
      html: `
        <div style="font-family:sans-serif; padding:20px;">
          <h2>Yeni Analiz: ${userInfo.name} ${userInfo.surname}</h2>
          <p><strong>E-posta:</strong> ${userInfo.email}</p>
          <p><strong>Sektör:</strong> ${userInfo.sector}</p>
          <p><strong>Genel Skor:</strong> ${results.total}</p>
          
          <h3>Kullanıcı Yanıtları Tablosu:</h3>
          <table style="width:100%; border-collapse:collapse;">
            <tr style="background:#eee;">
              <th style="padding:10px; border:1px solid #ccc;">Bölüm</th>
              <th style="padding:10px; border:1px solid #ccc;">Soru</th>
              <th style="padding:10px; border:1px solid #ccc;">Puan</th>
            </tr>
            ${quizDetails.map(q => `
              <tr>
                <td style="padding:10px; border:1px solid #ccc;">${q.section}</td>
                <td style="padding:10px; border:1px solid #ccc;">${q.question}</td>
                <td style="padding:10px; border:1px solid #ccc; font-weight:bold; color:red;">${q.answer}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `
    };

    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(adminMailOptions);

    return { statusCode: 200, headers, body: JSON.stringify({ message: "Tamam" }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
