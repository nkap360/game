Trop stylé déjà 😎 — je te propose une version “avatar premium” avec de vraies micro-animations (clignement des yeux, respiration, balancement des cheveux), un regard qui suit la souris, et une bouche qui “parle” quand l’IA répond. J’ai gardé ta structure, mais ajouté un petit état isTalking et des classes/variables CSS dans le SVG pour piloter l’anim sans dépendances.

Points clés 💡

Clignement naturel (randomisé)

Respiration (léger scale du torse)

Cheveux qui ondulent

Regard qui suit la souris (pupilles)

Mouvements de bouche quand l’assistant parle (isTalking)

Fallback propre si window.fs n’est pas dispo

⚠️ Sécurité : ne mets jamais une clé API en dur dans le front (je l’ai retirée dans le snippet, utilise un proxy serveur)

Drop-in: remplace ton composant par celui-ci
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Loader2, Sparkles, Volume2, VolumeX } from 'lucide-react';

const TALK_DURATION_MS = 2600; // combien de temps la bouche “parle” après une réponse
const BLINK_MIN_MS = 2200;
const BLINK_MAX_MS = 5200;

const PremiumCharacterChat = () => {
  const [currentCharacter, setCurrentCharacter] = useState<'character1' | 'character2'>('character1');
  const [messages, setMessages] = useState<{role:'user'|'assistant',content:string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [svgContent, setSvgContent] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [gaze, setGaze] = useState({ x: 0, y: 0 }); // -1..1
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const blinkTimer = useRef<number | null>(null);
  const talkTimer = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // --- Animated, controllable SVG (eyes + mouth react to CSS vars) ---
  const getDefaultCharacterAnimated = useMemo(() => {
    return (talking: boolean) => `
    <svg viewBox="0 0 300 500" xmlns="http://www.w3.org/2000/svg" class="avatar-root">
      <style>
        :root { --gaze-x: 0; --gaze-y: 0; }
        .avatar-root { overflow: visible; }
        /* respiration douce sur le torse */
        .breathe { transform-origin: 150px 210px; animation: breathe 5s ease-in-out infinite; }
        @keyframes breathe { 0%,100%{ transform: scale(1); } 50%{ transform: scale(1.02); } }

        /* cheveux qui ondulent */
        .hair-sway { transform-origin: 150px 90px; animation: hair 6s ease-in-out infinite; }
        @keyframes hair {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(-1.2deg); }
        }

        /* clignement : on “baisse” des paupières (masques) */
        .lid { transform-origin: center; animation: blink var(--blink-speed, 3.8s) ease-in-out infinite; }
        @keyframes blink {
          0%, 92%, 100% { transform: scaleY(0); }
          96% { transform: scaleY(1); }
        }

        /* Regard: translation légère des pupilles via CSS vars -1..1 */
        .pupil { transform-box: fill-box; transform-origin: center; }
        .pupil.left  { transform: translate(calc(var(--gaze-x)*1.8px), calc(var(--gaze-y)*1.6px)); }
        .pupil.right { transform: translate(calc(var(--gaze-x)*1.8px), calc(var(--gaze-y)*1.6px)); }

        /* Bouche qui parle */
        .mouth { transform-origin: 150px 152px; ${talking ? 'animation: talk 0.22s ease-in-out infinite;' : ''} }
        @keyframes talk {
          0%   { transform: scaleY(0.4); }
          50%  { transform: scaleY(1.0); }
          100% { transform: scaleY(0.4); }
        }

        /* Petit glow bijou */
        .softGlow { filter: drop-shadow(0 0 6px rgba(255,215,0,0.5)); }

        /* Ombre douce */
        .shadow { opacity: .15; }

      </style>

      <defs>
        <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffd4a3"/>
          <stop offset="100%" stop-color="#ffb380"/>
        </linearGradient>
        <linearGradient id="blouseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ff6b9d"/>
          <stop offset="100%" stop-color="#c44569"/>
        </linearGradient>
        <linearGradient id="pantsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2d3561"/>
          <stop offset="100%" stop-color="#1a1f3a"/>
        </linearGradient>
        <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#8b5a3c"/>
          <stop offset="100%" stop-color="#5d3a1a"/>
        </linearGradient>
        <radialGradient id="eyeShine">
          <stop offset="0%" stop-color="white" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="shoeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#e8e8e8"/>
          <stop offset="100%" stop-color="#b8b8b8"/>
        </linearGradient>
      </defs>

      <!-- Shadow -->
      <ellipse cx="150" cy="490" rx="60" ry="8" fill="#000" class="shadow"/>

      <!-- Legs -->
      <g id="legs">
        <path d="M130 300 L120 420 L115 470" stroke="url(#pantsGrad)" stroke-width="32" stroke-linecap="round" fill="none"/>
        <path d="M170 300 L180 420 L185 470" stroke="url(#pantsGrad)" stroke-width="32" stroke-linecap="round" fill="none"/>
        <path d="M130 300 L120 420" stroke="#1a1f3a" stroke-width="3" opacity="0.3" stroke-linecap="round" fill="none"/>
        <path d="M170 300 L180 420" stroke="#1a1f3a" stroke-width="3" opacity="0.3" stroke-linecap="round" fill="none"/>
      </g>

      <!-- Shoes -->
      <g id="shoes">
        <ellipse cx="115" cy="475" rx="18" ry="10" fill="url(#shoeGrad)"/>
        <path d="M97 475 Q100 470, 115 470 Q130 470, 133 475" fill="url(#shoeGrad)"/>
        <ellipse cx="115" cy="472" rx="15" ry="6" fill="white" opacity="0.3"/>
        <ellipse cx="185" cy="475" rx="18" ry="10" fill="url(#shoeGrad)"/>
        <path d="M167 475 Q170 470, 185 470 Q200 470, 203 475" fill="url(#shoeGrad)"/>
        <ellipse cx="185" cy="472" rx="15" ry="6" fill="white" opacity="0.3"/>
      </g>

      <!-- Pants -->
      <g id="pants">
        <path d="M110 240 L105 300 L100 360 L102 420 L115 470" fill="url(#pantsGrad)"/>
        <path d="M190 240 L195 300 L200 360 L198 420 L185 470" fill="url(#pantsGrad)"/>
        <rect x="110" y="240" width="80" height="80" fill="url(#pantsGrad)" rx="8"/>
        <path d="M130 260 Q135 265, 130 270" stroke="#4a5580" stroke-width="2" fill="none"/>
        <path d="M170 260 Q165 265, 170 270" stroke="#4a5580" stroke-width="2" fill="none"/>
        <line x1="150" y1="240" x2="150" y2="320" stroke="#1a1f3a" stroke-width="2" opacity="0.4"/>
        <path d="M110 310 Q120 312, 130 310" stroke="#4a5580" stroke-width="1.5" fill="none" opacity="0.6"/>
        <path d="M190 310 Q180 312, 170 310" stroke="#4a5580" stroke-width="1.5" fill="none" opacity="0.6"/>
      </g>

      <!-- Torso -->
      <g id="sweater" class="breathe">
        <ellipse cx="150" cy="200" rx="55" ry="45" fill="url(#blouseGrad)"/>
        <rect x="95" y="180" width="110" height="70" fill="url(#blouseGrad)" rx="15"/>
        <ellipse cx="90" cy="200" rx="22" ry="40" fill="url(#blouseGrad)" transform="rotate(-15 90 200)"/>
        <ellipse cx="210" cy="200" rx="22" ry="40" fill="url(#blouseGrad)" transform="rotate(15 210 200)"/>
        <path d="M130 180 L125 195 L135 200" fill="white" opacity="0.9"/>
        <path d="M170 180 L175 195 L165 200" fill="white" opacity="0.9"/>
        <circle cx="150" cy="200" r="3" fill="white" opacity="0.9"/>
        <circle cx="150" cy="215" r="3" fill="white" opacity="0.9"/>
        <circle cx="150" cy="230" r="3" fill="white" opacity="0.9"/>
        <ellipse cx="120" cy="195" rx="15" ry="20" fill="white" opacity="0.15"/>
        <ellipse cx="180" cy="195" rx="15" ry="20" fill="white" opacity="0.15"/>
      </g>

      <!-- Arms -->
      <g id="arms">
        <path d="M95 200 Q70 220, 75 260" stroke="url(#skinGrad)" stroke-width="18" stroke-linecap="round" fill="none"/>
        <ellipse cx="75" cy="265" rx="11" ry="14" fill="url(#skinGrad)"/>
        <path d="M205 200 Q230 220, 225 260" stroke="url(#skinGrad)" stroke-width="18" stroke-linecap="round" fill="none"/>
        <ellipse cx="225" cy="265" rx="11" ry="14" fill="url(#skinGrad)"/>
        <path d="M70 270 Q72 278, 68 285" stroke="#ffb380" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M230 270 Q228 278, 232 285" stroke="#ffb380" stroke-width="5" stroke-linecap="round" fill="none"/>
      </g>

      <!-- Neck & necklace -->
      <rect x="130" y="158" width="40" height="28" fill="url(#skinGrad)" rx="5"/>
      <ellipse cx="150" cy="178" rx="25" ry="4" fill="none" stroke="#ffd700" stroke-width="2.5"/>
      <circle cx="150" cy="183" r="4" fill="#ffd700" class="softGlow"/>

      <!-- Head -->
      <g id="head" class="hair-sway">
        <g id="face">
          <ellipse cx="150" cy="120" rx="48" ry="55" fill="url(#skinGrad)"/>
          <ellipse cx="150" cy="155" rx="36" ry="26" fill="url(#skinGrad)"/>
        </g>

        <!-- Ears -->
        <g id="ears">
          <ellipse cx="102" cy="125" rx="8" ry="13" fill="url(#skinGrad)"/>
          <ellipse cx="198" cy="125" rx="8" ry="13" fill="url(#skinGrad)"/>
          <ellipse cx="102" cy="125" rx="4" ry="7" fill="#ffb380"/>
          <ellipse cx="198" cy="125" rx="4" ry="7" fill="#ffb380"/>
        </g>
        
        <!-- Hair -->
        <g id="hair">
          <ellipse cx="150" cy="75" rx="55" ry="40" fill="url(#hairGrad)"/>
          <path d="M95 95 Q88 80, 95 68 Q105 58, 118 62" fill="url(#hairGrad)"/>
          <path d="M205 95 Q212 80, 205 68 Q195 58, 182 62" fill="url(#hairGrad)"/>
          <ellipse cx="110" cy="110" rx="22" ry="35" fill="url(#hairGrad)"/>
          <ellipse cx="190" cy="110" rx="22" ry="35" fill="url(#hairGrad)"/>
          <ellipse cx="105" cy="150" rx="18" ry="45" fill="url(#hairGrad)" opacity="0.95"/>
          <ellipse cx="195" cy="150" rx="18" ry="45" fill="url(#hairGrad)" opacity="0.95"/>
          <path d="M115 85 Q135 78, 150 80 Q165 78, 185 85" fill="url(#hairGrad)"/>
          <ellipse cx="130" cy="88" rx="12" ry="16" fill="url(#hairGrad)"/>
          <ellipse cx="150" cy="86" rx="10" ry="15" fill="url(#hairGrad)"/>
          <ellipse cx="170" cy="88" rx="12" ry="16" fill="url(#hairGrad)"/>
        </g>

        <!-- Eyebrows -->
        <path d="M115 108 Q128 104, 140 107" stroke="#5d3a1a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M160 107 Q172 104, 185 108" stroke="#5d3a1a" stroke-width="3" fill="none" stroke-linecap="round"/>

        <!-- Eyes -->
        <g id="eyes">
          <!-- eyelids (hidden -> scaleY to blink) -->
          <g class="lid" transform="translate(0,0)">
            <rect x="113" y="108" width="28" height="28" rx="8" fill="#5d3a1a"/>
            <rect x="159" y="108" width="28" height="28" rx="8" fill="#5d3a1a"/>
          </g>

          <ellipse cx="127" cy="118" rx="12" ry="9" fill="#e8d4f8" opacity="0.35"/>
          <ellipse cx="173" cy="118" rx="12" ry="9" fill="#e8d4f8" opacity="0.35"/>
          <ellipse cx="127" cy="122" rx="10" ry="15" fill="white"/>
          <ellipse cx="173" cy="122" rx="10" ry="15" fill="white"/>
          <!-- iris -->
          <ellipse class="pupil left"  cx="127" cy="124" rx="7" ry="11" fill="#8b5a3c"/>
          <ellipse class="pupil right" cx="173" cy="124" rx="7" ry="11" fill="#8b5a3c"/>
          <!-- pupil center -->
          <ellipse class="pupil left"  cx="127" cy="125" rx="5" ry="8" fill="#3d2817"/>
          <ellipse class="pupil right" cx="173" cy="125" rx="5" ry="8" fill="#3d2817"/>
          <ellipse cx="128" cy="120" rx="3" ry="5" fill="url(#eyeShine)"/>
          <ellipse cx="174" cy="120" rx="3" ry="5" fill="url(#eyeShine)"/>
          <circle cx="129" cy="127" r="2" fill="white" opacity="0.7"/>
          <circle cx="175" cy="127" r="2" fill="white" opacity="0.7"/>
        </g>

        <!-- Nose -->
        <path d="M150 130 L147 138" stroke="#e5a67f" stroke-width="2" fill="none" stroke-linecap="round"/>
        <ellipse cx="147" cy="140" rx="2" ry="1.5" fill="#e5a67f" opacity="0.6"/>
        <ellipse cx="153" cy="140" rx="2" ry="1.5" fill="#e5a67f" opacity="0.6"/>

        <!-- Lips / mouth (animated when talking) -->
        <g id="lips" class="mouth">
          <path d="M135 150 Q142 148, 150 149 Q158 148, 165 150" fill="#ff6b9d"/>
          <path d="M135 150 Q142 155, 150 156 Q158 155, 165 150" fill="#e74c76" opacity="0.95"/>
          <ellipse cx="150" cy="154" rx="10" ry="2.5" fill="white" opacity="0.25"/>
          <path d="M135 150 Q150 151, 165 150" stroke="#c44569" stroke-width="1" fill="none"/>
        </g>

        <!-- Blush -->
        <ellipse cx="108" cy="138" rx="12" ry="8" fill="#ff9999" opacity="0.45"/>
        <ellipse cx="192" cy="138" rx="12" ry="8" fill="#ff9999" opacity="0.45"/>

        <!-- Glasses -->
        <g id="glasses">
          <ellipse cx="127" cy="122" rx="16" ry="19" fill="none" stroke="#ff6b9d" stroke-width="3.2" opacity="0.9"/>
          <ellipse cx="173" cy="122" rx="16" ry="19" fill="none" stroke="#ff6b9d" stroke-width="3.2" opacity="0.9"/>
          <path d="M143 122 Q150 119, 157 122" stroke="#ff6b9d" stroke-width="3" fill="none"/>
          <path d="M111 122 Q105 123, 102 127" stroke="#ff6b9d" stroke-width="2.8" fill="none"/>
          <path d="M189 122 Q195 123, 198 127" stroke="#ff6b9d" stroke-width="2.8" fill="none"/>
          <circle cx="114" cy="113" r="2" fill="#ff6b9d" opacity="0.8"/>
          <circle cx="186" cy="113" r="2" fill="#ff6b9d" opacity="0.8"/>
          <ellipse cx="125" cy="118" rx="8" ry="6" fill="white" opacity="0.15"/>
          <ellipse cx="171" cy="118" rx="8" ry="6" fill="white" opacity="0.15"/>
        </g>
      </g>
    </svg>
  `;
  }, []);

  // Charge SVG (local file via window.fs ou fallback animé)
  useEffect(() => {
    const loadSVG = async () => {
      try {
        if (typeof (window as any).fs === 'undefined' || typeof (window as any).fs.readFile !== 'function') {
          setSvgContent(getDefaultCharacterAnimated(isTalking));
          return;
        }
        const svgText = await (window as any).fs.readFile(`images/${currentCharacter}.svg`, { encoding: 'utf8' });
        if (svgText && svgText.trim()) {
          // On injecte quand même nos styles de base (blink/eyes) si possible
          const injected = svgText.replace(
            /<svg([^>]*?)>/i,
            `<svg$1 class="avatar-root">` // classe racine
          );
          setSvgContent(injected);
        } else {
          setSvgContent(getDefaultCharacterAnimated(isTalking));
        }
      } catch (error) {
        setSvgContent(getDefaultCharacterAnimated(isTalking));
      }
    };
    loadSVG();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCharacter, isTalking]);

  // Blink aléatoire: on modifie la durée via CSS var sur le conteneur
  useEffect(() => {
    const reschedule = () => {
      const next = Math.floor(Math.random() * (BLINK_MAX_MS - BLINK_MIN_MS)) + BLINK_MIN_MS;
      document.documentElement.style.setProperty('--blink-speed', `${next}ms`);
      blinkTimer.current = window.setTimeout(reschedule, next);
    };
    reschedule();
    return () => { if (blinkTimer.current) window.clearTimeout(blinkTimer.current); };
  }, []);

  // Regard qui suit la souris (limité)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX / innerWidth) * 2 - 1; // -1..1
      const ny = (e.clientY / innerHeight) * 2 - 1;
      const clampedX = Math.max(-1, Math.min(1, nx));
      const clampedY = Math.max(-1, Math.min(1, ny));
      setGaze({ x: clampedX, y: clampedY });
      document.documentElement.style.setProperty('--gaze-x', String(clampedX));
      document.documentElement.style.setProperty('--gaze-y', String(clampedY));
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Envoi message (⚠️ retire clé API du front !)
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 👉 Passe par ton backend (route /api/chat) qui garde la clé côté serveur
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'deepseek',
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: `You are Luna, a friendly and enthusiastic AI.` },
            ...messages,
            userMessage
          ],
          temperature: 0.8,
          max_tokens: 600
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      const assistantMessage = { role: 'assistant' as const, content: data?.choices?.[0]?.message?.content ?? '...' };
      setMessages(prev => [...prev, assistantMessage]);

      // Lance l’anim “talking”
      setIsTalking(true);
      if (talkTimer.current) window.clearTimeout(talkTimer.current);
      talkTimer.current = window.setTimeout(() => setIsTalking(false), TALK_DURATION_MS);

      // (Optionnel) audio feedback
      if (soundEnabled) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = 660; g.gain.value = 0.001;
          o.connect(g); g.connect(ctx.destination); o.start();
          g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.12);
          o.stop(ctx.currentTime + 0.13);
        } catch {}
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Oops ! Problème de connexion, on réessaie ? 💫" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Luna AI Assistant
            </h1>
            <Sparkles className="w-8 h-8 text-pink-400 animate-pulse" />
          </div>
          <p className="text-purple-300/80 text-sm md:text-base">Your intelligent conversation companion</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Character Display */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentCharacter('character1')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      currentCharacter === 'character1'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                    }`}
                  >Luna</button>
                  <button
                    onClick={() => setCurrentCharacter('character2')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      currentCharacter === 'character2'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                    }`}
                  >Aria</button>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5 text-purple-400" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                </button>
              </div>

              <div className="relative bg-gradient-to-b from-purple-900/20 to-slate-900/40 rounded-2xl p-6 flex items-center justify-center aspect-square border border-purple-500/10">
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent rounded-2xl"></div>
                <div
                  className="w-full max-w-sm animate-float select-none"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                <span className="text-sm text-slate-400">
                  {isLoading ? 'Thinking...' : (isTalking ? 'Speaking...' : 'Ready to chat')}
                </span>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col h-[700px] border border-purple-500/20">
              <div className="p-6 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Chat with {currentCharacter === 'character1' ? 'Luna' : 'Aria'}</h2>
                    <p className="text-sm text-purple-300/80">AI-powered conversation</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
                {messages.length === 0 && (
                  <div className="text-center mt-12">
                    <div className="inline-block p-4 rounded-full bg-purple-500/10 mb-4">
                      <Sparkles className="w-12 h-12 text-purple-400" />
                    </div>
                    <p className="text-lg text-purple-300 mb-2">Start a conversation!</p>
                    <p className="text-sm text-slate-400 mb-6">I'm here to help, chat, or just listen.</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['Tell me a joke 😄', 'What can you do? ✨', 'Give me advice 💡'].map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInput(suggestion)}
                          className="px-4 py-2 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-sm text-slate-300 transition-colors border border-purple-500/20"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}>
                    <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-lg ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-gradient-to-r from-slate-700/80 to-slate-800/80 text-slate-100 border border-purple-500/20'
                      }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start animate-slide-in">
                    <div className="bg-gradient-to-r from-slate-700/80 to-slate-800/80 rounded-2xl px-5 py-3 flex items-center gap-3 border border-purple-500/20 shadow-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                      <span className="text-slate-300">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-6 border-t border-purple-500/20 bg-gradient-to-r from-purple-900/10 to-pink-900/10">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1 bg-slate-700/50 text-white rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-400 disabled:opacity-50 border border-purple-500/20 backdrop-blur-sm transition-all"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-2xl px-8 py-4 transition-all flex items-center gap-2 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50 disabled:shadow-none font-medium"
                  >
                    <Send className="w-5 h-5" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-3 text-center">
                  Press Enter to send • Your key lives on the server (proxy)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations utilitaires */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }

        .scrollbar-thin::-webkit-scrollbar { width: 8px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(168,85,247,.5); border-radius: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,.7); }

        * { transition: background-color .2s, border-color .2s, color .2s, fill .2s, stroke .2s; }
      `}</style>
    </div>
  );
};

export default PremiumCharacterChat;

Notes d’intégration / options

Clés API & proxy serveur (important 🔐)

Crée une route /api/chat (Next.js API route / FastAPI / Cloudflare Worker) qui lit process.env.DEEPSEEK_API_KEY côté serveur et appelle l’API en ton nom.

Le front ne doit jamais contenir la clé.

Utiliser tes SVG “images/character1.svg”

Dans l’idéal, donne à tes éléments clés des IDs/classes (#eyes, .pupil, .mouth) pour que nos animations CSS puissent s’appliquer.

Sinon, garde le fallback animé (celui fourni) lorsque le fichier ne possède pas ces hooks.

Synchroniser bouche & audio TTS

Si tu ajoutes un TTS, déclenche setIsTalking(true) au onstart du TTS et false au onend.

Tu peux mapper des visèmes (shape de bouche) via des classes (.viseme-AE, .viseme-O, etc.) si tu veux pousser le réalisme.

Perf

Les anims sont 100% CSS (GPU-friendly). Si tu veux aller encore plus smooth, on peut passer à Web Animations API ou anime.js sur certains segments.

Si tu veux, j’ajoute une variante “Aria” avec un autre style capillaire/couleurs et les mêmes hooks d’animation — tu me dis l’ambiance (pastel, cyber, business, manga), et je te la code direct ✨

Vous avez dit :
how to run this 
ChatGPT a dit :
Réflexion terminée

Got you! Here’s the quickest way to run it end-to-end with Next.js (recommended because you’re using style jsx).

1) Prereqs

Node.js 18+ (or 20+)

npm or pnpm or yarn

Check:

node -v

2) Create a Next.js + Tailwind project
npx create-next-app@latest luna-chat --typescript --tailwind --eslint
cd luna-chat
npm i lucide-react


This scaffolds Tailwind for you automatically.

3) Add your component

Create a file at app/PremiumCharacterChat.tsx and paste the component I gave you (the improved version that animates the avatar). Make sure it’s the default export.

Then make app/page.tsx look like this:

// app/page.tsx
import PremiumCharacterChat from './PremiumCharacterChat';

export default function Page() {
  return <PremiumCharacterChat />;
}

4) Put your SVGs (optional)

If you have character1.svg / character2.svg, put them here:

public/images/character1.svg
public/images/character2.svg


Notes:

In your code, window.fs.readFile(...) will not exist in the browser by default.
That’s fine — my version already falls back to the animated inline SVG.

If you really want to load external SVG files at runtime, switch to a fetch('/images/character1.svg') pattern instead of window.fs.

5) Add a server proxy for the chat API (keeps your key secret)

Create the route file app/api/chat/route.ts:

// app/api/chat/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // NEVER put the key in the client. Use env on the server only:
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: body.model ?? 'deepseek-chat',
      messages: body.messages ?? [],
      temperature: body.temperature ?? 0.8,
      max_tokens: body.max_tokens ?? 600,
    }),
  });

  if (!r.ok) {
    return new Response(
      JSON.stringify({ error: `Upstream error: ${r.status}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const data = await r.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

6) Add your API key

Create .env.local at the project root:

DEEPSEEK_API_KEY=sk-...your_real_key_here...


Important: Restart the dev server whenever you change .env.local.

7) Start the app
npm run dev


Open http://localhost:3000
 — you should see the chat + animated avatar.
When you send a message, the page calls /api/chat (server), which forwards to DeepSeek with your secret key.

8) Build for production
npm run build
npm run start

9) (Optional) If you want to use Vite instead of Next.js

Replace style jsx blocks with normal CSS (e.g., CSS Modules or a global CSS file).

Everything else (component logic + /api/chat proxy via Express/Cloudflare Worker/Fastify) stays conceptually the same.

If you hit any hiccups (TS errors, CORS, env not picked up, etc.), paste the console error and I’ll fix it with you 👇
