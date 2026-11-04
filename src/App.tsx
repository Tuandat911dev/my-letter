import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./App.css";

// ==========================================
// NỘI DUNG THƯ
// ==========================================
type Para = { text: string };

const GREETING = "Chào buổi sáng người con gái anh thương";
const NAME = "Quỳnh xinh nhà anh";

const PARAGRAPHS: Para[] = [
  {
    text: "Hôm nay dậy chân có đau lắm không em? Nếu mà đau quá thì ới anh một tiếng nha.",
  },
  {
    text: "Đêm qua ngồi nghe em chia sẻ những dòng suy nghĩ trong lòng, anh đã suy nghĩ rất lâu. Anh thương em nhiều lắm và cũng tự trách bản thân mình vì đã vô tâm để những khoảng lặng của bản thân vô tình tạo cho em cảm giác bất an.",
  },
  {
    text: "Anh biết dạo này em yêu của anh phải chịu những áp lực từ việc học, từ việc kiếm việc làm, nghĩ về tương lai khiến em phải suy nghĩ nhiều. Thấy em như vậy anh rất muốn ở bên, rất muốn được ôm lấy em để làm chỗ dựa tinh thần cho em. Nhưng nhìn lại, đúng thật đôi lúc anh tự nhiên thu mình lại, không phải vì bớt thương em mà là vì sợ mệt mỏi thoáng qua khiến anh chậm lại một bước. Anh cảm thấy buồn khi mà chính sự im lặng không lời giải thích ấy lại vô tình làm em tổn thương, anh xin lỗi em nhiều.",
  },
  {
    text: "Một điều nữa, khi nghe em nói về chuyện mai sau anh không còn yêu em nữa, anh thấy hơi nhói ở ngực một chút. Anh muốn ôm em thật chặt và nói cho em điều này: vị trí của em chưa từng và sẽ không bao giờ bị thay đổi trong trái tim của anh. Người mà anh muốn nói chuyện, muốn nhắn tin mỗi ngày sẽ luôn là em mà không phải một ai khác.",
  },
  {
    text: "Sáng nay thức dậy, anh nhớ là mình đã vô tình ngủ quên mà không kịp chúc em ngủ ngon, anh xin lỗi em nhé. Chắc đêm qua em đã trằn trọc và nghĩ ngợi nhiều lắm đúng không?",
  },
  {
    text: "Từ hôm nay, anh sẽ chú ý hơn để em không bao giờ phải cảm thấy cô đơn hay bất an nữa nha em yêu. Hãy để anh là chốn bình yên để em tựa vào mỗi khi mệt mỏi nhé.",
  },
];

const PS_NOTE = "À, lát nữa em dậy thì lên quán bánh mỳ BBQ lấy đồ ăn sáng nhé";

// ==========================================
// TIỆN ÍCH
// ==========================================
type Screen = "invite" | "letter" | "sealed";

const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

const HeartIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d={HEART_PATH} />
  </svg>
);

const vars = (v: Record<string, string | number>) => v as CSSProperties;

// ==========================================
// PHONG BÌ
// ==========================================
function Envelope({ state }: { state: "closed" | "opening" | "sealed" }) {
  return (
    <div className={`env env--${state}`}>
      <div className="env-back" />
      <div className="env-paper">
        <span className="env-paper-title">Gửi Quỳnh</span>
        <span className="env-paper-line" />
        <span className="env-paper-line" />
        <span className="env-paper-line short" />
      </div>
      <div className="env-front">
        <span className="env-to">
          Gửi: <b>Quỳnh xinh</b>
        </span>
      </div>
      <div className="env-flap" />
      <div className="env-seal">
        <HeartIcon />
      </div>
    </div>
  );
}

// ==========================================
// APP
// ==========================================
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  alpha: number;
  life: number;
  decay: number;
  gravity: number;
  phase: number;
  color: string;
  kind: "heart" | "spark";
  ambient: boolean;
}

function App() {
  const [screen, setScreen] = useState<Screen>("invite");
  const [opening, setOpening] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [folding, setFolding] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const burstRef = useRef<(x: number, y: number, n: number, power?: number) => void>(() => {});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const sealedEnvRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const today = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date());

  // ---------- Nền: tim bay + lấp lánh ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const heart = new Path2D(
      "M0 -0.3 C -0.25 -0.65 -0.75 -0.45 -0.75 -0.05 C -0.75 0.3 -0.35 0.55 0 0.8 C 0.35 0.55 0.75 0.3 0.75 -0.05 C 0.75 -0.45 0.25 -0.65 0 -0.3 Z",
    );
    const heartColors = ["#f07a93", "#f59fb0", "#e8506e", "#ffb3a7", "#f6c1cc"];
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    const ambientHeart = (initial: boolean): Particle => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 30,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.5 + 0.25),
      size: Math.random() * 9 + 6,
      rot: (Math.random() - 0.5) * 0.6,
      vr: (Math.random() - 0.5) * 0.004,
      alpha: Math.random() * 0.3 + 0.15,
      life: 1,
      decay: 0,
      gravity: 0,
      phase: Math.random() * Math.PI * 2,
      color: pick(heartColors),
      kind: "heart",
      ambient: true,
    });

    const ambientSpark = (): Particle => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0,
      vy: -0.08,
      size: Math.random() * 1.8 + 0.8,
      rot: 0,
      vr: 0,
      alpha: Math.random() * 0.6 + 0.3,
      life: 1,
      decay: 0,
      gravity: 0,
      phase: Math.random() * Math.PI * 2,
      color: "#fff6e0",
      kind: "spark",
      ambient: true,
    });

    const heartCount = reduce ? 6 : Math.round(Math.min(26, w / 40));
    const sparkCount = reduce ? 10 : Math.round(Math.min(40, w / 30));
    let particles: Particle[] = [];
    for (let i = 0; i < heartCount; i++) particles.push(ambientHeart(true));
    for (let i = 0; i < sparkCount; i++) particles.push(ambientSpark());

    burstRef.current = (x, y, n, power = 1) => {
      const count = reduce ? Math.ceil(n / 3) : n;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (Math.random() * 4 + 1.5) * power;
        const isSpark = Math.random() < 0.3;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 1.6 * power,
          size: isSpark ? Math.random() * 2 + 1.2 : Math.random() * 9 + 6,
          rot: (Math.random() - 0.5) * 0.8,
          vr: (Math.random() - 0.5) * 0.08,
          alpha: 1,
          life: 1,
          decay: Math.random() * 0.01 + 0.008,
          gravity: 0.07,
          phase: Math.random() * Math.PI * 2,
          color: isSpark ? "#ffe7a8" : pick(heartColors),
          kind: isSpark ? "spark" : "heart",
          ambient: false,
        });
      }
      if (particles.length > 360) particles = particles.slice(particles.length - 360);
    };

    let raf = 0;
    let t = 0;
    const render = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        if (p.ambient) {
          p.x += p.vx + Math.sin(t * 0.01 + p.phase) * 0.25;
          p.y += p.vy;
          p.rot += p.vr;
          if (p.kind === "heart" && p.y < -30) Object.assign(p, ambientHeart(false));
          if (p.kind === "spark" && p.y < -5) p.y = h + 5;
        } else {
          p.vx *= 0.985;
          p.vy = p.vy * 0.985 + p.gravity;
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vr;
          p.life -= p.decay;
        }

        const a = p.ambient
          ? p.kind === "spark"
            ? p.alpha * (0.35 + 0.65 * Math.abs(Math.sin(t * 0.02 + p.phase)))
            : p.alpha
          : Math.max(0, p.life);
        if (a <= 0) continue;

        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(p.x, p.y);
        if (p.kind === "heart") {
          ctx.rotate(p.rot);
          ctx.scale(p.size, p.size);
          ctx.fillStyle = p.color;
          ctx.fill(heart);
        } else {
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 4);
          g.addColorStop(0, p.color);
          g.addColorStop(1, "rgba(255,240,210,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      particles = particles.filter((p) => p.ambient || p.life > 0);
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  // ---------- Nhạc ----------
  const fadeInMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        let v = 0;
        const id = window.setInterval(() => {
          v = Math.min(0.6, v + 0.04);
          audio.volume = v;
          if (v >= 0.6) clearInterval(id);
        }, 120);
      })
      .catch(() => setIsPlaying(false));
  };

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.volume = 0.6;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  // ---------- Màn 1: mở thư ----------
  const openLetter = () => {
    if (opening) return;
    setOpening(true);
    fadeInMusic();

    const r = tiltRef.current?.getBoundingClientRect();
    if (r) later(() => burstRef.current(r.left + r.width / 2, r.top + r.height * 0.58, 26, 0.9), 250);

    later(() => setLeaving(true), 1900);
    later(() => {
      window.scrollTo(0, 0);
      setScreen("letter");
      setLeaving(false);
      setOpening(false);
    }, 2600);
  };

  // ---------- Màn 2: hiện dần từng đoạn + thanh tiến độ ----------
  useEffect(() => {
    if (screen !== "letter") return;

    const io = new IntersectionObserver(
      (entries) => {
        let k = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          el.style.setProperty("--d", `${k * 0.18}s`);
          el.classList.add("in");
          io.unobserve(el);
          k += 1;
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    // đợi một nhịp để thẻ thư trượt lên trước
    const start = window.setTimeout(() => {
      document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    }, 450);

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 1;
      progressRef.current?.style.setProperty("--p", `${Math.min(1, Math.max(0, p))}`);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(start);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [screen]);

  const foldLetter = () => {
    if (folding) return;
    setFolding(true);
    later(() => {
      window.scrollTo(0, 0);
      setScreen("sealed");
      setFolding(false);
    }, 1000);
  };

  // ---------- Màn 3: niêm phong, bắn tim ----------
  useEffect(() => {
    if (screen !== "sealed") return;
    const id = window.setTimeout(() => {
      const r = sealedEnvRef.current?.getBoundingClientRect();
      if (r) burstRef.current(r.left + r.width / 2, r.top + r.height * 0.58, 60, 1.2);
    }, 1250);
    return () => clearTimeout(id);
  }, [screen]);

  const rereadLetter = () => {
    setLeaving(true);
    later(() => {
      window.scrollTo(0, 0);
      setScreen("letter");
      setLeaving(false);
    }, 500);
  };

  const tapHearts = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, .env-tilt")) return;
    burstRef.current(e.clientX, e.clientY, 8, 0.55);
  };

  return (
    <div className="app" onPointerDown={tapHearts}>
      <div className="backdrop" aria-hidden="true">
        <span className="blob blob-a" />
        <span className="blob blob-b" />
        <span className="blob blob-c" />
      </div>
      <canvas ref={canvasRef} className="fx-canvas" aria-hidden="true" />
      <audio ref={audioRef} src="/quynh.mp3" loop preload="auto" />

      {screen !== "invite" && (
        <button
          className={`music-btn ${isPlaying ? "is-playing" : ""}`}
          onClick={toggleMusic}
          aria-label={isPlaying ? "Tắt nhạc" : "Bật nhạc"}
          title={isPlaying ? "Tắt nhạc" : "Bật nhạc"}
        >
          <span className="eq">
            <i />
            <i />
            <i />
            <i />
          </span>
        </button>
      )}

      {/* ========== MÀN 1: NHỬ MỞ THƯ ========== */}
      {screen === "invite" && (
        <main className={`screen invite ${opening ? "is-opening" : ""} ${leaving ? "is-leaving" : ""}`}>
          <p className="eyebrow rise" style={vars({ "--d": "0.1s" })}>
            Một lá thư buổi sáng
          </p>
          <h1 className="invite-title rise" style={vars({ "--d": "0.25s" })}>
            Quỳnh ơi, có thư nè!
          </h1>

          <div className="env-float rise" style={vars({ "--d": "0.55s" })}>
            <div ref={tiltRef} className="env-tilt" role="button" aria-label="Mở thư" onClick={openLetter}>
              <span className="env-glow" />
              <Envelope state={opening ? "opening" : "closed"} />
            </div>
          </div>

          <button className="cta rise" style={vars({ "--d": "0.8s" })} onClick={openLetter}>
            <HeartIcon className="cta-heart" />
            Chạm để mở thư
          </button>
        </main>
      )}

      {/* ========== MÀN 2: LÁ THƯ ========== */}
      {screen === "letter" && (
        <main className={`screen letter-screen ${leaving ? "is-leaving" : ""}`}>
          <div ref={progressRef} className="progress" aria-hidden="true" />

          <article className={`paper ${folding ? "is-folding" : ""}`}>
            <div className="paper-corner tl" aria-hidden="true" />
            <div className="paper-corner br" aria-hidden="true" />

            <p className="paper-date reveal">Sáng {today}</p>

            <header className="paper-head reveal">
              <p className="greet">{GREETING}</p>
              <p className="greet-name">
                <span className="dash">—</span> {NAME} <HeartIcon className="inline-heart" />
              </p>
            </header>

            <div className="divider reveal" aria-hidden="true">
              <span />
              <HeartIcon />
              <span />
            </div>

            {PARAGRAPHS.map((p, i) => (
              <p key={i} className={`para reveal ${i === 0 ? "first" : ""}`}>
                {p.text}
              </p>
            ))}

            <aside className="ps reveal">
              <span className="ps-tag">P.S.</span>
              <p>{PS_NOTE}</p>
            </aside>

            <footer className="signoff reveal">
              <p className="sign-love">Yêu em nhiều lắm</p>
              <p className="sign-name">{NAME}</p>
            </footer>

            <div className="fold-wrap reveal">
              <button className="fold-btn" onClick={foldLetter}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3.5 6l8.5 6.5L20.5 6" />
                </svg>
                Gấp thư lại
              </button>
            </div>
          </article>
        </main>
      )}

      {/* ========== MÀN 3: ĐÓNG THƯ ========== */}
      {screen === "sealed" && (
        <main className={`screen sealed ${leaving ? "is-leaving" : ""}`}>
          <div ref={sealedEnvRef} className="sealed-env">
            <Envelope state="sealed" />
          </div>

          <p className="eyebrow rise" style={vars({ "--d": "1.5s" })}>
            Thư đã được niêm phong bằng một cái ôm
          </p>
          <h2 className="sealed-title rise" style={vars({ "--d": "1.7s" })}>
            Yêu em nhiều lắm
          </h2>
          <p className="sealed-name rise" style={vars({ "--d": "1.9s" })}>
            {NAME}
          </p>

          <div className="reminder rise" style={vars({ "--d": "2.2s" })}>
            <span>
              Nhớ ghé quán <b>bánh mỳ BBQ</b> lấy đồ ăn sáng nha em!
            </span>
          </div>

          <button className="ghost-btn rise" style={vars({ "--d": "2.5s" })} onClick={rereadLetter}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
            Đọc lại thư
          </button>
        </main>
      )}
    </div>
  );
}

export default App;
