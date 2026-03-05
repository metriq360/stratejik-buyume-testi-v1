const nodemailer = require('nodemailer');

const formatMarkdownToHTML = (text) => {
    return text
        .replace(/### (.*)/g, '<h3 style="color:#f97316; margin-top:20px; font-family:sans-serif;">$1</h3>')
        .replace(/## (.*)/g, '<h2 style="color:#f97316; margin-top:25px; font-family:sans-serif; border-bottom:1px solid #eee;">$1</h2>')
        .replace(/# (.*)/g, '<h1 style="color:#f97316; margin-top:30px; text-align:center; font-family:sans-serif;">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#111; background:#fff7ed;">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em style="color:#444;">$1</em>')
        .replace(/^\* (.*)/gm, '<li style="margin-bottom:8px; color:#334155;">$1</li>')
        .replace(/\n/g, '<br>');
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { userInfo, report, results } = JSON.parse(event.body);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const cleanReport = formatMarkdownToHTML(report);

    const mailToUser = {
        from: `"METRIQ360 Strateji Ekibi" <${process.env.EMAIL_USER}>`,
        to: userInfo.email,
        subject: `IQ360™ Büyüme Testi Raporunuz Hazır (Skor: ${results.total}/100)`,
        html: `
            <div style="font-family: sans-serif; max-width: 650px; margin:auto; color:#333; line-height: 1.6; border:1px solid #eee; padding:20px; border-radius:20px;">
                <div style="text-align:center; padding: 20px 0;">
                    <h1 style="color: #f97316; margin:0; font-size: 32px;">METRIQ360</h1>
                    <p style="text-transform:uppercase; letter-spacing:3px; color:#999; font-size:11px;">Büyüme Mühendisliği</p>
                </div>
                
                <h2 style="color:#111;">Sayın ${userInfo.name},</h2>
                <p>İşletmenizin büyüme motorlarını analiz ettik. Toplam Büyüme Skorunuz: <strong>${results.total}/100</strong></p>
                <p>Tespit ettiğimiz <strong>${results.bottleneck}</strong> sızıntısı ile ilgili stratejik teşhis raporunuz aşağıdadır:</p>
                
                <div style="background:#fff7ed; padding:30px; border-radius:20px; border:1px solid #ffedd5; margin:30px 0;">
                    ${cleanReport}
                </div>

                <div style="text-align:center; background:#f97316; padding:35px; border-radius:25px; color:white;">
                    <h3 style="margin-top:0; font-size: 22px;">BU DELİĞİ BERABER KAPATALIM 📈</h3>
                    <p>Bu sızıntıyı 30 dakikada nasıl kazanca dönüştüreceğimizi planlamak için ücretsiz seans randevunuzu oluşturun.</p>
                    <a href="https://wa.me/905379484868" style="background:white; color:#f97316; padding:15px 35px; text-decoration:none; border-radius:12px; font-weight:bold; display:inline-block; margin-top:20px;">ÜCRETSİZ RANDEVU AL</a>
                </div>

                <p style="text-align:center; font-size:12px; color:#aaa; margin-top:40px;">
                    © 2026 METRIQ360 | <a href="https://www.metriq360.tr" style="color:#f97316; text-decoration:none;">www.metriq360.tr</a>
                </p>
            </div>
        `,
    };

    await transporter.sendMail(mailToUser);

    return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
