import { useState, useEffect, useRef, type CSSProperties } from 'react';
import './App.css';

// ==========================================
// 1. TRẠNG THÁI & HẰNG SỐ CỦA BÀI HÁT CANON IN D
// ==========================================
const SYNTH_CHORDS = [
  [146.83, 293.66, 369.99, 440.00], // D (D3, D4, F#4, A4)
  [110.00, 220.00, 277.18, 329.63], // A (A2, A3, C#4, E4)
  [123.47, 246.94, 293.66, 369.99], // Bm (B2, B3, D4, F#4)
  [92.50, 185.00, 220.00, 277.18],  // F#m (F#2, F#3, A3, C#4)
  [98.00, 196.00, 246.94, 293.66],  // G (G2, G3, B3, D4)
  [73.42, 146.83, 185.00, 220.00],   // D (D2, D3, F#3, A3)
  [98.00, 196.00, 246.94, 293.66],  // G (G2, G3, B3, D4)
  [110.00, 220.00, 277.18, 329.63]  // A (A2, A3, C#4, E4)
];

const SYNTH_MELODY = [
  739.99, // F#5
  659.25, // E5
  587.33, // D5
  554.37, // C#5
  493.88, // B4
  440.00, // A4
  493.88, // B4
  554.37  // C#5
];

const MP3_PLAYLIST = [
  { name: 'Biển Tình (bientinh.mp3)', url: '/bientinh.mp3' },
  { name: 'Beautiful Dream', url: 'https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-493.mp3' },
  { name: 'Love Is Eternal', url: 'https://assets.mixkit.co/music/preview/mixkit-love-is-eternal-1014.mp3' },
  { name: 'Old Letter Lofi', url: 'https://assets.mixkit.co/music/preview/mixkit-old-letter-391.mp3' }
];

interface HeartParticle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  color: string;
  wobble: number;
  wobbleSpeed: number;
  isTrail?: boolean;
}

function App() {
  // Navigation & UI state
  const [screen, setScreen] = useState<'envelope' | 'reading' | 'accepted'>('envelope');
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [zoomTransition, setZoomTransition] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Music state
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicType, setMusicType] = useState<'synth' | 'mp3'>('mp3');
  const [selectedMp3Index, setSelectedMp3Index] = useState(0);
  const [musicMenuOpen, setMusicMenuOpen] = useState(false);

  // Typewriter effect state
  const [typedText, setTypedText] = useState('');

  // Interactive buttons state
  const [noBtnStyle, setNoBtnStyle] = useState<CSSProperties>({});
  const [yesBtnScale, setYesBtnScale] = useState(1);

  // Audio references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<any>(null);
  const audioTagRef = useRef<HTMLAudioElement | null>(null);

  // Canvas reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<HeartParticle[]>([]);
  const mousePosRef = useRef({ x: -1000, y: -1000 });

  // Custom music upload state
  const [customMusicUrl, setCustomMusicUrl] = useState<string | null>(null);
  const [customMusicName, setCustomMusicName] = useState<string>('');

  const handleCustomMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (customMusicUrl) {
        URL.revokeObjectURL(customMusicUrl);
      }
      const url = URL.createObjectURL(file);
      setCustomMusicUrl(url);
      setCustomMusicName(file.name);
      setMusicType('mp3');
      setSelectedMp3Index(999); // 999 indicates custom uploaded music
    }
  };

  useEffect(() => {
    return () => {
      if (customMusicUrl) {
        URL.revokeObjectURL(customMusicUrl);
      }
    };
  }, [customMusicUrl]);

  const letterContent = `Tớ đã suy nghĩ rất lâu trước khi quyết định viết những dòng này. Cuộc sống này có hàng tỷ người lướt qua nhau mỗi ngày, nhưng với tớ, sự xuất hiện của cậu chính là điều kỳ diệu nhất.

Cậu có biết không? Mỗi khi thấy nụ cười của cậu, cả ngày của tớ dường như bừng sáng lên. Tớ thích cách cậu nói cười, thích sự ấm áp tỏa ra từ cậu và cả những lúc cậu vụng về đáng yêu. 

Hôm nay, tớ muốn gom hết can đảm để gửi đến cậu bức thư này. Cậu chính là mảnh ghép ngọt ngào nhất mà tớ luôn tìm kiếm bấy lâu nay... ❤️`;

  // ==========================================
  // 2. HIỆU ỨNG HẠT TRÁI TIM (CANVAS PARTICLES)
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Tạo các hạt ban đầu
    const colors = ['#ff6b8b', '#ff8da1', '#ffb8c6', '#ff4757', '#ffa502'];
    const particles: HeartParticle[] = [];
    const count = 30;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height + canvas.height,
        size: Math.random() * 15 + 8,
        speedY: -(Math.random() * 1.5 + 0.5),
        speedX: Math.random() * 1 - 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.02 + 0.01
      });
    }
    particlesRef.current = particles;

    const drawHeart = (c: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, opacity: number) => {
      c.save();
      c.beginPath();
      c.translate(x, y);
      c.scale(size / 30, size / 30);
      c.fillStyle = color;
      c.globalAlpha = opacity;
      c.moveTo(0, -6);
      c.bezierCurveTo(-6, -12, -15, -6, -15, 3);
      c.bezierCurveTo(-15, 12, -6, 18, 0, 27);
      c.bezierCurveTo(6, 18, 15, 12, 15, 3);
      c.bezierCurveTo(15, -6, 6, -12, 0, -6);
      c.closePath();
      c.fill();
      c.restore();
    };

    const smoothMousePos = { x: -1000, y: -1000 };
    const lastEmitPos = { x: 0, y: 0 };

    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Interpolate smooth mouse position
      if (mousePosRef.current.x !== -1000) {
        if (smoothMousePos.x === -1000) {
          smoothMousePos.x = mousePosRef.current.x;
          smoothMousePos.y = mousePosRef.current.y;
        } else {
          smoothMousePos.x += (mousePosRef.current.x - smoothMousePos.x) * 0.15;
          smoothMousePos.y += (mousePosRef.current.y - smoothMousePos.y) * 0.15;
        }
      } else {
        smoothMousePos.x = -1000;
        smoothMousePos.y = -1000;
      }

      const currentParticles = particlesRef.current;
      const activeParticles: HeartParticle[] = [];

      currentParticles.forEach((p) => {
        if (p.isTrail) {
          // Trail particles gently drift, shrink, and fade out
          p.x += p.speedX;
          p.y += p.speedY;
          p.opacity -= 0.015; // smooth fade
          p.size -= 0.12;     // smooth shrink

          if (p.opacity > 0 && p.size > 0) {
            drawHeart(ctx, p.x, p.y, p.size, p.color, p.opacity);
            activeParticles.push(p);
          }
        } else {
          // Background particles float up and reset
          p.y += p.speedY;
          p.wobble += p.wobbleSpeed;
          p.x += Math.sin(p.wobble) * 0.5 + p.speedX;

          if (p.y < -50) {
            p.y = canvas.height + 50;
            p.x = Math.random() * canvas.width;
            p.opacity = Math.random() * 0.5 + 0.3;
          }

          drawHeart(ctx, p.x, p.y, p.size, p.color, p.opacity);
          activeParticles.push(p);
        }
      });

      // Spawn trail particles along the mouse movement path
      if (mousePosRef.current.x !== -1000) {
        const dist = Math.hypot(
          smoothMousePos.x - lastEmitPos.x,
          smoothMousePos.y - lastEmitPos.y
        );

        if (dist > 8 || Math.random() < 0.08) {
          activeParticles.push({
            x: smoothMousePos.x + (Math.random() * 10 - 5),
            y: smoothMousePos.y + (Math.random() * 10 - 5),
            size: Math.random() * 10 + 6,
            speedY: -(Math.random() * 0.8 + 0.2),
            speedX: Math.random() * 1 - 0.5,
            opacity: 0.85,
            color: colors[Math.floor(Math.random() * colors.length)],
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.05 + 0.02,
            isTrail: true
          });
          lastEmitPos.x = smoothMousePos.x;
          lastEmitPos.y = smoothMousePos.y;
        }

        // Draw a cute, glowing main heart right at the smooth cursor position
        const pulse = Math.sin(Date.now() * 0.005) * 3;
        const mainHeartSize = 25 + pulse;
        
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff4757';
        drawHeart(ctx, smoothMousePos.x, smoothMousePos.y, mainHeartSize, '#ff4757', 0.95);
        ctx.restore();
      }

      particlesRef.current = activeParticles;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseLeave = () => {
    mousePosRef.current = { x: -1000, y: -1000 };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  // Hàm tạo hạt bùng nổ khi chấp nhận tỏ tình
  const triggerCelebrationParticles = (count = 40) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const colors = ['#ff2f68', '#ff7675', '#fd79a8', '#ff007f', '#ffeaa7'];

    // Thêm hạt bay từ trung tâm màn hình ra
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.5 + 1.5;
      particlesRef.current.push({
        x: centerX,
        y: centerY,
        size: Math.random() * 12 + 6,
        speedY: Math.sin(angle) * speed - 0.6, // Đẩy bay ra ngoài kết hợp bay lên nhẹ
        speedX: Math.cos(angle) * speed,
        opacity: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.08 + 0.03
      });
    }
  };

  // ==========================================
  // 3. HỆ THỐNG PHÁT NHẠC (WEB AUDIO API SYNTHESIZER)
  // ==========================================
  const scheduleNote = (ctx: AudioContext, freq: number, startTime: number, duration: number, isMelody = false) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    // Music box envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(isMelody ? 0.14 : 0.07, startTime + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Echo effect (reverb/delay)
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.38;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.38;

    delay.connect(feedback);
    feedback.connect(delay);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.connect(delay);
    delay.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 1.2);
  };

  useEffect(() => {
    if (!isPlaying || musicType !== 'synth') {
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
        synthIntervalRef.current = null;
      }
      return;
    }

    // Tắt MP3 nếu đang phát
    if (audioTagRef.current) {
      audioTagRef.current.pause();
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    let nextNoteTime = ctx.currentTime + 0.05;
    let step = 0;

    const scheduleNextNotes = () => {
      while (nextNoteTime < ctx.currentTime + 0.3) {
        const chordIndex = Math.floor(step / 4) % 8;
        const noteInChordIndex = step % 4;

        // Phát note đệm (arpeggio)
        const baseFreq = SYNTH_CHORDS[chordIndex][noteInChordIndex];
        scheduleNote(ctx, baseFreq, nextNoteTime, 1.8, false);

        // Phát note giai điệu chính (ở phách đầu của mỗi hợp âm)
        if (noteInChordIndex === 0) {
          const melodyFreq = SYNTH_MELODY[chordIndex];
          scheduleNote(ctx, melodyFreq, nextNoteTime, 2.8, true);
        }

        nextNoteTime += 0.5; // Mỗi step kéo dài 0.5 giây
        step = (step + 1) % 32;
      }
    };

    synthIntervalRef.current = setInterval(scheduleNextNotes, 100);

    return () => {
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
        synthIntervalRef.current = null;
      }
    };
  }, [isPlaying, musicType]);

  // ==========================================
  // 4. HỆ THỐNG PHÁT NHẠC (MP3 TAG CONTROL)
  // ==========================================
  useEffect(() => {
    const audio = audioTagRef.current;
    if (!audio) return;

    if (isPlaying && musicType === 'mp3') {
      // Dừng synth
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
        synthIntervalRef.current = null;
      }

      if (selectedMp3Index === 999 && customMusicUrl) {
        audio.src = customMusicUrl;
      } else {
        // Fallback to first playlist item if 999 is selected but no custom URL is present
        audio.src = MP3_PLAYLIST[selectedMp3Index === 999 ? 0 : selectedMp3Index].url;
      }

      audio.play().catch(err => {
        console.log("Autoplay blocked or link error. Waiting for interaction.", err);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, musicType, selectedMp3Index, customMusicUrl]);

  // ==========================================
  // 5. HIỆU ỨNG CHỮ CHẠY (TYPEWRITER)
  // ==========================================
  useEffect(() => {
    if (screen !== 'reading' || currentPage !== 0) return;
    setTypedText('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < letterContent.length) {
        setTypedText(letterContent.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 45); // Tốc độ gõ chữ (45ms/ký tự)

    return () => clearInterval(interval);
  }, [screen, currentPage]);

  // ==========================================
  // 6. CÁC HÀM XỬ LÝ TƯƠNG TÁC GIAO DIỆN
  // ==========================================
  const handleOpenEnvelope = () => {
    setEnvelopeOpen(true);
    setIsPlaying(true); // Phát nhạc ngay lập tức khi tương tác mở thư

    // Kích hoạt audio context nếu có
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    // Đợi hiệu ứng mở phong thư hoàn thành rồi zoom chuyển cảnh
    setTimeout(() => {
      setZoomTransition(true);
      setTimeout(() => {
        setScreen('reading');
      }, 1500); // 1.5s zoom transition
    }, 1200); // Đợi 1.2s mở nắp và kéo lá thư lên
  };

  const handleNextPage = () => {
    if (currentPage < 2) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Nút Không chạy trốn ngẫu nhiên
  const handleNoBtnInteraction = () => {
    const randomX = (Math.random() * 160) - 80; // Giới hạn nhảy trong khoảng -80px đến 80px chiều ngang
    const randomY = (Math.random() * 120) - 100; // Nhảy chiều dọc từ -100px lên trên đến 20px xuống dưới

    setNoBtnStyle({
      position: 'relative',
      transform: `translate(${randomX}px, ${randomY}px)`,
      transition: 'transform 0.15s ease'
    });

    // Mỗi lần bấm "Không", nút "Đồng ý" to ra 15%
    setYesBtnScale(prev => Math.min(prev + 0.15, 2.5));
  };

  const handleAcceptProposal = () => {
    setScreen('accepted');
  };

  // Quản lý mưa tim ở màn hình chúc mừng (có dọn dẹp tránh lag)
  useEffect(() => {
    if (screen !== 'accepted') return;

    // Bắn đợt tim đầu tiên (50 hạt)
    triggerCelebrationParticles(50);

    // Mưa tim nhẹ nhàng hơn sau đó (15 hạt mỗi 2 giây)
    const interval = setInterval(() => {
      triggerCelebrationParticles(15);
    }, 2000);

    return () => clearInterval(interval);
  }, [screen]);

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  return (
    <div
      className="app-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
    >
      {/* Background canvas tạo các hạt tim bay */}
      <canvas ref={canvasRef} className="heart-canvas" />

      {/* Thẻ audio ẩn để chơi nhạc MP3 */}
      <audio ref={audioTagRef} loop />

      {/* Floating Music Widget */}
      {screen !== 'envelope' && (
        <div className="music-record-wrapper">
          <div
            className={`music-record-disc ${isPlaying ? 'playing' : ''}`}
            onClick={() => setMusicMenuOpen(prev => !prev)}
            title="Cài đặt nhạc"
          >
            <svg viewBox="0 0 100 100" className="vinyl-record" width="100%" height="100%">
              {/* Outer black disc */}
              <circle cx="50" cy="50" r="48" fill="#2d3436" stroke="#1e272e" strokeWidth="2" />
              {/* Inner grooves */}
              <circle cx="50" cy="50" r="38" fill="none" stroke="#57606f" strokeWidth="1" strokeDasharray="8, 4" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="#57606f" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="18" fill="none" stroke="#57606f" strokeWidth="0.5" />
              {/* Center sticker (pink) */}
              <circle cx="50" cy="50" r="14" fill="#ff6b8b" />
              {/* Heart icon in the center */}
              <path d="M50 54.5l-2.45-2.22C41.4 46.86 38 43.78 38 40c0-3.08 2.42-5.5 5.5-5.5 1.74 0 3.41.81 4.5 2.09 1.09-1.28 2.76-2.09 4.5-2.09 3.08 0 5.5 2.42 5.5 5.5 0 3.78-3.4 6.86-8.55 11.54L50 54.5z" fill="white" />
            </svg>
          </div>

          {musicMenuOpen && (
            <div className="music-settings-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--rose-gold)' }}>Cấu hình âm nhạc</span>
                <button
                  onClick={() => setMusicMenuOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px', padding: '0 5px' }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '5px' }}>
                <span className="music-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trạng thái:</span>
                <button
                  className="music-toggle-btn"
                  onClick={togglePlayPause}
                  style={{
                    background: isPlaying ? 'var(--primary-pink)' : '#dfe6e9',
                    color: isPlaying ? 'white' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '15px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isPlaying ? "Đang phát" : "Đang tắt"}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="music-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nguồn phát:</span>
                <select
                  className="music-select-box"
                  value={musicType}
                  onChange={(e) => setMusicType(e.target.value as any)}
                  style={{
                    border: '1px solid var(--soft-pink)',
                    borderRadius: '8px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    outline: 'none',
                    color: 'var(--primary-pink)',
                    background: 'white'
                  }}
                >
                  <option value="synth">Hộp Nhạc (Synth)</option>
                  <option value="mp3">Lofi Acoustic</option>
                </select>
              </div>

              {musicType === 'mp3' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="music-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bài hát:</span>
                    <select
                      className="music-select-box"
                      value={selectedMp3Index}
                      onChange={(e) => setSelectedMp3Index(Number(e.target.value))}
                      style={{
                        border: '1px solid var(--soft-pink)',
                        borderRadius: '8px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        outline: 'none',
                        color: 'var(--primary-pink)',
                        background: 'white',
                        maxWidth: '100px'
                      }}
                    >
                      {MP3_PLAYLIST.map((song, idx) => (
                        <option key={idx} value={idx}>{song.name}</option>
                      ))}
                      {customMusicUrl && (
                        <option value={999}>📁 Thiết bị...</option>
                      )}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '5px', borderTop: '1px dashed var(--soft-pink)', paddingTop: '6px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Hoặc chọn MP3 từ máy của bạn:</span>
                    <label
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        background: 'var(--light-pink)',
                        border: '1px dashed var(--primary-pink)',
                        borderRadius: '8px',
                        padding: '4px 6px',
                        fontSize: '10px',
                        color: 'var(--primary-pink)',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {customMusicName ? `🎵 ${customMusicName.substring(0, 13)}...` : "Chọn file .mp3..."}
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleCustomMusicUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
         A. MÀN HÌNH CHƯA MỞ PHONG THƯ (ENVELOPE SCREEN)
         ========================================== */}
      {screen === 'envelope' && (
        <div className={`envelope-container ${zoomTransition ? 'envelope-zoom-out' : ''}`}>
          <div
            className={`envelope-wrapper ${envelopeOpen ? 'open' : ''}`}
            onClick={!envelopeOpen ? handleOpenEnvelope : undefined}
          >
            <div className="flap"></div>
            <div className="letter-preview">
              <span style={{ fontFamily: 'var(--font-romantic)', fontSize: '26px', color: 'var(--rose-gold)', fontWeight: 'bold' }}>
                Gửi Cậu...
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                (Bấm để mở thư tình)
              </span>
            </div>
            <div className="pocket"></div>
            <div className="heart-seal">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
          <div className="click-prompt">
            <span>Bấm vào trái tim để mở thư</span>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>
      )}

      {/* ==========================================
         B. MÀN HÌNH ĐANG ĐỌC THƯ (LETTER SCREEN)
         ========================================== */}
      {/* ==========================================
         B. MÀN HÌNH ĐANG ĐỌC THƯ (LETTER SCREEN)
         ========================================== */}
      {screen === 'reading' && (
        <div className="reading-layout">
          <div className="polaroid-card">
            <div className="polaroid-img-wrapper">
              <img src="/q2.jpg" alt="Her" className="polaroid-img" />
            </div>
            <div className="polaroid-caption">Người làm tớ say đắm ✨</div>
          </div>

          <div className="letter-card">
            {/* Họa tiết trang trí góc */}
            <div className="letter-decor-top">
              <span className="decor-heart">🌸</span>
              <span className="decor-heart">🌸</span>
            </div>

            <div className="letter-body">
              {/* TRANG 1: LỜI TỎ TÌNH */}
              {currentPage === 0 && (
                <>
                  <div className="letter-header">Thư gửi người tớ thương...</div>
                  <div className="letter-text">{typedText}</div>
                </>
              )}

              {/* TRANG 2: CÁC KỶ NIỆM / LÝ DO */}
              {currentPage === 1 && (
                <div className="memories-container">
                  <div className="letter-header" style={{ marginBottom: '10px' }}>Khoảnh khắc bên cậu... ✨</div>
                  <div className="memory-card">
                    <div className="memory-icon">❤️</div>
                    <div className="memory-content">
                      <h3>Ánh mắt đầu tiên</h3>
                      <p>Ngày đầu tiên thấy cậu cười, tớ nhận ra tim mình đã đánh mất một nhịp.</p>
                    </div>
                  </div>
                  <div className="memory-card">
                    <div className="memory-icon">☕</div>
                    <div className="memory-content">
                      <h3>Những cuộc trò chuyện</h3>
                      <p>Mỗi khi nói chuyện với cậu, thời gian trôi thật nhanh và ấm áp lạ lùng.</p>
                    </div>
                  </div>
                  <div className="memory-card">
                    <div className="memory-icon">🌟</div>
                    <div className="memory-content">
                      <h3>Sự chân thành</h3>
                      <p>Tớ thích cách cậu luôn chân thành lắng nghe và ủng hộ tớ trong mọi việc.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TRANG 3: LỜI ĐỀ NGHỊ CHÍNH */}
              {currentPage === 2 && (
                <div className="proposal-box">
                  <div className="proposal-gif-placeholder">
                    <div className="pulse-ring"></div>
                    <div className="pulse-ring" style={{ animationDelay: '1s' }}></div>
                    <div className="pulse-ring" style={{ animationDelay: '2s' }}></div>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <div className="proposal-title">Điều quan trọng tớ muốn hỏi... 💌</div>
                  <div style={{ fontFamily: 'var(--font-romantic)', fontSize: '26px', color: 'var(--text-dark)' }}>
                    Cậu có đồng ý cùng tớ đi tiếp chặng đường dài phía trước và làm người yêu tớ nhé? ❤️
                  </div>

                  <div className="proposal-buttons">
                    <button
                      className="btn-yes"
                      onClick={handleAcceptProposal}
                      style={{ transform: `scale(${yesBtnScale})` }}
                    >
                      Đồng ý chứ! 🥰
                    </button>
                    <button
                      className="btn-no"
                      style={noBtnStyle}
                      onMouseEnter={handleNoBtnInteraction}
                      onTouchStart={handleNoBtnInteraction}
                      onClick={handleNoBtnInteraction}
                    >
                      Không nha 😜
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Thanh chuyển trang (Footer) */}
            <div className="letter-footer">
              <button
                className="btn-nav"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Trang trước
              </button>

              <div className="page-indicator-dots">
                {[0, 1, 2].map((idx) => (
                  <span
                    key={idx}
                    className={`indicator-dot ${currentPage === idx ? 'active' : ''}`}
                    onClick={() => setCurrentPage(idx)}
                    title={`Trang ${idx + 1}`}
                  >
                    ♥
                  </span>
                ))}
              </div>

              <button
                className="btn-nav"
                onClick={handleNextPage}
                disabled={currentPage === 2}
              >
                Trang sau
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
         C. MÀN HÌNH CHẤP NHẬN ĐỒNG Ý (CELEBRATION SCREEN)
         ========================================== */}
      {screen === 'accepted' && (
        <div className="reading-layout">
          <div className="polaroid-card" style={{ transform: 'rotate(2deg)' }}>
            <div className="polaroid-img-wrapper">
              <img src="/q1.jpg" alt="Her" className="polaroid-img" />
            </div>
            <div className="polaroid-caption">My Love ❤️</div>
          </div>

          <div className="letter-card" style={{ maxWidth: '550px', minHeight: '400px' }}>
            <div className="letter-decor-top">
              <span className="decor-heart">💖</span>
              <span className="decor-heart">💖</span>
            </div>

            <div className="letter-body">
              <div className="celebration-box">
                <p className="celebration-icon">🎉❤️💍</p>
                <h2 className="celebration-title">Yeah! Tớ biết mà!</h2>
                <p className="celebration-text">
                  Cảm ơn cậu vì đã đồng ý! Hẹn hò với tớ nhé. Tớ hứa sẽ luôn làm cậu cười và yêu thương cậu thật nhiều mỗi ngày! 🥰🌸
                </p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-muted)', marginTop: '20px' }}>
                  - Gửi cậu ngàn trái tim ngọt ngào nhất -
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
