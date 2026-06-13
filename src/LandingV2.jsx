import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './LandingV2.css'

export default function LandingV2() {
  const progressRef = useRef(null)
  const navRef = useRef(null)
  const s01Ref = useRef(null)

  useEffect(() => {
    const progressEl = progressRef.current
    const navEl = navRef.current
    const s01El = s01Ref.current

    const phrases = Array.from(s01El.querySelectorAll('.lv2-s01-phrase'))
    const N = phrases.length
    s01El.style.height = (N * 100) + 'vh'

    let currentIdx = -1

    function updateProgress() {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      progressEl.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%'
    }

    function updateNav() {
      navEl.classList.toggle('scrolled', window.scrollY > 60)
    }

    function updateNarrative() {
      const rect = s01El.getBoundingClientRect()
      const scrollable = s01El.offsetHeight - window.innerHeight
      if (scrollable <= 0) return
      const scrolled = Math.max(0, Math.min(scrollable, -rect.top))
      const progress = scrolled / scrollable
      const idx = Math.min(N - 1, Math.floor(progress * N))
      if (idx === currentIdx) return
      phrases.forEach((p, i) => {
        p.classList.remove('active', 'exit')
        if (i === idx) p.classList.add('active')
        else if (i < idx) p.classList.add('exit')
      })
      currentIdx = idx
    }

    const revealObs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.15 }
    )
    document.querySelectorAll('.lv2-reveal').forEach(el => revealObs.observe(el))

    const s04Grid = document.getElementById('lv2-s04-grid')
    if (s04Grid) {
      const v1Items = Array.from(s04Grid.querySelectorAll('.lv2-v1 .lv2-s04-item'))
      const v2Items = Array.from(s04Grid.querySelectorAll('.lv2-v2 .lv2-s04-item'))
      let s04Done = false
      new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting || s04Done) return
        s04Done = true
        v1Items.forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 120))
        const strikeAt = v1Items.length * 120 + 220
        v1Items.forEach((el, i) => setTimeout(() => el.classList.add('struck'), strikeAt + i * 75))
        const v2At = strikeAt + v1Items.length * 75 + 280
        v2Items.forEach((el, i) => setTimeout(() => el.classList.add('in'), v2At + i * 220))
      }, { threshold: 0.2 }).observe(s04Grid)
    }

    const s05El = document.getElementById('lv2-s05')
    if (s05El) {
      const s05Signals = Array.from(s05El.querySelectorAll('.lv2-s05-signal'))
      const s05Areas = Array.from(s05El.querySelectorAll('.lv2-s05-area'))
      let s05Done = false
      new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting || s05Done) return
        s05Done = true
        s05Signals.forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 100))
        const areasAt = s05Signals.length * 100 + 180
        s05Areas.forEach((el, i) => setTimeout(() => el.classList.add('in'), areasAt + i * 70))
      }, { threshold: 0.1 }).observe(s05El)
    }

    const s07El = document.getElementById('lv2-s07')
    if (s07El) {
      const mirrorItems = Array.from(s07El.querySelectorAll('.lv2-s07-mirror-item'))
      const questionEl = document.getElementById('lv2-s07-question')
      let s07Done = false
      new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting || s07Done) return
        s07Done = true
        mirrorItems.forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 90))
        setTimeout(() => questionEl && questionEl.classList.add('in'), mirrorItems.length * 90 + 220)
      }, { threshold: 0.15 }).observe(s07El)
    }

    const onScroll = () => {
      updateProgress()
      updateNav()
      updateNarrative()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    updateProgress()
    updateNav()
    updateNarrative()

    return () => {
      window.removeEventListener('scroll', onScroll)
      revealObs.disconnect()
    }
  }, [])

  return (
    <div className="lv2-root">
      <div className="lv2-bg-grid" aria-hidden="true" />
      <div id="lv2-progress" ref={progressRef} />

      {/* NAV */}
      <nav id="lv2-nav" ref={navRef}>
        <a href="#" className="lv2-nav-logo">The V2 Project</a>
        <Link to="/radiografia" className="lv2-nav-cta">Iniciar Radiografía</Link>
      </nav>

      {/* HERO */}
      <section className="lv2-hero">
        <span className="lv2-hero-eyebrow">Sistema de Reconstrucción</span>
        <h1 className="lv2-hero-title">V2</h1>
        <p className="lv2-hero-slogan">La evidencia no miente.</p>
        <div className="lv2-hero-scroll" aria-hidden="true">
          <span className="lv2-hero-scroll-label">Scroll</span>
          <div className="lv2-hero-scroll-track" />
        </div>
      </section>

      {/* 01 — NARRATIVA */}
      <section id="lv2-s01" ref={s01Ref} aria-label="Narrativa">
        <div className="lv2-s01-pin">
          <p className="lv2-s01-phrase" data-index="0">No necesitas motivación.</p>
          <p className="lv2-s01-phrase" data-index="1">No necesitas inspiración.</p>
          <p className="lv2-s01-phrase" data-index="2">No necesitas el playlist correcto.</p>
          <p className="lv2-s01-phrase" data-index="3">No necesitas que esté soleado.</p>
          <p className="lv2-s01-phrase" data-index="4">No necesitas la membresía perfecta.</p>
          <p className="lv2-s01-phrase" data-index="5">No necesitas otro lunes.</p>
          <p className="lv2-s01-phrase lv2-pivot" data-index="6">Necesitas cumplir lo que te prometes.</p>
        </div>
      </section>

      {/* 02 — REALIDAD */}
      <section className="lv2-section">
        <div className="lv2-s02-inner">
          <span className="lv2-section-tag lv2-reveal">02 — Realidad</span>
          <h2 className="lv2-s02-headline lv2-reveal">
            Tus resultados actuales<br />
            son tu historial<br />
            de decisiones.
          </h2>
          <div className="lv2-s02-rule lv2-reveal" />
          <p className="lv2-s02-statement lv2-reveal">La evidencia no miente.</p>
        </div>
      </section>

      {/* 03 — QUÉ ES V2 */}
      <section className="lv2-section">
        <div className="lv2-s03-inner">
          <span className="lv2-section-tag lv2-reveal">03 — Qué es V2</span>
          <h2 className="lv2-s03-headline lv2-reveal">
            V2 es un sistema<br />
            para <span className="lv2-em">erradicar</span><br />
            una identidad<br />
            que ya no funciona.
          </h2>
          <p className="lv2-s03-coda lv2-reveal">
            O que nunca funcionó.<br /><br />
            No para motivarte.<br />
            Para reconstruirte.
          </p>
        </div>
      </section>

      {/* 04 — V1 VS V2 */}
      <section className="lv2-section">
        <div className="lv2-s04-inner">
          <span className="lv2-section-tag lv2-reveal" style={{ textAlign: 'center' }}>04 — V1 vs V2</span>
          <div className="lv2-s04-grid" id="lv2-s04-grid">
            <div className="lv2-s04-col lv2-v1">
              <div className="lv2-s04-col-label">V1</div>
              <div className="lv2-s04-item">Quiere comodidad.</div>
              <div className="lv2-s04-item">Quiere otro lunes.</div>
              <div className="lv2-s04-item">Quiere más tiempo.</div>
              <div className="lv2-s04-item">Quiere negociar.</div>
              <div className="lv2-s04-item">Quiere posponer.</div>
              <div className="lv2-s04-item">Siempre tiene una explicación.</div>
            </div>
            <div className="lv2-s04-col lv2-v2">
              <div className="lv2-s04-col-label">V2</div>
              <div className="lv2-s04-item">Ejecuta.</div>
              <div className="lv2-s04-item">Y se calla.</div>
            </div>
          </div>
          <p className="lv2-s04-coda lv2-reveal">
            La diferencia no es intención.<br />
            La diferencia es <strong>ejecución</strong>.
          </p>
        </div>
      </section>

      {/* 05 — LA EVIDENCIA */}
      <section className="lv2-section" id="lv2-s05">
        <div className="lv2-s05-inner">
          <span className="lv2-section-tag lv2-reveal">05 — La Evidencia</span>
          <h2 className="lv2-s05-headline lv2-reveal">La evidencia<br />ya habló.</h2>
          <div className="lv2-s05-signals">
            <p className="lv2-s05-signal">Tu cuerpo habla.</p>
            <p className="lv2-s05-signal">Tus hábitos hablan.</p>
            <p className="lv2-s05-signal">Tus relaciones hablan.</p>
            <p className="lv2-s05-signal">Tu energía habla.</p>
            <p className="lv2-s05-signal">Tu trabajo habla.</p>
            <p className="lv2-s05-signal">Tus resultados hablan.</p>
          </div>
          <div className="lv2-s05-areas" aria-label="Áreas de V2">
            <div className="lv2-s05-area">Salud Física</div>
            <div className="lv2-s05-area">Salud Mental</div>
            <div className="lv2-s05-area">Disciplina</div>
            <div className="lv2-s05-area">Relaciones</div>
            <div className="lv2-s05-area">Desarrollo Profesional</div>
            <div className="lv2-s05-area">Identidad</div>
          </div>
        </div>
      </section>

      {/* 06 — RADIOGRAFÍA */}
      <section className="lv2-section" id="lv2-radiografia">
        <div className="lv2-s06-inner">
          <span className="lv2-section-tag lv2-reveal">06 — Radiografía V2</span>
          <p className="lv2-s06-pre lv2-reveal">
            No puedes mejorar algo<br />
            que no has medido.<br /><br />
            Antes de construir.<br />
            Necesitas saber dónde estás.
          </p>
          <h2 className="lv2-s06-headline lv2-reveal">Radiografía<br />V2</h2>
          <Link to="/radiografia" className="lv2-btn-primary lv2-reveal">Iniciar Radiografía</Link>
        </div>
      </section>

      {/* 07 — CIERRE */}
      <section className="lv2-section" id="lv2-s07">
        <div className="lv2-s07-inner">
          <span className="lv2-section-tag lv2-reveal">07 — Decisión</span>
          <div className="lv2-s07-mirror">
            <p className="lv2-s07-mirror-item">Mírate.</p>
            <p className="lv2-s07-mirror-item">Tus hábitos.</p>
            <p className="lv2-s07-mirror-item">Tus relaciones.</p>
            <p className="lv2-s07-mirror-item">Tus resultados.</p>
            <p className="lv2-s07-mirror-item">Tu cuerpo.</p>
            <p className="lv2-s07-mirror-item">Tu energía.</p>
            <p className="lv2-s07-mirror-item">Tu disciplina.</p>
          </div>
          <p className="lv2-s07-question" id="lv2-s07-question">
            La evidencia ya emitió su veredicto.<br /><br />
            ¿Vas a seguir justificando los resultados?<br />
            ¿O vas a empezar a construir tu V2?
          </p>
          <Link to="/radiografia" className="lv2-btn-primary">Comenzar</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lv2-footer">
        <span className="lv2-footer-brand">The V2 Project</span>
        <span className="lv2-footer-tagline">La evidencia no miente.</span>
      </footer>
    </div>
  )
}
