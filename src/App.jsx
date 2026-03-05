import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import { 
  ChevronRight, 
  CheckCircle, 
  Rocket, 
  MessageSquare, 
  Phone, 
  Mail, 
  Globe, 
  AlertCircle, 
  Loader2, 
  Target,
  Zap,
  Users,
  ShieldAlert,
  BarChart3,
  Info
} from 'lucide-react';

// --- CONFIGURATION ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const apiKey = ""; // Environment handles this

// --- IQ360 GROWTH ENGINE QUESTION BANK (20 Questions) ---
const allQuestions = [
  // Bölüm 1: Trafik Motoru
  { id: 't1', section: 1, text: 'Kanal Çeşitliliği: Google, Meta, SEO ve fiziksel kanalların en az 3\'ü aktif mi?' },
  { id: 't2', section: 1, text: 'Maliyet Bilinci: Aday başı maliyetinizi (CPA) kuruşu kuruşuna biliyor musunuz?' },
  { id: 't3', section: 1, text: 'Niyet Kalitesi: Gelenlerin ne kadarı "fiyat soran" değil, gerçekten "almaya niyetli"?' },
  { id: 't4', section: 1, text: 'Reklam Takibi: Hangi görselin veya kelimenin satış getirdiğini ölçebiliyor musunuz?' },
  { id: 't5', section: 1, text: 'Yerel Güç: Google Haritalar\'da rakiplerinizden daha çok yorum ve puana sahip misiniz?' },
  
  // Bölüm 2: Lead Motoru
  { id: 'l1', section: 2, text: 'Yanıt Hızı: WhatsApp mesajlarına ortalama 10 dakikanın altında mı dönüyorsunuz?' },
  { id: 'l2', section: 2, text: 'Karşılama Oranı: Gelen aramaların ve mesajların %90\'ından fazlası yanıtlanıyor mu?' },
  { id: 'l3', section: 2, text: 'Otomasyon: Form dolduranlara anında otomatik bir bilgilendirme gidiyor mu?' },
  { id: 'l4', section: 2, text: 'Aday Nitelendirme: Mesajları "Sıcak, Ilık, Soğuk" diye kategorize ediyor musunuz?' },
  { id: 'l5', section: 2, text: 'Kayıp Takibi: Cevapsız kalanları veya "sonra arayacağım" diyenleri haftalık raporluyor musunuz?' },

  // Bölüm 3: Satış Motoru
  { id: 's1', section: 3, text: 'Takip Disiplini: Satış ekibiniz teklif verdiği kişiyi en az 3-4 kez farklı zamanlarda arıyor mu?' },
  { id: 's2', section: 3, text: 'Kapanış Oranı: Gelen adayların (Lead) en az %20\'si faturaya/satışa dönüşüyor mu?' },
  { id: 's3', section: 3, text: 'Hız (Cycle Time): İlk temas ile satış arasındaki süre sektör ortalamasının altında mı?' },
  { id: 's4', section: 3, text: 'İtiraz Yönetimi: "Fiyat pahalı" diyeni ikna edecek hazır bir teklif/paket senaryonuz var mı?' },
  { id: 's5', section: 3, text: 'CRM Kullanımı: Satışları Excel/kağıt yerine bir yazılım üzerinden mi takip ediyorsunuz?' },

  // Bölüm 4: Değer Motoru
  { id: 'd1', section: 4, text: 'Tekrar Oranı: Mevcut müşterilerinizin en az %20\'si sizden ikinci kez alışveriş yapıyor mu?' },
  { id: 'd2', section: 4, text: 'Sepet Büyütme (Upsell): Satış anında müşteriye ek/üst paketler sunuluyor mu?' },
  { id: 'd3', section: 4, text: 'Müşteri Ömrü (LTV): Bir müşterinin size 1 yılda bıraktığı toplam kârı biliyor musunuz?' },
  { id: 'd4', section: 4, text: 'Hatırlatma (Recall): Hizmeti biten müşteriyi 6 ay sonra "kontrol" için arıyor musunuz?' },
  { id: 'd5', section: 4, text: 'Tavsiye Sistemi: Mevcut müşterileriniz size düzenli olarak yeni referanslar getiriyor mu?' }
];

const engineTitles = {
  1: 'Trafik Motoru',
  2: 'Lead Motoru',
  3: 'Satış Motoru',
  4: 'Değer Motoru'
};

export default function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState({ name: '', surname: '', sector: '', email: '' });
  const [currentStep, setCurrentStep] = useState('form');
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [reportData, setReportData] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initFirebase = async () => {
      if (!firebaseConfigStr) { setInitLoading(false); return; }
      try {
        const config = JSON.parse(firebaseConfigStr);
        const app = initializeApp(config);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        setAuth(authInstance); setDb(dbInstance);

        const initAuth = async () => {
          if (initialAuthToken) await signInWithCustomToken(authInstance, initialAuthToken);
          else await signInAnonymously(authInstance);
        };
        await initAuth();

        onAuthStateChanged(authInstance, (fbUser) => {
          if (fbUser) setUserId(fbUser.uid);
          setInitLoading(false);
        });
      } catch (e) {
        console.error("Firebase fail:", e);
        setInitLoading(false);
      }
    };
    initFirebase();
  }, []);

  const handleUserFormSubmit = (e) => {
    e.preventDefault();
    if (!user.name || !user.surname || !user.sector || !user.email) {
      setError('Lütfen tüm alanları eksiksiz doldurunuz; büyüme testiniz size özel hazırlanacaktır.');
      return;
    }
    setError('');
    setCurrentStep('quiz');
  };

  const handleAnswerChange = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const calculateResults = () => {
    const engineScores = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let totalScore = 0;

    allQuestions.forEach(q => {
      const score = answers[q.id] || 0;
      engineScores[q.section] += score;
      totalScore += score;
    });

    let minScore = 26;
    let bottleneckId = 1;

    Object.keys(engineScores).forEach(id => {
      if (engineScores[id] < minScore) {
        minScore = engineScores[id];
        bottleneckId = id;
      }
    });

    return {
      total: totalScore, 
      engineScores,
      bottleneck: engineTitles[bottleneckId],
      status: totalScore <= 40 ? 'Kritik Sızıntı' : totalScore <= 70 ? 'Stabilizasyon Gerekli' : 'Ölçeklenebilir'
    };
  };

  const fetchAIReport = async (data) => {
    const systemPrompt = `Sen METRIQ360 markasının Büyüme Mühendisi asistanısın. 
    İşletmelerin ciro akışındaki kopuklukları bulan "IQ360 Büyüme Röntgeni" sistemisin.
    Tonun: Raporun içinde profesyonel ama "Kanka" diyen, tokat gibi gerçekleri çarpan samimi bir dil kullan.`;

    const userPrompt = `
      Müşteri: ${user.name} ${user.surname}
      Sektör: ${user.sector}
      Genel Skor: ${data.total}/100
      Ana Darboğaz: ${data.bottleneck}
      Motor Skorları (25 üzerinden):
      - Trafik: ${data.engineScores[1]}
      - Lead: ${data.engineScores[2]}
      - Satış: ${data.engineScores[3]}
      - Değer: ${data.engineScores[4]}

      RAPOR KURGUSU:
      1. ŞOK ETKİSİ: "Kanka, senin sorunun reklamda değil ${data.bottleneck}'nda..." diye başla. Sert bir analiz yap.
      2. PARA KAÇAĞI: Düşük puanlara bakarak, bu sızıntı yüzünden aylık tahmini ne kadar ciro kaybettiğini BÜYÜK ve ÇARPICI yaz.
      3. STRATEJİK ÖNGÖRÜ: Bu darboğaz çözülürse bütçe artırmadan cironun yüzde kaç (%) artabileceğini söyle.
      4. KAPANIŞ: "Bu rakamlar sadece bir ön izleme kanka..." diyerek 30 dakikalık ücretsiz randevuya yönlendir.
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (err) {
      throw err;
    }
  };

  const handleSubmitQuiz = async () => {
    const allAnswered = allQuestions.every(q => answers[q.id]);
    if (!allAnswered) {
      setError('Lütfen tüm soruları yanıtlayınız; büyüme testinin doğruluğu için bu kritiktir.');
      return;
    }

    setError('');
    const scoreData = calculateResults();
    setResults(scoreData);
    setCurrentStep('results');
    setReportLoading(true);

    try {
      const report = await fetchAIReport(scoreData);
      setReportData(report);

      if (db && userId) {
        await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'growth_tests'), {
          timestamp: new Date(),
          userInfo: user,
          scores: scoreData,
          report: report
        });
      }
    } catch (err) {
      setError("Stratejik rapor oluşturulurken teknik bir aksaklık yaşandı, ancak skorunuz hazır.");
    } finally {
      setReportLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="text-orange-500 font-black tracking-widest animate-pulse uppercase">METRIQ360 IQ360 TESTİ YÜKLENİYOR...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 font-sans text-slate-900">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border-t-[12px] border-orange-500 overflow-hidden transition-all duration-500">
        
        {/* Header - Minimalist (No extra line under IQ) */}
        <div className="p-8 text-center bg-white">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase mb-1">
            METR<span className="text-orange-500 italic">IQ</span>360
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs mt-2">IQ360™ Stratejik Büyüme Testi</p>
        </div>

        {error && (
          <div className="mx-8 mt-2 mb-4 bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-bold border-l-4 border-red-500 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* STEP 1: FORM */}
        {currentStep === 'form' && (
          <div className="p-8 pt-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5">
                <BarChart3 className="w-24 h-24" />
              </div>
              <h2 className="text-xl font-black text-orange-900 mb-2 uppercase italic">İşletmenizin Dijital Büyümesini Tespit Edin</h2>
              <p className="text-sm text-orange-800 font-medium leading-relaxed">
                Büyüme motorunuzdaki tıkanıklıkları ve ciro sızıntılarını nokta atışı verilerle görmek için hazırlanan "IQ360 Büyüme Röntgeni" başlıyor. Test sonuçlarınıza ulaşmak için bilgilerinizi giriniz.
              </p>
            </div>
            <form onSubmit={handleUserFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Adınız" value={user.name} onChange={(e)=>setUser({...user, name: e.target.value})} className="p-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition font-bold" required />
                <input type="text" placeholder="Soyadınız" value={user.surname} onChange={(e)=>setUser({...user, surname: e.target.value})} className="p-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition font-bold" required />
              </div>
              <input type="text" placeholder="Sektörünüz (Örn: Sağlık, İnşaat, Mobilya)" value={user.sector} onChange={(e)=>setUser({...user, sector: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition font-bold" required />
              <input type="email" placeholder="E-posta Adresiniz" value={user.email} onChange={(e)=>setUser({...user, email: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition font-bold" required />
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-xl transition transform hover:-translate-y-1 uppercase tracking-widest flex items-center justify-center gap-3 group">
                Teste Başla <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: QUIZ */}
        {currentStep === 'quiz' && (
          <div className="p-8 pt-4 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* UX Legend - Scale Explanation */}
            <div className="bg-slate-900 p-5 rounded-[2rem] text-white flex items-start gap-4 shadow-lg border-b-4 border-orange-500">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-orange-400 mb-1">Puanlama Rehberi</p>
                <p className="text-[11px] leading-relaxed font-medium opacity-90">
                  Soruları <span className="font-bold text-white">1 (Kesinlikle Hayır / Çok Kötü)</span> ile <span className="font-bold text-white">5 (Kesinlikle Evet / Mükemmel)</span> arasında puanlayınız.
                </p>
              </div>
            </div>

            {[1, 2, 3, 4].map(sectionId => (
              <div key={sectionId} className="space-y-6">
                <div className="flex items-center gap-3 border-b-4 border-slate-100 pb-2">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                    {sectionId === 1 && <Globe className="w-6 h-6" />}
                    {sectionId === 2 && <Zap className="w-6 h-6" />}
                    {sectionId === 3 && <Target className="w-6 h-6" />}
                    {sectionId === 4 && <Users className="w-6 h-6" />}
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-800">{engineTitles[sectionId]}</h3>
                </div>
                {allQuestions.filter(q => q.section === sectionId).map((q, idx) => (
                  <div key={q.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group hover:border-orange-200 transition-colors">
                    <p className="font-bold text-slate-700 mb-5 leading-tight">{idx + 1}. {q.text}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map(v => (
                          <button
                            key={v}
                            onClick={() => handleAnswerChange(q.id, v)}
                            className={`flex-1 py-4 rounded-2xl font-black transition-all duration-200 ${answers[q.id] === v ? 'bg-orange-500 text-white shadow-lg ring-4 ring-orange-100 scale-110' : 'bg-white text-slate-400 border border-slate-200 hover:border-orange-300'}`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between px-2 text-[9px] font-black uppercase tracking-tighter text-slate-400">
                        <span>Kesinlikle Hayır</span>
                        <span>Kesinlikle Evet</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <button onClick={handleSubmitQuiz} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-[2rem] shadow-2xl transition transform hover:-translate-y-1 uppercase tracking-[0.2em] flex items-center justify-center gap-4">
              <Rocket className="w-7 h-7" /> Testi Tamamla ve Sonuçları Gör
            </button>
          </div>
        )}

        {/* STEP 3: RESULTS */}
        {currentStep === 'results' && (
          <div className="p-8 space-y-8 animate-in fade-in duration-700">
            <div className={`p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden ${results?.total <= 40 ? 'bg-red-600' : results?.total <= 70 ? 'bg-orange-500' : 'bg-emerald-600'}`}>
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <ShieldAlert className="w-40 h-40 rotate-12" />
              </div>
              <h2 className="text-xs opacity-70 uppercase tracking-[0.4em] font-black mb-4">Büyüme Sağlık Skoru</h2>
              <div className="text-8xl font-black tabular-nums leading-none">
                {results?.total}<span className="text-2xl opacity-40">/100</span>
              </div>
              <div className="mt-6 flex items-center gap-2 font-black uppercase tracking-widest text-sm bg-white/20 inline-flex px-4 py-2 rounded-full">
                <AlertCircle className="w-5 h-5" /> {results?.status}
              </div>
              <div className="mt-8 bg-black/20 p-6 rounded-3xl border border-white/10">
                <p className="text-xs uppercase font-black opacity-60 mb-2">Tespit Edilen Ana Darboğaz</p>
                <p className="text-2xl font-black italic uppercase tracking-tighter">{results?.bottleneck}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-xl min-h-[400px] relative">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                <MessageSquare className="w-8 h-8 text-orange-500" />
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Stratejik Teşhis Raporu</h3>
              </div>

              {reportLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-60">
                  <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                  <p className="text-sm font-black animate-pulse text-orange-600 uppercase italic">Veriler Analiz Ediliyor...</p>
                </div>
              ) : (
                <div className="prose prose-orange max-w-none text-slate-700 font-medium leading-relaxed animate-in fade-in duration-1000">
                  <ReactMarkdown 
                    components={{
                      strong: ({node, ...props}) => <span className="font-black text-slate-900 bg-orange-50 px-1 border-b-2 border-orange-200" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-3xl font-black text-red-600 uppercase italic tracking-tighter mt-10 mb-4" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mt-8 mb-2" {...props} />
                    }}
                  >
                    {reportData || 'Rapor hazırlanıyor, lütfen bekleyiniz.'}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-center space-y-6 border-b-[10px] border-orange-500">
              <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter">BÜYÜME RÖNTGENİ SEANSI 📈</h4>
              <p className="text-slate-400 font-medium leading-relaxed text-sm">
                Bu analiz, buzdağının sadece görünen kısmıdır. Ayda kaybettiğiniz potansiyel ciroyu nasıl geri kazanacağınızı matematiksel simülasyonlarla birlikte planlayalım.
              </p>
              <a 
                href={`https://wa.me/905379484868?text=Merhaba, IQ360 Büyüme Testimi tamamladım (Skorum: ${results?.total}/100). Ana darboğazım: ${results?.bottleneck}. Ücretsiz 30 dakikalık Büyüme Röntgeni seansı için randevu almak istiyorum.`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-6 rounded-[2rem] shadow-xl transition transform hover:scale-105 uppercase tracking-widest text-lg flex items-center justify-center gap-3"
              >
                <Phone className="w-6 h-6" /> Ücretsiz Strateji Randevusu Al
              </a>
              <div className="flex justify-center gap-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> bilgi@metriq360.tr</span>
                <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> metriq360.tr</span>
              </div>
            </div>

            <button onClick={() => window.location.reload()} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 underline text-xs decoration-orange-300">
              Yeni Bir Test Başlat
            </button>
          </div>
        )}
      </div>

      <footer className="mt-10 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">
        © 2026 METRIQ360 | GROWTH ENGINEERING
      </footer>
    </div>
  );
}
