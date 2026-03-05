import nodemailer from 'nodemailer';

const formatMarkdownToHTML = (text) => {
    if (!text) return "";
    return text
        .replace(/### (.*)/g, '<h3 style="color:#f97316; font-family:sans-serif;">$1</h3>')
        .replace(/## (.*)/g, '<h2 style="color:#f97316; font-family:sans-serif;">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { userInfo, report, results } = JSON.parse(event.body);

    // Google Workspace veya Gmail için ayarlar
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // smtp.gmail.com
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Google Uygulama Şifresi
      }
    });

    const mailOptions = {
      from: `"METRIQ360" <${process.env.EMAIL_USER}>`,
      to: userInfo.email,
      subject: `IQ360™ Büyüme Analiz Raporun (Skor: ${results.total}/100)`,
      html: `
        <div style="font-family:sans-serif; max-width:600px; margin:auto; border:1px solid #eee; padding:20px; border-radius:20px;">
          <h1 style="color:#f97316; text-align:center;">METRIQ360</h1>
          <p>Selam ${userInfo.name}, röntgen sonuçların hazır:</p>
          <div style="background:#f8fafc; padding:15px; border-radius:15px; border-left:5px solid #f97316;">
            ${formatMarkdownToHTML(report)}
          </div>
          <p style="text-align:center; margin-top:20px;">
            <a href="https://wa.me/905379484868" style="background:#f97316; color:white; padding:12px 25px; text-decoration:none; border-radius:10px; font-weight:bold;">STRATEJİ SEANSI AL</a>
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { statusCode: 200, body: JSON.stringify({ message: "Mail başarıyla uçtu!" }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: "Mail gönderilirken patladı", details: error.message }) };
  }
};
