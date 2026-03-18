import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { 
  Rocket, Globe, Loader2, Target, Zap, Users, ShieldAlert, TrendingUp, Phone, AlertCircle, Mail, MessageSquare
} from 'lucide-react';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// 20 Kritik Stratejik Soru (4 Motor x 5 Soru)
const allQuestions = [
  { id: 't1', section: 1, text: 'Kanal Çeşitliliği: Google, Meta, SEO ve fiziksel kanalların en az 3\'ü aktif mi?' },
  { id: 't2', section: 1, text: 'Maliyet Bilinci: Aday başı maliyetinizi (CPA) kuruşu kuruşuna biliyor musunuz?' },
  { id: 't3', section: 1, text: 'Niyet Kalitesi: Gelenlerin ne kadarı "fiyat soran" değil, gerçekten "almaya niyetli"?' },
  { id: 't4', section: 1, text: 'Reklam Takibi: Hangi görselin veya kelimenin satış getirdiğini ölçebiliyor musunuz?' },
  { id: 't5', section: 1, text: 'Yerel Güç: Google Haritalar\'da rakiplerinizden daha çok yorum ve puana sahip misiniz?' },
  { id: 'l1', section: 2, text: 'Yanıt Hızı: WhatsApp mesajlarına ortalama 10 dakikanın altında mı dönüyorsunuz?' },
  { id: 'l2', section: 2, text: 'Karşılama Oranı: Gelen aramaların ve mesajların %90\'ından fazlası yanıtlanıyor mu?' },
  { id: 'l3', section: 2, text: 'Otomasyon: Form dolduranlara anında otomatik bir bilgilendirme gidiyor mu?' },
  { id: 'l4', section: 2, text: 'Aday Nitelendirme: Mesajları "Sıcak, Ilık, Soğuk" diye kategorize ediyor musunuz?' },
  { id: 'l5', section: 2, text: 'Kayıp Takibi: Cevapsız kalanları veya "sonra arayacağım" diyenleri haftalık raporluyor musunuz?' },
  { id: 's1', section: 3, text: 'Takip Disiplini: Satış ekibiniz teklif verdiği kişiyi en az 3-4 kez farklı zamanlarda arıyor mu?' },
  { id: 's2', section: 3, text: 'Kapanış Oranı: Gelen adayların (Lead) en az %20\'si faturaya/satışa dönüşüyor mu?' },
  { id: 's3', section: 3, text: 'Hız (Cycle Time): İlk temas ile satış arasındaki süre sektör ortalamasının altında mı?' },
  { id: 's4', section: 3, text: 'İtiraz Yönetimi: "Fiyat pahalı" diyeni ikna edecek hazır bir teklif/paket senaryonuz var mı?' },
  { id: 's5', section: 3, text: 'CRM Kullanımı: Satışları Excel/kağıt yerine bir yazılım üzerinden mi takip ediyorsunuz?' },
  { id: 'd1', section: 4, text: 'Tekrar Oranı: Mevcut müşterilerinizin en az %20\'si sizden ikinci kez alışveriş yapıyor mu?' },
  { id: 'd2', section: 4, text: 'Sepet Büyütme (Upsell): Satış anında müşteriye ek/üst paketler sunuluyor mu?' },
  { id: 'd3', section: 4, text: 'Müşteri Ömrü (LTV): Bir müşterinin size 1 yılda bıraktığı toplam kârı biliyor musunuz?' },
  { id: 'd4', section: 4, text: 'Hatırlatma (Recall): Hizmeti biten müşteriyi 6 ay sonra "kontrol" için arıyor musunuz?' },
  { id: 'd5', section: 4, text: 'Tavsiye Sistemi: Mevcut müşterilerinizin size düzenli olarak yeni referanslar getiriyor mu?' }
];

const engineTitles = { 1: 'Trafik Motoru', 2: 'Lead Motoru', 3: 'Satış Motoru', 4: 'Değer Motoru' };

export default function App() {
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState({ name: '', surname: '', sector: '', email: '', whatsapp: '' });
  const [currentStep, setCurrentStep] = useState('form');
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  
  // Yükleme ve Popup state'leri
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initFirebase = async () => {
      if (!firebaseConfigStr) { setInitLoading(false); return; }
      try {
        const config = JSON.parse(firebaseConfigStr);
        const app = initializeApp(config);
        const auth = getAuth(app);
        const dbInstance = getFirestore(app);
        setDb(dbInstance);
        if (initialAuthToken) await signInWithCustomToken(auth, initialAuthToken);
        else await signInAnonymously(auth);
        onAuthStateChanged(auth, (fbUser) => { if (fbUser) setUserId(fbUser.uid); setInitLoading(false); });
      } catch (e) { setInitLoading(false); }
    };
    initFirebase();
  }, []);

  const handleAnswerChange = (qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }));

  const calculateResults = () => {
    const engineScores = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let totalScore = 0;
    allQuestions.forEach(q => {
      const score = answers[q.id] || 0;
      engineScores[q.section] += score;
      totalScore += score;
    });
    let minScore = 26;
    let bId = 1;
    Object.entries(engineScores).forEach(([id, score]) => {
      if (score < minScore) { minScore = score; bId = id; }
    });
    return { total: totalScore, engineScores, bottleneck: engineTitles[bId] };
  };

  const goToFinalStep = () => {
    const allAnswered = allQuestions.every(q => answers[q.id]);
    if (!allAnswered) { setError('Lütfen tüm soruları yanıtlayınız.'); return; }
    setError('');
    setResults(calculateResults());
    setCurrentStep('whatsapp');
  };

  const handleFinalSubmit = async (e, skipWhatsApp = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!skipWhatsApp && !user.whatsapp) { 
      setError('Lütfen WhatsApp numaranızı girin veya numara vermeden devam edin.'); 
      return; 
    }
    
    setError('');
    setLoading(true);
    setShowPopup(true); // Popup'ı açıyoruz

    try {
      const quizDetails = allQuestions.map(q => ({
        question: q.text,
        answer: answers[q.id],
        section: engineTitles[q.section]
      }));

      // Adım 1: Gönderim Başlıyor
      setStatusMessage('Veriler büyüme motorumuza gönderiliyor...');
      
      const reportRes = await fetch('/.netlify/functions/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInfo: user, ...results })
      });
      
      // Adım 2: Yapay Zeka Devrede
      setStatusMessage('Yapay Zeka stratejik raporunuzu hazırlıyor...');
      const data = await reportRes.json();

      // Adım 3: E-posta Gönderimi
      setStatusMessage('Raporunuz e-postanıza yönlendiriliyor...');
      await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userInfo: user, 
            report: data.detailedReport, 
            results: results,
            quizDetails: quizDetails 
        })
      });

      // Adım 4: Veritabanı Kaydı
      setStatusMessage('İşleminiz tamamlanıyor...');
      if (db && userId) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), {
          ...user, results, answers, skipWhatsApp, timestamp: new Date().toISOString()
        });
      }

      // Adım 5: Yönlendirme Aşaması
      setStatusMessage('Şimdi yönlendiriliyorsunuz 🚀');
      
      setTimeout(() => {
        window.location.href = "https://www.metriq360.tr/buyume-testi-tesekkur";
      }, 1500); // Kullanıcı son mesajı okusun diye biraz daha uzun bekletiyoruz

    } catch (err) {
      setStatusMessage('Şimdi yönlendiriliyorsunuz 🚀');
      setTimeout(() => {
        window.location.href = "https://www.metriq360.tr/buyume-testi-tesekkur";
      }, 1000);
    }
  };

  if (initLoading) return <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center text-[#ea580c] font-black animate-pulse">METRIQ360 YÜKLENİYOR...</div>;

  return (
    <div className="min-h-screen bg-[#fffaf5] flex flex-col items-center justify-center py-10 px-4 font-sans text-slate-900 relative">
      
      {/* YÜKLEME POPUP'I (MODAL) */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            
            {/* Animasyonlu İkon Alanı */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-60"></div>
              <div className="relative bg-orange-50 text-[#ea580c] p-5 rounded-full border border-orange-100 shadow-sm">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 uppercase italic mb-3">Lütfen Bekleyin!</h3>
            
            <div className="bg-red-50 border border-red-200 text-red-600 font-bold text-xs p-3 rounded-xl mb-6 shadow-sm flex items-start gap-2 text-left">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>Sayfadan ayrılmayın veya kapatmayın, verileriniz kaybolabilir!</span>
            </div>
            
            {/* İlerleme Çubuğu */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 overflow-hidden">
              <div className="bg-[#ea580c] h-1.5 rounded-full w-full animate-pulse"></div>
            </div>
            
            {/* Dinamik Durum Mesajı */}
            <p className="text-[13px] font-black text-slate-700 uppercase tracking-wide animate-pulse h-10 flex items-center justify-center">
              {statusMessage}
            </p>
          </div>
        </div>
      )}

      {/* ANA İÇERİK */}
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border-t-[10px] border-[#ea580c] overflow-hidden relative">
        
        {/* LOGO ALANI */}
        <div className="p-10 text-center bg-white relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-[#1e293b] tracking-tighter uppercase mb-1">
            METR<span className="text-[#ea580c]">IQ</span>360
          </h1>
          <p className="text-[#64748b] font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">
            IQ360™ Stratejik Büyüme Testi
          </p>
        </div>

        {error && (
          <div className="mx-8 md:mx-10 mb-4 bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-bold border-l-4 border-red-500 flex items-center gap-3 relative z-10">
            <ShieldAlert size={18} className="shrink-0" /> {error}
          </div>
        )}

        {/* ADIM 1: GİRİŞ FORMU */}
        {currentStep === 'form' && (
          <div className="p-8 md:p-10 pt-2 space-y-6 animate-in fade-in duration-500 relative z-10">
            <form onSubmit={(e) => { e.preventDefault(); setCurrentStep('quiz'); }} className="space-y-4">
              <input type="text" placeholder="Adınız" value={user.name} onChange={(e)=>setUser({...user, name: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-200 outline-none font-semibold focus:border-[#ea580c] shadow-sm transition" required />
              <input type="text" placeholder="Soyadınız" value={user.surname} onChange={(e)=>setUser({...user, surname: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-200 outline-none font-semibold focus:border-[#ea580c] shadow-sm transition" required />
              <input type="text" placeholder="Sektörünüz" value={user.sector} onChange={(e)=>setUser({...user, sector: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-200 outline-none font-semibold focus:border-[#ea580c] shadow-sm transition" required />
              <input type="email" placeholder="E-posta Adresiniz" value={user.email} onChange={(e)=>setUser({...user, email: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-200 outline-none font-semibold focus:border-[#ea580c] shadow-sm transition" required />
              <button type="submit" className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white font-black py-5 rounded-2xl shadow-lg uppercase tracking-widest text-lg transition transform hover:-translate-y-1 mt-2">TESTE BAŞLA</button>
            </form>
          </div>
        )}

        {/* ADIM 2: STRATEJİK ANALİZ (KOMPAKT SORULAR) */}
        {currentStep === 'quiz' && (
          <div className="p-6 md:p-8 pt-2 space-y-6 animate-in fade-in duration-500 relative z-10">
            {[1, 2, 3, 4].map(sid => (
              <div key={sid} className="space-y-4 border-b border-slate-50 last:border-0 pb-6">
                <h3 className="text-lg font-black uppercase italic text-slate-800 flex items-center gap-2">
                   {sid === 1 && <Globe size={20} className="text-[#ea580c]"/>}
                   {sid === 2 && <Zap size={20} className="text-[#ea580c]"/>}
                   {sid === 3 && <Target size={20} className="text-[#ea580c]"/>}
                   {sid === 4 && <Users size={20} className="text-[#ea580c]"/>}
                   {engineTitles[sid]}
                </h3>
                {allQuestions.filter(q => q.section === sid).map((q, idx) => (
                  <div key={q.id} className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
                    <p className="font-bold text-slate-700 mb-3 text-sm leading-tight">{idx + 1}. {q.text}</p>
                    <div className="flex justify-between gap-1">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button key={v} onClick={() => handleAnswerChange(q.id, v)} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${answers[q.id] === v ? 'bg-[#ea580c] text-white scale-105 shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-100'}`}>{v}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <button onClick={goToFinalStep} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-3xl shadow-2xl transition transform hover:-translate-y-1 uppercase tracking-widest flex items-center justify-center gap-4">
              <Rocket size={28} /> Testi Tamamla
            </button>
          </div>
        )}

        {/* ADIM 3: GÜNCELLENMİŞ WHATSAPP / ONAY AŞAMASI */}
        {currentStep === 'whatsapp' && (
          <div className="p-6 md:p-8 pt-2 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-center relative z-10">
            
            <div className="bg-[#d32f2f] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl text-center text-white relative">
              <div className="flex flex-col items-center gap-2">
                <h2 className="text-xl md:text-3xl font-black uppercase leading-tight tracking-tighter">🚨 ANA DARBOĞAZ TESPİT EDİLDİ!</h2>
                <div className="text-lg md:text-xl font-bold opacity-90 italic">En Zayıf Halkanız: {results?.bottleneck}</div>
                <div className="mt-4 bg-black/10 border border-white/20 p-4 rounded-2xl text-[11px] md:text-xs font-bold flex items-center gap-3 text-left">
                  <AlertCircle size={20} className="shrink-0" />
                  Durum: İşletmenizin büyümesini yavaşlatan kritik bir tıkanıklık tespit edildi! Diğer çabalarınız bu tıkanıklık yüzünden boşa gidiyor olabilir.
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-6 text-left">
              <h3 className="text-lg font-black text-[#1e293b] italic flex items-center gap-2">
                Raporunuzu Nasıl Alacaksınız? <span className="text-xl">👇</span>
              </h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                    <Mail size={18} />
                  </div>
                  <div className="pt-1">
                    <p className="text-slate-700 text-[13px] font-medium leading-relaxed">
                      <strong className="text-slate-900 font-bold">1. E-posta Gönderiliyor:</strong> Hazırlanan dijital röntgen raporunuz an itibariyle <strong className="text-slate-900">fikretkara55@gmail.com</strong> adresine iletilmektedir.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                    <Phone size={18} />
                  </div>
                  <div className="pt-1">
                    <p className="text-[#c2410c] text-[13px] font-medium leading-relaxed">
                      <strong className="font-bold">2. WhatsApp İletişim Garantisi:</strong> Mail servislerindeki gecikme riskine karşı, raporunuzun bir kopyası <strong className="font-bold">WhatsApp</strong> üzerinden yedek kanal olarak ulaştırılacaktır.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#059669] text-white p-5 rounded-2xl shadow-md flex items-center gap-4 text-left">
              <div className="bg-white/20 p-2 rounded-full shrink-0">
                <ShieldAlert size={24} className="text-white" />
              </div>
              <div>
                <h4 className="font-black italic text-[13px] tracking-wide">%100 GÜVENLİK GARANTİSİ</h4>
                <p className="text-[11px] font-medium mt-1 opacity-90">Numaranız asla reklam için kullanılmaz. Sadece rapor iletimi için kaydedilir.</p>
              </div>
            </div>

            <div className="space-y-4 text-left pt-2">
              <label className="text-[11px] font-black italic uppercase text-slate-700 pl-2">
                WHATSAPP NUMARANIZI BURAYA YAZIN:
              </label>
              
              <form onSubmit={(e) => handleFinalSubmit(e, false)} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500">
                      <MessageSquare size={22} />
                    </div>
                    <input 
                      type="tel" 
                      placeholder="05xx xxx xx xx" 
                      value={user.whatsapp} 
                      onChange={(e)=>setUser({...user, whatsapp: e.target.value})} 
                      className="w-full p-5 pl-14 rounded-2xl bg-white border-2 border-slate-200 outline-none font-black text-slate-700 text-lg shadow-sm focus:border-[#ea580c] transition" 
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic text-center">* Numaranız sadece raporu güvenli bir şekilde ulaştırmak için kullanılacaktır.</p>
                </div>
                
                <button 
                  disabled={loading} 
                  type="submit" 
                  className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white font-black py-5 rounded-3xl shadow-xl transition active:scale-95 flex items-center justify-center gap-3 uppercase tracking-wide text-[14px] md:text-[15px] disabled:opacity-80"
                >
                  ANALİZİ TAMAMLA VE RAPORU AL
                </button>
                
                <button 
                  type="button" 
                  onClick={(e) => handleFinalSubmit(e, true)}
                  disabled={loading}
                  className="w-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] font-black py-4 rounded-3xl transition active:scale-95 flex items-center justify-center uppercase tracking-wide text-[13px] md:text-sm disabled:opacity-80"
                >
                  NUMARA VERMEDEN DEVAM ET
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
