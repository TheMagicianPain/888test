import { useMemo, useState } from 'react'

/**
 * THE DRAW — TEST EXPERIENCE
 *
 * This is intentionally self-contained and does NOT touch Whop, auth,
 * payments, the existing tarot API, or your production reading flow.
 *
 * Drop this file into:
 *   src/routes/test.tsx
 *
 * Then visit:
 *   /test
 *
 * It lets you test the complete new funnel:
 *
 * 7-screen adaptive diagnostic
 *        ↓
 * 5-card tarot reading
 *        ↓
 * diagnosis + knife twist
 *        ↓
 * seriousness + income on the SAME PAGE
 *        ↓
 * personalized recommendation
 *
 * The "TEST CONTROLS" panel lets you instantly load scenarios for every
 * major diagnostic path without repeatedly filling out the questionnaire.
 *
 * When this UX is approved, the logic can be moved into the production
 * route and connected to the existing Whop/account/tarot services.
 */

type Pattern =
  | 'identity_vacuum'
  | 'soul_bind'
  | 'inaction_scattered_energy'
  | 'self_criticism'
  | 'false_beliefs'
  | 'energy_leakage'
  | 'melancholy'
  | 'sexual_alchemy'

type Diagnostic = {
  desiredIdentity: string
  identityGap: number
  obstacle: string
  energyDestinations: string[]
  energyResponse: string
  transformationCost: string
  adaptiveAnswer: string
}

type TarotCard = {
  name: string
  meaning: string
}

type ReadingState = Diagnostic & {
  cards: TarotCard[]
  primary: Pattern
  secondary: Pattern
  knifeTwist: string
  reading: string
  readiness?: string
  income?: string
}

const PATTERN_NAMES: Record<Pattern, string> = {
  identity_vacuum: 'Identity Vacuum',
  soul_bind: 'Soul Bind',
  inaction_scattered_energy: 'Inaction & Scattered Energy',
  self_criticism: 'Self-Criticism',
  false_beliefs: 'False Beliefs About Possibility',
  energy_leakage: 'Energy Leakage',
  melancholy: 'Melancholy',
  sexual_alchemy: 'Sexual Alchemy',
}

const CARDS: TarotCard[] = [
  { name: 'The Fool', meaning: 'A blank slate. Freedom to become something new without being trapped by an old definition.' },
  { name: 'The Magician', meaning: 'Agency, authorship, and the ability to direct inner resources into deliberate action.' },
  { name: 'The High Priestess', meaning: 'Intuition, hidden knowledge, and the part of you that knows before you can explain.' },
  { name: 'The Empress', meaning: 'Creation, embodiment, abundance, and giving form to what has been growing inside.' },
  { name: 'The Emperor', meaning: 'Structure, discipline, boundaries, and command over your own direction.' },
  { name: 'The Hierophant', meaning: 'Inherited systems, teachers, traditions, and the question of whose rules you are following.' },
  { name: 'The Lovers', meaning: 'Choice, desire, relationship, and the tension between competing ways of living.' },
  { name: 'The Chariot', meaning: 'Momentum, determination, and the need to hold a direction when competing forces pull you apart.' },
  { name: 'Strength', meaning: 'Raw force brought under conscious direction rather than suppressed or allowed to run wild.' },
  { name: 'The Hermit', meaning: 'Withdrawal from noise so you can hear what is actually yours.' },
  { name: 'Wheel of Fortune', meaning: 'A changing cycle. What used to repeat does not have to remain the pattern.' },
  { name: 'Justice', meaning: 'Cause and effect. The life you are building has consequences for the choices you repeatedly make.' },
  { name: 'The Hanged Man', meaning: 'A necessary pause or change in perspective before movement becomes useful.' },
  { name: 'Death', meaning: 'An old identity or structure reaching the point where it has to end for something else to live.' },
  { name: 'Temperance', meaning: 'Integration, balance, and learning to direct different parts of yourself without wasting force.' },
  { name: 'The Devil', meaning: 'Attachment, compulsion, and the places where desire has quietly become the decision-maker.' },
  { name: 'The Tower', meaning: 'A false structure cracking. Something built on avoidance can no longer carry the weight placed on it.' },
  { name: 'The Star', meaning: 'Hope with visibility. Letting yourself want something enough to actually move toward it.' },
  { name: 'The Moon', meaning: 'Emotion, imagination, uncertainty, and the difference between intuition and projection.' },
  { name: 'The Sun', meaning: 'Visibility, vitality, confidence, and bringing an inner possibility into ordinary life.' },
  { name: 'Judgement', meaning: 'A call to become responsible for the person you keep saying you want to be.' },
  { name: 'The World', meaning: 'Completion, integration, and a new level of identity after an old cycle has run its course.' },
]

const ROLES = [
  ['THE SELF', 'Who you are becoming'],
  ['THE MIRROR', 'What is true about you right now'],
  ['THE SHADOW', 'What stands between you and the identity'],
  ['THE BINDING', 'What keeps the pattern alive'],
  ['THE PATH', 'What needs to be developed next'],
] as const

const QUESTIONS = [
  {
    key: 'desiredIdentity',
    title: 'WHO ARE YOU BECOMING?',
    sub: 'Name the identity you actually want to inhabit.',
    type: 'text',
    placeholder: 'Someone who creates without fear, speaks up, and trusts their own timing...',
  },
  {
    key: 'identityGap',
    title: 'HOW CLOSE DO YOU FEEL TO THEM?',
    sub: '1 means very far away. 10 means you already feel like this person most of the time.',
    type: 'scale',
  },
  {
    key: 'obstacle',
    title: 'WHAT USUALLY GETS IN THE WAY?',
    sub: 'Pick the answer that feels most familiar.',
    type: 'obstacle',
    options: [
      'I lose momentum.',
      'I get distracted.',
      'I start doubting myself.',
      'I get pulled back by other people.',
      'I become afraid of what might change.',
      'I fall back into old habits.',
      'I don’t know what is stopping me.',
      'I actually move forward.',
    ],
  },
  {
    key: 'energyDestinations',
    title: 'WHERE DOES YOUR STRONGEST ENERGY GO?',
    sub: 'Choose up to two.',
    type: 'multi',
    options: [
      'Creation',
      'Work / ambition',
      'Love / relationships',
      'Sexuality / desire',
      'Spirituality',
      'Learning',
      'Exercise / body',
      'Entertainment / stimulation',
      'Worry / overthinking',
      'Nowhere — I feel drained',
    ],
  },
  {
    key: 'energyResponse',
    title: 'WHEN YOU FEEL A STRONG SURGE OF ENERGY, WHAT DO YOU DO WITH IT?',
    sub: 'There is no correct answer.',
    type: 'single',
    options: [
      'Create',
      'Work',
      'Pursue something',
      'Connect with someone',
      'Exercise',
      'Pursue sexual desire',
      'Seek stimulation',
      'Suppress it',
      'It becomes scattered',
      'I don’t know',
    ],
  },
  {
    key: 'transformationCost',
    title: 'IF YOU ACTUALLY BECAME THIS PERSON, WHAT MIGHT YOU HAVE TO LEAVE BEHIND?',
    sub: 'Choose what feels most costly.',
    type: 'single',
    options: [
      'An old version of myself',
      'Certain relationships',
      'My family’s expectations',
      'My current environment',
      'Comfort',
      'Security',
      'Old habits',
      'Nothing — I’m ready',
      'I don’t know',
    ],
  },
] as const

const ADAPTIVE: Record<Pattern, { title: string; sub: string; type: 'scale' | 'single' | 'text'; options?: string[]; placeholder?: string }> = {
  identity_vacuum: {
    title: 'HOW MUCH OF YOUR CURRENT IDENTITY FEELS CHOSEN BY YOU?',
    sub: '1 means mostly inherited or performed. 10 means deeply self-authored.',
    type: 'scale',
  },
  soul_bind: {
    title: 'WHO OR WHAT HAS THE STRONGEST INFLUENCE OVER THE PERSON YOU’RE ALLOWED TO BE?',
    sub: 'Pick the strongest influence.',
    type: 'single',
    options: ['Family', 'Partner', 'Friends', 'Career', 'Culture', 'Money', 'Environment', 'My past', 'Something else'],
  },
  inaction_scattered_energy: {
    title: 'WHAT’S THE THING YOU KEEP SAYING YOU’LL DO, BUT HAVEN’T CONSISTENTLY DONE?',
    sub: 'Be concrete. A real thing is more useful than a philosophical answer.',
    type: 'text',
    placeholder: 'I keep saying I’ll...',
  },
  self_criticism: {
    title: 'WHAT DO YOU SAY TO YOURSELF WHEN YOU FALL SHORT OF YOUR OWN EXPECTATIONS?',
    sub: 'Write the sentence you actually hear in your head.',
    type: 'text',
    placeholder: 'I usually tell myself...',
  },
  false_beliefs: {
    title: 'WHAT’S THE BIGGEST THING YOU SECRETLY WONDER MIGHT BE IMPOSSIBLE FOR YOU?',
    sub: 'Say the thing you normally keep vague.',
    type: 'text',
    placeholder: 'I’m not sure I can...',
  },
  energy_leakage: {
    title: 'WHERE DO YOU NOTICE YOUR ENERGY DISAPPEARING MOST OFTEN?',
    sub: 'Choose the closest answer.',
    type: 'single',
    options: ['Scrolling / stimulation', 'Unhealthy habits', 'Relationships', 'Work', 'Sexual fixation', 'Worry', 'Grief / the past', 'Something else'],
  },
  melancholy: {
    title: 'WHEN DID YOU BEGIN FEELING DISCONNECTED FROM THE PERSON YOU COULD BECOME?',
    sub: 'A period, event, or rough age is enough.',
    type: 'text',
    placeholder: 'Around the time...',
  },
  sexual_alchemy: {
    title: 'DO YOU FEEL LIKE YOU HAVE MORE ENERGY, DESIRE, OR CREATIVE FORCE THAN YOUR CURRENT LIFE HAS SOMEWHERE TO PUT?',
    sub: 'This helps distinguish desire itself from what happens after the desire appears.',
    type: 'single',
    options: ['Strongly yes', 'Somewhat', 'Not really', 'No'],
  },
}

const SCENARIOS: Record<string, Partial<Diagnostic> & { pattern: Pattern }> = {
  'Identity Vacuum': {
    pattern: 'identity_vacuum',
    desiredIdentity: 'Someone who creates boldly without performing for other people.',
    identityGap: 4,
    obstacle: 'I don’t know what is stopping me.',
    energyDestinations: ['Creation', 'Worry / overthinking'],
    energyResponse: 'It becomes scattered',
    transformationCost: 'My family’s expectations',
    adaptiveAnswer: '3',
  },
  'Soul Bind': {
    pattern: 'soul_bind',
    desiredIdentity: 'Someone who builds a life that actually belongs to them.',
    identityGap: 5,
    obstacle: 'I get pulled back by other people.',
    energyDestinations: ['Love / relationships', 'Work / ambition'],
    energyResponse: 'Connect with someone',
    transformationCost: 'Certain relationships',
    adaptiveAnswer: 'Family',
  },
  'Inaction / Scattered': {
    pattern: 'inaction_scattered_energy',
    desiredIdentity: 'Someone who finishes the work I keep saying I’m going to do.',
    identityGap: 4,
    obstacle: 'I lose momentum.',
    energyDestinations: ['Work / ambition', 'Entertainment / stimulation'],
    energyResponse: 'It becomes scattered',
    transformationCost: 'Comfort',
    adaptiveAnswer: 'Launch the project I’ve been talking about.',
  },
  'Self-Criticism': {
    pattern: 'self_criticism',
    desiredIdentity: 'Someone who can create publicly without tearing myself apart.',
    identityGap: 5,
    obstacle: 'I start doubting myself.',
    energyDestinations: ['Creation', 'Worry / overthinking'],
    energyResponse: 'Suppress it',
    transformationCost: 'An old version of myself',
    adaptiveAnswer: 'I tell myself I’m behind and everyone can see it.',
  },
  'False Beliefs': {
    pattern: 'false_beliefs',
    desiredIdentity: 'Someone who makes a living from work that feels genuinely mine.',
    identityGap: 3,
    obstacle: 'I become afraid of what might change.',
    energyDestinations: ['Work / ambition', 'Worry / overthinking'],
    energyResponse: 'Suppress it',
    transformationCost: 'Security',
    adaptiveAnswer: 'I might never be able to make enough money doing my own thing.',
  },
  'Energy Leakage': {
    pattern: 'energy_leakage',
    desiredIdentity: 'Someone whose energy consistently goes into building something real.',
    identityGap: 4,
    obstacle: 'I fall back into old habits.',
    energyDestinations: ['Entertainment / stimulation', 'Sexuality / desire'],
    energyResponse: 'Seek stimulation',
    transformationCost: 'Old habits',
    adaptiveAnswer: 'Scrolling / stimulation',
  },
  'Melancholy': {
    pattern: 'melancholy',
    desiredIdentity: 'Someone who feels alive and connected to what I’m here to do.',
    identityGap: 3,
    obstacle: 'I don’t know what is stopping me.',
    energyDestinations: ['Nowhere — I feel drained', 'Spirituality'],
    energyResponse: 'I don’t know',
    transformationCost: 'My current environment',
    adaptiveAnswer: 'After a period when I stopped believing things would change.',
  },
  'Sexual Alchemy': {
    pattern: 'sexual_alchemy',
    desiredIdentity: 'Someone who can direct intense desire into creation and pursuit.',
    identityGap: 5,
    obstacle: 'I fall back into old habits.',
    energyDestinations: ['Sexuality / desire', 'Creation'],
    energyResponse: 'Pursue sexual desire',
    transformationCost: 'Old habits',
    adaptiveAnswer: 'Strongly yes',
  },
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function drawTarot(): TarotCard[] {
  return shuffle(CARDS).slice(0, 5)
}

function derivePattern(d: Diagnostic): { primary: Pattern; secondary: Pattern } {
  const scores: Record<Pattern, number> = {
    identity_vacuum: 0,
    soul_bind: 0,
    inaction_scattered_energy: 0,
    self_criticism: 0,
    false_beliefs: 0,
    energy_leakage: 0,
    melancholy: 0,
    sexual_alchemy: 0,
  }

  if (d.obstacle === 'I don’t know what is stopping me.') scores.identity_vacuum += 4
  if (d.obstacle === 'I get pulled back by other people.') scores.soul_bind += 5
  if (d.obstacle === 'I lose momentum.' || d.obstacle === 'I get distracted.') scores.inaction_scattered_energy += 5
  if (d.obstacle === 'I start doubting myself.') scores.self_criticism += 5
  if (d.obstacle === 'I become afraid of what might change.') scores.false_beliefs += 4
  if (d.obstacle === 'I fall back into old habits.') scores.energy_leakage += 4
  if (d.obstacle === 'I actually move forward.') scores.inaction_scattered_energy -= 2

  if (d.energyDestinations.includes('Worry / overthinking')) {
    scores.self_criticism += 2
    scores.false_beliefs += 2
  }
  if (d.energyDestinations.includes('Entertainment / stimulation')) scores.energy_leakage += 3
  if (d.energyDestinations.includes('Sexuality / desire')) scores.sexual_alchemy += 3
  if (d.energyDestinations.includes('Nowhere — I feel drained')) scores.melancholy += 4
  if (d.energyResponse === 'It becomes scattered') scores.inaction_scattered_energy += 3
  if (d.energyResponse === 'Suppress it') {
    scores.energy_leakage += 2
    scores.self_criticism += 1
  }
  if (d.energyResponse === 'Pursue sexual desire') scores.sexual_alchemy += 4
  if (d.transformationCost === 'Certain relationships' || d.transformationCost === 'My family’s expectations') scores.soul_bind += 3
  if (d.transformationCost === 'Security') scores.false_beliefs += 2
  if (d.transformationCost === 'Old habits') scores.energy_leakage += 3

  const ranked = (Object.keys(scores) as Pattern[]).sort((a, b) => scores[b] - scores[a])
  return { primary: ranked[0]!, secondary: ranked[1]! }
}

function makeKnifeTwist(pattern: Pattern, d: Diagnostic): string {
  const identity = d.desiredIdentity || 'the person you said you want to become'

  switch (pattern) {
    case 'identity_vacuum':
      return `The danger isn't that you don't have an identity. It's that you'll keep becoming whatever the room rewards until ${identity.toLowerCase()} feels like a stranger. Every time you perform a version of yourself that you don't actually choose, you make the real version harder to hear.`
    case 'soul_bind':
      return `The hard part is that changing may disappoint people who are comfortable with the version of you they already know. If protecting those relationships keeps deciding what you're allowed to become, then the relationship is quietly choosing your identity for you.`
    case 'inaction_scattered_energy':
      return `Every day you say you'll do it and then don't, you're rehearsing a different identity: the person who talks about the thing instead of becoming the person who does it. That rehearsal adds up.`
    case 'self_criticism':
      return `If every imperfect attempt becomes evidence that you're not good enough, eventually you'll stop giving yourself enough attempts to become good. The criticism starts looking like standards. It becomes avoidance wearing a respectable outfit.`
    case 'false_beliefs':
      return `The dangerous part is how reasonable the limitation can sound. You don't have to believe your dream is impossible. You only have to keep treating the conditions required for it as unrealistic until you stop testing them.`
    case 'energy_leakage':
      return `You already have energy. The question is where your strongest hours keep going. If your most powerful impulses repeatedly end in stimulation, avoidance, or habits that don't build the life you want, then the leak is shaping your identity whether you mean it to or not.`
    case 'melancholy':
      return `When you've been disconnected for long enough, numbness can start masquerading as personality. You may stop expecting yourself to want much because wanting something would force you to confront how far away it feels.`
    case 'sexual_alchemy':
      return `The problem isn't that you have intense desire. It's that intense desire can become the strongest current in the room. If it keeps choosing the destination for you, then your energy is being directed before your will gets a vote.`
  }
}

function makeReading(d: Diagnostic, cards: TarotCard[], primary: Pattern): string {
  const [self, mirror, shadow, binding, path] = cards
  const p = PATTERN_NAMES[primary]
  return `You already have a surprisingly clear picture of ${d.desiredIdentity}. ${self.name} in The Self position reinforces that there's something real here — you're not inventing the desire out of nowhere. But ${mirror.name} shows the current version of you still carrying ${mirror.meaning.toLowerCase()}.

The center of the reading is ${shadow.name}. That's where the friction lives. Your answers point most strongly toward ${p}. ${binding.name} adds another layer: ${binding.meaning.toLowerCase()}.

And then ${path.name} appears in The Path. ${path.meaning} The next move isn't to become a completely different person overnight. It's to give the identity you've named somewhere concrete to exist.`
}

function recommendation(primary: Pattern, readiness: string, income: string) {
  const high = readiness === 'I’m all in' || readiness === 'I’m committed'
  const lowIncome = income === 'Under $25,000' || income === '$25,000–$49,999'

  if (primary === 'sexual_alchemy' && high && !lowIncome) {
    return {
      product: 'Sexual Alchemy',
      price: '$444',
      eyebrow: 'YOUR DEEPER PRACTICE',
      copy: 'Your reading points toward a deeper question: what happens when your strongest current is deliberately given a destination? Sexual Alchemy is the advanced practice for working with desire, direction, and creative force.',
    }
  }

  if (
    (primary === 'identity_vacuum' ||
      primary === 'soul_bind' ||
      primary === 'inaction_scattered_energy' ||
      primary === 'self_criticism' ||
      primary === 'false_beliefs' ||
      primary === 'energy_leakage' ||
      primary === 'melancholy') &&
    high &&
    !lowIncome
  ) {
    return {
      product: 'The Magician’s Initiation',
      price: '$33',
      eyebrow: 'YOUR NEXT STEP',
      copy: `Your reading points to ${PATTERN_NAMES[primary]}. The next useful move is to work directly with that pattern rather than collecting more insight. The Magician’s Initiation gives you a structured system for identity, thought, action, and momentum.`,
    }
  }

  return {
    product: 'Identity Reset Meditation',
    price: '$8.88',
    eyebrow: 'YOUR STARTING POINT',
    copy: `You don't need to force the whole transformation at once. Start by working directly with the pattern your reading revealed. This guided meditation gives you a practical place to begin and can be revisited as you keep working.`,
  }
}

function TestDraw() {
  const [screen, setScreen] = useState<'intro' | 'question' | 'reading'>('intro')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [adaptivePattern, setAdaptivePattern] = useState<Pattern | null>(null)
  const [answers, setAnswers] = useState<Diagnostic>({
    desiredIdentity: '',
    identityGap: 5,
    obstacle: '',
    energyDestinations: [],
    energyResponse: '',
    transformationCost: '',
    adaptiveAnswer: '',
  })
  const [adaptiveValue, setAdaptiveValue] = useState('')
  const [result, setResult] = useState<ReadingState | null>(null)
  const [readiness, setReadiness] = useState('')
  const [income, setIncome] = useState('')
  const [showControls, setShowControls] = useState(true)

  const question = QUESTIONS[questionIndex]
  const currentValue = question
    ? question.key === 'desiredIdentity'
      ? answers.desiredIdentity
      : question.key === 'identityGap'
        ? String(answers.identityGap)
        : question.key === 'obstacle'
          ? answers.obstacle
          : question.key === 'energyDestinations'
            ? answers.energyDestinations
            : question.key === 'energyResponse'
              ? answers.energyResponse
              : answers.transformationCost
    : ''

  function reset() {
    setScreen('intro')
    setQuestionIndex(0)
    setAdaptivePattern(null)
    setAdaptiveValue('')
    setResult(null)
    setReadiness('')
    setIncome('')
    setAnswers({
      desiredIdentity: '',
      identityGap: 5,
      obstacle: '',
      energyDestinations: [],
      energyResponse: '',
      transformationCost: '',
      adaptiveAnswer: '',
    })
  }

  function start() {
    setScreen('question')
    setQuestionIndex(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function answerQuestion(value: string | string[] | number) {
    const next = { ...answers }
    if (question.key === 'desiredIdentity') next.desiredIdentity = String(value)
    if (question.key === 'identityGap') next.identityGap = Number(value)
    if (question.key === 'obstacle') next.obstacle = String(value)
    if (question.key === 'energyDestinations') next.energyDestinations = value as string[]
    if (question.key === 'energyResponse') next.energyResponse = String(value)
    if (question.key === 'transformationCost') next.transformationCost = String(value)
    setAnswers(next)
  }

  function continueQuestion() {
    if (!question) return
    const value = question.key === 'desiredIdentity'
      ? answers.desiredIdentity.trim()
      : question.key === 'identityGap'
        ? answers.identityGap
        : currentValue

    if (!value || (Array.isArray(value) && value.length === 0)) return

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1)
      return
    }

    const provisional = derivePattern(answers)
    setAdaptivePattern(provisional.primary)
    setAdaptiveValue('')
  }

  function finishAdaptive() {
    if (!adaptivePattern || !adaptiveValue.trim()) return

    const finalAnswers = { ...answers, adaptiveAnswer: adaptiveValue }
    const finalPattern = derivePattern(finalAnswers)

    // Scenario loading intentionally remains possible through the test controls.
    const cards = drawTarot()
    const next: ReadingState = {
      ...finalAnswers,
      cards,
      primary: finalPattern.primary,
      secondary: finalPattern.secondary,
      knifeTwist: makeKnifeTwist(finalPattern.primary, finalAnswers),
      reading: makeReading(finalAnswers, cards, finalPattern.primary),
    }

    setAnswers(finalAnswers)
    setResult(next)
    setScreen('reading')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function loadScenario(name: string) {
    const s = SCENARIOS[name]
    const base: Diagnostic = {
      desiredIdentity: s.desiredIdentity ?? 'Someone who becomes fully themselves.',
      identityGap: s.identityGap ?? 5,
      obstacle: s.obstacle ?? 'I don’t know what is stopping me.',
      energyDestinations: s.energyDestinations ?? ['Creation'],
      energyResponse: s.energyResponse ?? 'Create',
      transformationCost: s.transformationCost ?? 'An old version of myself',
      adaptiveAnswer: s.adaptiveAnswer ?? 'Yes.',
    }
    const cards = drawTarot()
    const next: ReadingState = {
      ...base,
      cards,
      primary: s.pattern,
      secondary: derivePattern(base).secondary,
      knifeTwist: makeKnifeTwist(s.pattern, base),
      reading: makeReading(base, cards, s.pattern),
    }
    setAnswers(base)
    setResult(next)
    setReadiness('')
    setIncome('')
    setScreen('reading')
    setShowControls(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const rec = result && readiness && income
    ? recommendation(result.primary, readiness, income)
    : null

  const adaptive = adaptivePattern ? ADAPTIVE[adaptivePattern] : null

  return (
    <div className="draw-test">
      <style>{CSS}</style>

      <header className="test-nav">
        <div className="brand">THE MAGICIAN’S PATH</div>
        <div className="nav-actions">
          <button className="ghost-btn" onClick={reset}>Reset</button>
          <button className="ghost-btn" onClick={() => setShowControls(v => !v)}>
            {showControls ? 'Hide Test Controls' : 'Test Controls'}
          </button>
        </div>
      </header>

      {showControls && (
        <aside className="test-controls">
          <div>
            <strong>TEST MODE</strong>
            <span>Jump directly to any diagnostic path.</span>
          </div>
          <div className="scenario-grid">
            {Object.keys(SCENARIOS).map(name => (
              <button key={name} onClick={() => loadScenario(name)}>{name}</button>
            ))}
          </div>
          <div className="control-note">
            These presets bypass the questionnaire intentionally so you can test the
            reading → knife twist → seriousness → income → recommendation logic quickly.
          </div>
        </aside>
      )}

      <main>
        {screen === 'intro' && (
          <section className="hero">
            <p className="eyebrow">THE MAGICIAN’S PATH · TEST EXPERIENCE</p>
            <h1>There’s a reason you haven’t become them yet.</h1>
            <p className="lead">
              This is the complete new diagnostic experience. The questionnaire is
              screen-by-screen. The reading, diagnosis, knife twist, seriousness,
              and income questions live together on one page.
            </p>
            <button className="primary-btn" onClick={start}>Begin My Reading</button>
            <p className="micro">7 short questions · one personalized reading · no payment in test mode</p>
          </section>
        )}

        {screen === 'question' && (
          <section className="question-shell">
            <div className="progress">
              <span>QUESTION {questionIndex + 1} OF {QUESTIONS.length}</span>
              <div><i style={{ width: `${((questionIndex + 1) / QUESTIONS.length) * 100}%` }} /></div>
            </div>

            <div className="question-card">
              <p className="eyebrow">THE DIAGNOSTIC</p>
              <h1>{question.title}</h1>
              <p className="question-sub">{question.sub}</p>

              {question.type === 'text' && (
                <textarea
                  autoFocus
                  value={answers.desiredIdentity}
                  onChange={e => answerQuestion(e.target.value)}
                  placeholder={question.placeholder}
                />
              )}

              {question.type === 'scale' && (
                <div className="scale">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      className={answers.identityGap === n ? 'selected' : ''}
                      onClick={() => answerQuestion(n)}
                    >{n}</button>
                  ))}
                  <div className="scale-labels"><span>Very far away</span><span>Already becoming them</span></div>
                </div>
              )}

              {(question.type === 'obstacle' || question.type === 'single') && (
                <div className="options">
                  {question.options!.map(option => (
                    <button
                      key={option}
                      className={String(currentValue) === option ? 'selected option' : 'option'}
                      onClick={() => answerQuestion(option)}
                    >
                      <span className="radio" />
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {question.type === 'multi' && (
                <div className="options">
                  {question.options!.map(option => {
                    const selected = answers.energyDestinations.includes(option)
                    return (
                      <button
                        key={option}
                        className={selected ? 'selected option' : 'option'}
                        onClick={() => {
                          const next = selected
                            ? answers.energyDestinations.filter(x => x !== option)
                            : answers.energyDestinations.length < 2
                              ? [...answers.energyDestinations, option]
                              : answers.energyDestinations
                          answerQuestion(next)
                        }}
                      >
                        <span className="check">{selected ? '✓' : ''}</span>
                        {option}
                      </button>
                    )
                  })}
                </div>
              )}

              <button
                className="primary-btn"
                disabled={!currentValue || (Array.isArray(currentValue) && currentValue.length === 0)}
                onClick={continueQuestion}
              >
                {questionIndex === QUESTIONS.length - 1 ? 'Continue' : 'Next'}
              </button>

              {questionIndex > 0 && (
                <button className="text-btn" onClick={() => setQuestionIndex(i => i - 1)}>Back</button>
              )}
            </div>
          </section>
        )}

        {screen === 'question' && adaptive && (
          <div className="adaptive-overlay">
            <div className="adaptive-card">
              <p className="eyebrow">ONE LAST QUESTION</p>
              <h1>{adaptive.title}</h1>
              <p className="question-sub">{adaptive.sub}</p>

              {adaptive.type === 'scale' && (
                <div className="scale">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button key={n} className={adaptiveValue === String(n) ? 'selected' : ''} onClick={() => setAdaptiveValue(String(n))}>{n}</button>
                  ))}
                </div>
              )}

              {adaptive.type === 'text' && (
                <textarea autoFocus value={adaptiveValue} onChange={e => setAdaptiveValue(e.target.value)} placeholder={adaptive.placeholder} />
              )}

              {adaptive.type === 'single' && (
                <div className="options">
                  {adaptive.options!.map(option => (
                    <button key={option} className={adaptiveValue === option ? 'selected option' : 'option'} onClick={() => setAdaptiveValue(option)}>
                      <span className="radio" />{option}
                    </button>
                  ))}
                </div>
              )}

              <button className="primary-btn" disabled={!adaptiveValue.trim()} onClick={finishAdaptive}>
                Reveal My Reading
              </button>
            </div>
          </div>
        )}

        {screen === 'reading' && result && (
          <section className="reading-page">
            <div className="reading-top">
              <p className="eyebrow">THE MAGICIAN’S PATH · YOUR READING</p>
              <h1>Your Reading</h1>
              <p className="label">THE IDENTITY YOU’RE STEPPING INTO</p>
              <p className="identity">“{result.desiredIdentity}”</p>
            </div>

            <div className="divider">◯</div>

            <div className="cards">
              {result.cards.map((card, i) => (
                <article className="tarot-card" key={`${card.name}-${i}`}>
                  <div className="card-role">CARD {['I','II','III','IV','V'][i]} · {ROLES[i][0]}</div>
                  <h3>{ROLES[i][1]}</h3>
                  <div className="card-face">
                    <span>{['I','II','III','IV','V'][i]}</span>
                    <b>{card.name}</b>
                  </div>
                  <p>{card.meaning}</p>
                </article>
              ))}
            </div>

            <div className="divider">◯</div>

            <div className="reading-section">
              <p className="label">WHAT’S ACTUALLY STANDING IN YOUR WAY</p>
              <div className="block-name">{PATTERN_NAMES[result.primary]}</div>
              <p className="reading-copy">{result.reading}</p>
            </div>

            <div className="divider">◯</div>

            <div className="gap-box">
              <p className="label">THE GAP</p>
              <div className="gap-flow">
                <span>Current Identity</span>
                <b>↓</b>
                <strong>{PATTERN_NAMES[result.primary]}</strong>
                <b>↓</b>
                <span>Desired Identity</span>
              </div>
            </div>

            <div className="divider">◯</div>

            <div className="knife">
              <p className="eyebrow">THE PART YOU PROBABLY DON’T WANT TO HEAR</p>
              <h2>Here’s what happens if this pattern stays in charge.</h2>
              <p>{result.knifeTwist}</p>
            </div>

            <div className="divider">◯</div>

            <div className="decision">
              <p className="eyebrow">NOW THE REAL QUESTION</p>
              <h2>What do you actually want to do with this?</h2>
              <p className="question-sub">This determines how deeply you want to work with what you just saw.</p>

              <div className="options">
                {[
                  ['I’m curious', 'I mostly wanted to understand myself.'],
                  ['I’m ready to change', 'I want something practical to work on.'],
                  ['I’m committed', 'I’m ready to seriously work on this pattern.'],
                  ['I’m all in', 'I’m ready for deeper transformation.'],
                ].map(([title, sub]) => (
                  <button
                    key={title}
                    className={readiness === title ? 'selected decision-option' : 'decision-option'}
                    onClick={() => setReadiness(title)}
                  >
                    <span><b>{title}</b><small>{sub}</small></span>
                  </button>
                ))}
              </div>

              {readiness && (
                <div className="income-step">
                  <p className="eyebrow">ONE LAST QUESTION</p>
                  <h2>What’s your approximate annual personal income?</h2>
                  <p className="question-sub">This helps us make sure the next step we show you is actually accessible.</p>
                  <div className="options">
                    {[
                      'Under $25,000',
                      '$25,000–$49,999',
                      '$50,000–$74,999',
                      '$75,000–$99,999',
                      '$100,000–$149,999',
                      '$150,000–$249,999',
                      '$250,000+',
                    ].map(option => (
                      <button key={option} className={income === option ? 'selected option' : 'option'} onClick={() => setIncome(option)}>
                        <span className="radio" />{option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {rec && (
              <>
                <div className="divider">◯</div>
                <div className="recommendation">
                  <p className="eyebrow">{rec.eyebrow}</p>
                  <h2>{rec.product}</h2>
                  <p>{rec.copy}</p>
                  <div className="recommendation-test">
                    <span>TEST RECOMMENDATION</span>
                    <b>{rec.product}</b>
                    <strong>{rec.price}</strong>
                  </div>
                  <button className="primary-btn" onClick={() => alert(`TEST ONLY — route to ${rec.product}`)}>
                    See My Next Step
                  </button>
                  <p className="micro">In production, this button becomes the appropriate product/checkout action.</p>
                </div>
              </>
            )}

            <button className="restart" onClick={reset}>Start another reading</button>
          </section>
        )}
      </main>
    </div>
  )
}

const CSS = `
:root {
  --ink:#171717;
  --muted:#686868;
  --paper:#f7f5f0;
  --line:#ddd8cf;
  --accent:#0d9488;
  --white:#fffdf9;
}
* { box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { margin:0; background:var(--paper); color:var(--ink); }
button, textarea { font:inherit; }
button { cursor:pointer; }
.draw-test { min-height:100vh; font-family:"EB Garamond", Georgia, serif; }
.test-nav { height:68px; display:flex; justify-content:space-between; align-items:center; padding:0 28px; border-bottom:1px solid var(--line); background:rgba(247,245,240,.96); position:sticky; top:0; z-index:20; backdrop-filter:blur(12px); }
.brand, .eyebrow, .label, .card-role { font-family:Cinzel, Georgia, serif; letter-spacing:.13em; }
.brand { font-size:12px; }
.nav-actions { display:flex; gap:8px; }
.ghost-btn { border:1px solid var(--line); background:transparent; border-radius:999px; padding:9px 13px; font-size:12px; }
.test-controls { max-width:1120px; margin:18px auto 0; padding:16px; border:1px dashed #aaa39a; border-radius:14px; background:#fffdf9; display:flex; gap:18px; align-items:flex-start; flex-wrap:wrap; font-family:system-ui,sans-serif; }
.test-controls strong { display:block; font-size:11px; letter-spacing:.12em; }
.test-controls span,.control-note { color:#666; font-size:12px; }
.scenario-grid { display:flex; flex-wrap:wrap; gap:7px; flex:1; }
.scenario-grid button { border:1px solid #d6d0c7; background:#f5f2ec; border-radius:999px; padding:8px 11px; font-size:12px; }
.control-note { width:100%; padding-top:4px; }
.hero { max-width:800px; min-height:calc(100vh - 68px); margin:auto; padding:14vh 24px 10vh; text-align:center; display:flex; flex-direction:column; align-items:center; }
.eyebrow { font-size:11px; color:#777; margin:0 0 18px; }
.hero h1,.question-card h1,.adaptive-card h1,.reading-top h1 { font-size:clamp(40px,6vw,72px); line-height:.98; font-weight:500; margin:0 0 24px; }
.lead { font-size:21px; line-height:1.5; color:#555; max-width:650px; margin:0 auto 34px; }
.micro { color:#888; font:12px/1.5 system-ui,sans-serif; margin-top:14px; }
.primary-btn { border:0; background:var(--ink); color:white; border-radius:999px; padding:15px 25px; min-width:210px; font-family:system-ui,sans-serif; font-size:13px; font-weight:600; }
.primary-btn:disabled { opacity:.35; cursor:not-allowed; }
.question-shell { max-width:780px; margin:auto; padding:54px 24px 100px; min-height:calc(100vh - 68px); }
.progress { font:11px system-ui,sans-serif; color:#777; letter-spacing:.1em; margin-bottom:50px; }
.progress div { height:2px; background:#ded9d1; margin-top:12px; }
.progress i { display:block; height:100%; background:var(--ink); transition:width .3s; }
.question-card { background:var(--white); border:1px solid var(--line); border-radius:18px; padding:clamp(28px,6vw,64px); }
.question-sub { color:#686868; font-size:18px; line-height:1.45; margin:0 0 28px; }
textarea { width:100%; min-height:150px; resize:vertical; border:1px solid #cbc5bb; background:#faf8f3; border-radius:12px; padding:16px; font-size:19px; outline:none; }
textarea:focus { border-color:#888; }
.options { display:flex; flex-direction:column; gap:9px; margin-bottom:28px; }
.option,.decision-option { width:100%; text-align:left; border:1px solid #d5d0c8; background:#faf8f3; border-radius:11px; padding:15px 16px; display:flex; align-items:center; gap:12px; transition:.15s; }
.option:hover,.decision-option:hover { border-color:#888; transform:translateY(-1px); }
.option.selected,.decision-option.selected { border-color:var(--ink); background:#eeece6; }
.radio { width:16px; height:16px; border:1px solid #999; border-radius:50%; flex:0 0 auto; }
.selected .radio { box-shadow:inset 0 0 0 4px #eeece6; background:var(--ink); border-color:var(--ink); }
.check { width:16px; height:16px; border:1px solid #999; border-radius:4px; display:grid; place-items:center; font:12px system-ui; }
.selected .check { background:var(--ink); color:white; border-color:var(--ink); }
.scale { display:grid; grid-template-columns:repeat(10,1fr); gap:7px; margin:32px 0 34px; }
.scale button { aspect-ratio:1; border:1px solid #d2ccc2; background:#faf8f3; border-radius:9px; }
.scale button.selected { background:var(--ink); color:white; border-color:var(--ink); }
.scale-labels { grid-column:1/-1; display:flex; justify-content:space-between; color:#888; font:11px system-ui,sans-serif; }
.text-btn { display:block; border:0; background:transparent; color:#777; margin:16px auto 0; font:12px system-ui,sans-serif; }
.adaptive-overlay { position:fixed; inset:0; z-index:50; background:rgba(20,20,20,.5); backdrop-filter:blur(5px); overflow:auto; padding:40px 20px; }
.adaptive-card { max-width:720px; margin:6vh auto; background:var(--white); border-radius:20px; padding:clamp(28px,6vw,60px); box-shadow:0 25px 80px rgba(0,0,0,.2); }
.reading-page { max-width:1120px; margin:auto; padding:80px 24px 100px; }
.reading-top { max-width:800px; margin:0 auto; text-align:center; }
.reading-top h1 { font-size:58px; }
.label { font-size:10px; color:#777; }
.identity { font-size:24px; line-height:1.35; max-width:720px; margin:12px auto; }
.divider { text-align:center; color:#aaa39a; padding:60px 0; font-size:22px; }
.cards { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; }
.tarot-card { border-top:1px solid #aaa39a; padding-top:16px; }
.card-role { color:#777; font-size:9px; }
.tarot-card h3 { font-size:18px; font-weight:500; min-height:48px; }
.card-face { min-height:230px; border:1px solid #aaa39a; background:#f1eee7; display:flex; flex-direction:column; align-items:center; justify-content:space-between; padding:14px; text-align:center; }
.card-face span { align-self:flex-start; font:11px system-ui,sans-serif; }
.card-face b { font:500 21px/1.1 "EB Garamond",Georgia,serif; }
.tarot-card > p { color:#666; font-size:15px; line-height:1.4; }
.reading-section,.gap-box,.decision,.recommendation,.knife { max-width:800px; margin:auto; }
.block-name { font-size:42px; margin:10px 0 24px; }
.reading-copy { font-size:20px; line-height:1.62; white-space:pre-line; }
.gap-box { text-align:center; }
.gap-flow { display:flex; align-items:center; justify-content:center; gap:18px; flex-wrap:wrap; margin-top:28px; }
.gap-flow span,.gap-flow strong { border:1px solid var(--line); border-radius:999px; padding:12px 18px; background:#fffdf9; }
.gap-flow strong { border-color:#999; }
.gap-flow b { color:#999; }
.knife { background:#191919; color:#f7f5f0; padding:clamp(28px,6vw,56px); border-radius:18px; }
.knife .eyebrow { color:#aaa; }
.knife h2 { font-size:38px; line-height:1.05; font-weight:500; margin:0 0 20px; }
.knife p:last-child { font-size:20px; line-height:1.55; color:#ddd; }
.decision { text-align:center; }
.decision h2,.recommendation h2 { font-size:40px; font-weight:500; margin:0 0 12px; }
.decision .options { text-align:left; margin-top:30px; }
.decision-option { padding:17px; }
.decision-option small { display:block; color:#777; margin-top:4px; font-size:14px; }
.income-step { border-top:1px solid var(--line); margin-top:36px; padding-top:36px; text-align:left; }
.income-step h2 { font-size:31px; }
.recommendation { text-align:center; border:1px solid var(--line); border-radius:20px; padding:clamp(28px,6vw,60px); background:#fffdf9; }
.recommendation p { font-size:19px; line-height:1.5; color:#555; max-width:650px; margin:0 auto 24px; }
.recommendation-test { border-top:1px solid var(--line); border-bottom:1px solid var(--line); padding:18px 0; margin:24px auto 28px; display:flex; justify-content:center; gap:20px; align-items:center; font-family:system-ui,sans-serif; }
.recommendation-test span { font-size:9px; letter-spacing:.12em; color:#888; }
.recommendation-test b { font-size:14px; }
.recommendation-test strong { font-size:18px; }
.restart { display:block; margin:45px auto 0; border:0; background:transparent; text-decoration:underline; color:#666; font:13px system-ui,sans-serif; }
@media(max-width:800px) {
  .cards { grid-template-columns:1fr; }
  .tarot-card { display:grid; grid-template-columns:110px 1fr; gap:10px; }
  .tarot-card .card-role { grid-column:1/-1; }
  .tarot-card h3 { min-height:0; }
  .card-face { min-height:160px; grid-row:2/4; }
  .tarot-card > p { grid-column:2; }
  .reading-page { padding-top:45px; }
}
@media(max-width:600px) {
  .test-nav { padding:0 15px; }
  .brand { font-size:9px; }
  .ghost-btn { padding:8px 9px; }
  .hero h1,.question-card h1,.adaptive-card h1 { font-size:42px; }
  .lead { font-size:18px; }
  .scale { gap:4px; }
  .scale button { border-radius:6px; }
  .reading-top h1 { font-size:44px; }
  .identity { font-size:20px; }
  .knife h2,.decision h2,.recommendation h2 { font-size:31px; }
  .recommendation-test { flex-direction:column; gap:7px; }
}
`

export default TestDraw
