// Lesson curriculum. Each illustration is a self-contained SVG scene that reads
// left-to-right or top-to-bottom as a construction demo.

const svgStyle = `
  <style>
    .ink { stroke:#22211d; fill:none; stroke-width:2.2; stroke-linecap:round; stroke-linejoin:round; }
    .ink-thick { stroke:#22211d; fill:none; stroke-width:3.2; stroke-linecap:round; stroke-linejoin:round; }
    .guide { stroke:#c98b66; fill:none; stroke-width:1; stroke-dasharray:4 3; opacity:0.8; }
    .label { font: 11px system-ui, sans-serif; fill:#664a33; }
    .skin { fill:#f7d8bd; }
    .fill-soft { fill:#fde4cf; }
  </style>
`;

export const LESSONS = [
  // 1
  {
    title: 'Head shapes & proportions',
    summary: 'Before you exaggerate, you must feel the rules. Learn the classic head grid and the shape families.',
    illustration: `<svg viewBox="0 0 520 240" xmlns="http://www.w3.org/2000/svg">${svgStyle}
      <!-- oval head with grid -->
      <g transform="translate(20,20)">
        <ellipse cx="60" cy="90" rx="50" ry="65" class="skin" stroke="#22211d" stroke-width="2.2"/>
        <line x1="10" y1="90" x2="110" y2="90" class="guide"/>
        <line x1="60" y1="25" x2="60" y2="155" class="guide"/>
        <line x1="10" y1="115" x2="110" y2="115" class="guide"/>
        <line x1="10" y1="140" x2="110" y2="140" class="guide"/>
        <text x="115" y="92" class="label">eye line (½)</text>
        <text x="115" y="117" class="label">nose base</text>
        <text x="115" y="142" class="label">mouth</text>
      </g>
      <!-- shape family -->
      <g transform="translate(250,30)">
        <circle cx="30" cy="50" r="32" class="fill-soft" stroke="#22211d" stroke-width="2.2"/>
        <text x="4" y="100" class="label">round</text>
        <rect x="70" y="18" width="66" height="66" rx="8" class="fill-soft" stroke="#22211d" stroke-width="2.2"/>
        <text x="80" y="100" class="label">square</text>
        <polygon points="160,20 200,20 210,80 170,95 150,55" class="fill-soft" stroke="#22211d" stroke-width="2.2"/>
        <text x="158" y="110" class="label">diamond</text>
        <ellipse cx="260" cy="55" rx="20" ry="38" class="fill-soft" stroke="#22211d" stroke-width="2.2"/>
        <text x="240" y="110" class="label">oval</text>
      </g>
      <text x="260" y="190" class="label">every caricature begins by choosing a dominant head-shape family.</text>
    </svg>`,
    steps: [
      'Sketch an egg shape — wider at the top, narrower at the chin.',
      'Drop a vertical centerline to establish facial symmetry.',
      'Split the head in half horizontally — this is the eye line.',
      'Place the nose base roughly halfway between eyes and chin.',
      'Place the mouth one third of the distance from nose to chin.',
      'Ask: is this head round, square, diamond, oval, or long? Commit to one family.',
    ],
    principle: 'Caricaturists pick the shape that is already there in the subject — then push it further. A slightly round face becomes a circle; a slightly long face becomes a pear.',
  },

  // 2
  {
    title: 'Eyes',
    summary: 'The window of character. Learn shape, spacing, and how to stretch or squash them.',
    illustration: `<svg viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg">${svgStyle}
      <g transform="translate(20,30)">
        <!-- step 1: almond -->
        <path d="M0 50 Q30 20 60 50 Q30 80 0 50 Z" class="ink"/>
        <text x="0" y="100" class="label">1. almond</text>
        <!-- step 2: iris -->
        <g transform="translate(80,0)">
          <path d="M0 50 Q30 20 60 50 Q30 80 0 50 Z" class="ink"/>
          <circle cx="30" cy="50" r="13" class="ink"/>
          <text x="0" y="100" class="label">2. iris</text>
        </g>
        <!-- step 3: pupil + highlight -->
        <g transform="translate(160,0)">
          <path d="M0 50 Q30 20 60 50 Q30 80 0 50 Z" class="ink"/>
          <circle cx="30" cy="50" r="13" fill="#22211d"/>
          <circle cx="34" cy="46" r="3" fill="#fff"/>
          <text x="0" y="100" class="label">3. pupil + spark</text>
        </g>
        <!-- step 4: lashes + brow -->
        <g transform="translate(240,0)">
          <path d="M0 50 Q30 20 60 50 Q30 80 0 50 Z" class="ink"/>
          <circle cx="30" cy="50" r="13" fill="#22211d"/>
          <circle cx="34" cy="46" r="3" fill="#fff"/>
          <path d="M-3 40 L3 32 M8 32 L10 23 M20 28 L22 18 M35 28 L34 18" class="ink"/>
          <path d="M0 10 Q30 -2 60 10" class="ink-thick"/>
          <text x="0" y="100" class="label">4. lashes + brow</text>
        </g>
      </g>
      <!-- spacing rule -->
      <g transform="translate(20,140)">
        <line x1="0" y1="25" x2="380" y2="25" class="guide"/>
        <ellipse cx="60" cy="25" rx="26" ry="14" class="ink"/>
        <ellipse cx="190" cy="25" rx="26" ry="14" class="ink"/>
        <text x="60" y="60" class="label" text-anchor="middle">one eye's width between eyes</text>
      </g>
    </svg>`,
    steps: [
      'Start with an almond — two curves meeting in sharp corners.',
      'Drop in a circular iris that touches the top eyelid slightly.',
      'Fill most of the iris with a dark pupil; leave a tiny white spark for life.',
      'Add lashes as short angled flicks, not parallel hairs.',
      'Set the eyebrow one eye-height above, shaped to signal mood.',
      'Remember: one full eye-width fits between the two eyes.',
    ],
    principle: 'For a caricature, push eyes further apart, closer together, or wildly different in size. Uneven eyes read as cheeky, mischievous, alert.',
  },

  // 3
  {
    title: 'Nose',
    summary: 'Three planes, one ball. The nose is the best exaggeration target in the whole face.',
    illustration: `<svg viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg">${svgStyle}
      <g transform="translate(30,20)">
        <!-- step 1: triangle plane -->
        <path d="M30 10 L10 90 L50 90 Z" class="ink"/>
        <text x="10" y="110" class="label">1. wedge</text>
        <!-- step 2: ball -->
        <g transform="translate(80,0)">
          <path d="M30 10 L10 90 L50 90 Z" class="ink"/>
          <circle cx="30" cy="85" r="12" class="ink"/>
          <text x="8" y="110" class="label">2. ball of nose</text>
        </g>
        <!-- step 3: nostrils -->
        <g transform="translate(160,0)">
          <path d="M30 10 L10 90 L50 90 Z" class="ink"/>
          <circle cx="30" cy="85" r="12" class="ink"/>
          <path d="M18 88 Q22 95 27 91" class="ink"/>
          <path d="M33 91 Q38 95 42 88" class="ink"/>
          <text x="8" y="110" class="label">3. nostrils</text>
        </g>
        <!-- step 4: side shade -->
        <g transform="translate(240,0)">
          <path d="M30 10 L10 90 L50 90 Z" class="ink"/>
          <circle cx="30" cy="85" r="12" class="ink"/>
          <path d="M18 88 Q22 95 27 91" class="ink"/>
          <path d="M33 91 Q38 95 42 88" class="ink"/>
          <path d="M20 30 Q14 60 10 90" class="ink"/>
          <text x="8" y="110" class="label">4. side plane</text>
        </g>
      </g>
      <!-- nose types -->
      <g transform="translate(30,140)">
        <path d="M10 40 Q20 10 30 40" class="ink"/><text x="0" y="60" class="label">button</text>
        <path d="M80 40 Q100 5 115 40 L120 50" class="ink"/><text x="78" y="60" class="label">hook</text>
        <path d="M170 40 L195 10 L200 40" class="ink"/><text x="170" y="60" class="label">roman</text>
        <path d="M260 40 Q270 20 275 40 Q280 42 285 40" class="ink"/><text x="258" y="60" class="label">snub</text>
        <path d="M340 40 Q360 -5 385 40" class="ink-thick"/><text x="340" y="60" class="label">big / broad</text>
      </g>
    </svg>`,
    steps: [
      'Block in a wedge: two side-planes meeting at a front plane.',
      'Drop a small ball at the tip — this is what we actually see first.',
      'Add two comma-shaped nostrils tucked under the ball.',
      'Shade one side plane so the nose feels like a 3D prism, not a flat triangle.',
      'Identify its family: button, hook, roman, snub, or broad.',
    ],
    principle: 'When in doubt, make the nose bigger. A caricature nose can be 40% of the face and still feel right — it is the single most expressive feature.',
  },

  // 4
  {
    title: 'Mouth & lips',
    summary: 'A mouth is a curve, two cushions, and a shadow. Learn to land all three fast.',
    illustration: `<svg viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg">${svgStyle}
      <g transform="translate(20,20)">
        <path d="M0 40 Q40 20 80 40" class="ink"/>
        <text x="10" y="65" class="label">1. central seam</text>
        <g transform="translate(110,0)">
          <path d="M0 40 Q40 20 80 40" class="ink"/>
          <path d="M0 40 Q20 10 40 30 Q60 10 80 40" class="ink"/>
          <text x="10" y="65" class="label">2. upper cupid</text>
        </g>
        <g transform="translate(220,0)">
          <path d="M0 40 Q40 20 80 40" class="ink"/>
          <path d="M0 40 Q20 10 40 30 Q60 10 80 40" class="ink"/>
          <path d="M0 40 Q40 70 80 40" class="ink"/>
          <text x="10" y="65" class="label">3. lower lip</text>
        </g>
        <g transform="translate(330,0)">
          <path d="M0 40 Q40 20 80 40" class="ink-thick"/>
          <path d="M0 40 Q20 10 40 30 Q60 10 80 40" class="ink"/>
          <path d="M0 40 Q40 70 80 40" class="ink"/>
          <path d="M20 50 Q40 58 60 50" class="guide"/>
          <text x="10" y="65" class="label">4. shadow</text>
        </g>
      </g>
      <!-- expressions -->
      <g transform="translate(20,130)">
        <path d="M0 20 Q20 40 40 20" class="ink-thick"/><text x="5" y="55" class="label">smile</text>
        <path d="M80 40 Q100 20 120 40" class="ink-thick"/><text x="80" y="55" class="label">frown</text>
        <path d="M160 30 L200 30" class="ink-thick"/><text x="160" y="55" class="label">flat</text>
        <path d="M240 20 Q260 50 280 20 Q270 35 260 32 Q250 35 240 20 Z" class="ink-thick" fill="#f7d8bd"/>
        <text x="243" y="55" class="label">open</text>
        <path d="M320 30 Q325 25 330 30 Q340 40 360 30 Q365 25 370 30" class="ink"/><text x="325" y="55" class="label">smirk</text>
      </g>
    </svg>`,
    steps: [
      'Draw the central seam first — a gently wavy horizontal line.',
      'Above, draw the upper lip with two small cushions meeting in a cupid\'s-bow dip.',
      'Below, draw the lower lip as a rounded pillow — usually larger than the upper.',
      'Add a soft shadow under the lower lip to plant it on the chin.',
      'Vary the central seam curve to shift between smile, smirk, flat, and frown.',
    ],
    principle: 'A caricature smile reaches past the width of the nose. A caricature scowl buries the mouth deep between cheek and chin.',
  },

  // 5
  {
    title: 'Ears',
    summary: 'Often neglected, ears anchor your head in 3D space. A simple C shape with a Y inside.',
    illustration: `<svg viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg">${svgStyle}
      <g transform="translate(30,25)">
        <path d="M30 0 Q0 40 10 100 Q20 130 40 120" class="ink"/>
        <text x="0" y="150" class="label">1. outer C</text>
        <g transform="translate(90,0)">
          <path d="M30 0 Q0 40 10 100 Q20 130 40 120" class="ink"/>
          <path d="M22 30 Q10 60 20 95" class="ink"/>
          <text x="0" y="150" class="label">2. inner ridge</text>
        </g>
        <g transform="translate(180,0)">
          <path d="M30 0 Q0 40 10 100 Q20 130 40 120" class="ink"/>
          <path d="M22 30 Q10 60 20 95" class="ink"/>
          <path d="M22 65 Q10 80 16 95" class="ink"/>
          <text x="0" y="150" class="label">3. bowl + Y</text>
        </g>
        <g transform="translate(270,0)">
          <path d="M30 0 Q0 40 10 100 Q20 130 40 120" class="ink-thick"/>
          <path d="M22 30 Q10 60 20 95" class="ink"/>
          <path d="M22 65 Q10 80 16 95" class="ink"/>
          <path d="M15 110 Q18 125 30 120" class="ink"/>
          <text x="0" y="150" class="label">4. lobe</text>
        </g>
      </g>
      <text x="30" y="200" class="label">ears sit between the brow and nose-base in profile.</text>
    </svg>`,
    steps: [
      'Draw a soft C-shape for the outer rim (helix).',
      'Inside, echo the rim with a smaller curve (antihelix).',
      'Carve a shallow bowl where the ear canal sits (concha).',
      'Finish with a lobe at the bottom — pointed, rounded, or attached.',
      'In profile view, place the ear so its top aligns with the brow and its bottom with the nose base.',
    ],
    principle: 'Ears are a free pass to exaggerate without making a face unrecognizable. Push them bigger to suggest youth, wisdom, or comedy.',
  },

  // 6
  {
    title: 'Facial expressions',
    summary: 'Six universal emotions, each driven by a few muscle groups. Learn the shorthand.',
    illustration: `<svg viewBox="0 0 520 320" xmlns="http://www.w3.org/2000/svg">${svgStyle}
      ${expressionFace(20, 20, 'joy', [['brow','up'], ['mouth','wide-smile']])}
      ${expressionFace(180, 20, 'anger', [['brow','down-sharp'], ['mouth','tight-frown']])}
      ${expressionFace(340, 20, 'surprise', [['brow','up-high'], ['mouth','O']])}
      ${expressionFace(20, 170, 'sadness', [['brow','up-inner'], ['mouth','down-soft']])}
      ${expressionFace(180, 170, 'fear', [['brow','up-strained'], ['mouth','grimace']])}
      ${expressionFace(340, 170, 'disgust', [['brow','one-down'], ['mouth','sneer']])}
    </svg>`,
    steps: [
      'Joy: brows slightly lifted, cheeks pushed up, mouth wide and curved — even the eyes smile.',
      'Anger: brows crunched down and inward, nostrils flared, mouth a tight flat line or bared teeth.',
      'Surprise: brows lifted into the forehead, eyes wide, mouth dropped open into an O.',
      'Sadness: inner brow lifted (the key tell), eyelids heavy, mouth corners pulled down.',
      'Fear: brows lifted and strained, eyes wide, mouth stretched horizontally — like a grimace.',
      'Disgust: one brow lower than the other, upper lip curled into a sneer, nose wrinkled.',
    ],
    principle: 'A caricature amplifies one single emotion until it is the whole character. Pick one and push it 200%.',
  },

  // 7
  {
    title: 'Hands & gestures',
    summary: 'The second face. A bag with five sausages — and then you refine.',
    illustration: `<svg viewBox="0 0 520 240" xmlns="http://www.w3.org/2000/svg">${svgStyle}
      <g transform="translate(30,20)">
        <!-- step 1: mitt -->
        <path d="M10 60 Q0 20 25 15 L70 10 Q90 15 90 50 Q95 100 75 130 Q40 140 20 120 Q0 100 10 60 Z" class="fill-soft" stroke="#22211d" stroke-width="2.2"/>
        <text x="15" y="170" class="label">1. mitt</text>
      </g>
      <g transform="translate(140,20)">
        <!-- step 2: finger lines -->
        <path d="M10 60 Q0 20 25 15 L70 10 Q90 15 90 50 Q95 100 75 130 Q40 140 20 120 Q0 100 10 60 Z" class="fill-soft" stroke="#22211d" stroke-width="2.2"/>
        <line x1="25" y1="20" x2="20" y2="60" class="guide"/>
        <line x1="45" y1="15" x2="42" y2="55" class="guide"/>
        <line x1="65" y1="18" x2="67" y2="60" class="guide"/>
        <line x1="85" y1="35" x2="90" y2="70" class="guide"/>
        <text x="15" y="170" class="label">2. divide 4 fingers</text>
      </g>
      <g transform="translate(260,20)">
        <!-- step 3: knuckles -->
        <path d="M20 80 Q15 30 30 22 Q40 20 45 30 L50 65 Q58 20 70 20 Q82 22 82 35 L80 70 Q88 30 96 32 Q106 38 100 55 L95 82 Q110 55 118 60 Q126 68 115 82 L100 110 Q90 138 55 140 Q20 138 15 115 Z" class="fill-soft" stroke="#22211d" stroke-width="2.2"/>
        <text x="15" y="170" class="label">3. sculpt fingers</text>
      </g>
      <g transform="translate(390,20)">
        <!-- step 4: final -->
        <path d="M20 80 Q15 30 30 22 Q40 20 45 30 L50 65 Q58 20 70 20 Q82 22 82 35 L80 70 Q88 30 96 32 Q106 38 100 55 L95 82 Q110 55 118 60 Q126 68 115 82 L100 110 Q90 138 55 140 Q20 138 15 115 Z" class="skin" stroke="#22211d" stroke-width="2.4"/>
        <path d="M30 50 L32 38 M48 45 L50 30 M68 45 L70 30 M86 55 L90 42" class="ink"/>
        <text x="15" y="170" class="label">4. knuckles + nails</text>
      </g>
      <text x="30" y="215" class="label">shortcut: the palm + thumb base is a diamond. The fingers are taller than you expect.</text>
    </svg>`,
    steps: [
      'Block the whole hand as a squarish mitt — a flat bag with a thumb sticking out at the side.',
      'Before separating fingers, divide them with lightly-spaced radiating lines from the palm.',
      'Carve each finger into two knuckle segments, each segment shorter than the one before it.',
      'The middle finger is tallest, then ring, index, pinky — thumb reaches halfway up the palm.',
      'Finish with fingernails and knuckle creases; a few lines are enough.',
    ],
    principle: 'Caricature hands are cartoon hands: four fingers, thick sausages, clear silhouette. Gesture beats anatomy.',
  },

  // 8
  {
    title: 'Legs & stances',
    summary: 'Two tubes, one hinge. Learn to plant weight believably.',
    illustration: `<svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg">${svgStyle}
      <g transform="translate(30,10)">
        <!-- straight -->
        <line x1="50" y1="10" x2="50" y2="230" class="guide"/>
        <path d="M35 10 Q42 80 40 120 Q50 170 55 230" class="ink-thick"/>
        <path d="M65 10 Q58 80 60 120 Q55 170 50 230" class="ink-thick"/>
        <path d="M40 230 L75 235" class="ink-thick"/>
        <text x="25" y="250" class="label">1. straight</text>
        <!-- contrapposto -->
        <g transform="translate(130,0)">
          <line x1="50" y1="10" x2="50" y2="230" class="guide"/>
          <path d="M30 10 Q50 90 40 130 Q25 180 40 230" class="ink-thick"/>
          <path d="M70 10 Q85 80 78 135 Q95 185 90 230" class="ink-thick"/>
          <path d="M25 230 L60 230 M75 230 L110 230" class="ink-thick"/>
          <text x="25" y="250" class="label">2. contrapposto</text>
        </g>
        <!-- walking -->
        <g transform="translate(260,0)">
          <path d="M40 10 Q30 80 15 130 Q5 180 20 230" class="ink-thick"/>
          <path d="M60 10 Q75 70 95 120 Q110 170 105 200" class="ink-thick"/>
          <path d="M5 230 L35 230 M95 195 L125 210" class="ink-thick"/>
          <text x="25" y="250" class="label">3. walking</text>
        </g>
        <!-- power stance -->
        <g transform="translate(380,0)">
          <path d="M25 10 Q0 80 -10 140 Q-15 180 0 230" class="ink-thick"/>
          <path d="M75 10 Q100 80 110 140 Q115 180 100 230" class="ink-thick"/>
          <path d="M-15 230 L30 230 M70 230 L115 230" class="ink-thick"/>
          <text x="10" y="250" class="label">4. power stance</text>
        </g>
      </g>
    </svg>`,
    steps: [
      'Draw the hip line — the angle at which the pelvis tilts sets everything.',
      'Decide which leg carries the weight. Its knee locks, its foot plants directly under the hip.',
      'The other leg is free — bent, lifted, or kicked out for character.',
      'Feet are wedges, not ovals. Give them a clear direction of travel.',
      'The shoulders counter-tilt against the hips to keep the figure balanced.',
    ],
    principle: 'In caricature, weight lies. Push the weight-bearing leg long, stretch the free leg short, and the figure feels alive.',
  },

  // 9
  {
    title: 'Belly & body types',
    summary: 'The body in three shapes: round, lean, and lanky — with a dozen shortcuts.',
    illustration: `<svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg">${svgStyle}
      <g transform="translate(30,20)">
        <path d="M40 0 Q70 10 75 80 Q80 130 60 180 L20 180 Q-5 130 5 80 Q10 10 40 0 Z" class="skin" stroke="#22211d" stroke-width="2.4"/>
        <text x="15" y="210" class="label">round</text>
      </g>
      <g transform="translate(160,20)">
        <path d="M40 0 Q55 20 55 80 Q60 130 55 180 L25 180 Q20 130 25 80 Q25 20 40 0 Z" class="skin" stroke="#22211d" stroke-width="2.4"/>
        <path d="M38 80 Q40 100 42 130" class="guide"/>
        <text x="25" y="210" class="label">lean</text>
      </g>
      <g transform="translate(280,20)">
        <path d="M40 0 Q50 20 48 80 Q52 140 50 180 L30 180 Q28 140 32 80 Q30 20 40 0 Z" class="skin" stroke="#22211d" stroke-width="2.4"/>
        <text x="25" y="210" class="label">lanky</text>
      </g>
      <g transform="translate(400,20)">
        <path d="M40 0 Q80 40 75 85 Q100 130 55 180 L25 180 Q-20 130 5 85 Q0 40 40 0 Z" class="skin" stroke="#22211d" stroke-width="2.4"/>
        <text x="15" y="210" class="label">barrel</text>
      </g>
    </svg>`,
    steps: [
      'Round: pear-shaped torso, soft shoulders, belly overhangs belt — think friendly grandfather.',
      'Lean: narrow hips, square shoulders, a straight line down the side — think runner.',
      'Lanky: narrow shoulders, long torso, visible ribs — think teenager mid-growth-spurt.',
      'Barrel: broad shoulders, thick chest, short waist — think strongman.',
      'The belly in caricature is a single curved line from sternum to belt — do not over-draw it.',
    ],
    principle: 'Pick a body type as deliberately as you pick a head shape. The contrast between head and body often carries the joke.',
  },

  // 10
  {
    title: 'Full poses & action lines',
    summary: 'One curve rules the whole figure. Without it, a pose is dead.',
    illustration: `<svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg">${svgStyle}
      <g transform="translate(30,20)">
        <path d="M40 10 Q30 80 60 140 Q80 200 70 220" class="guide" stroke-width="3"/>
        <!-- figure following the S -->
        <circle cx="42" cy="20" r="15" class="skin" stroke="#22211d" stroke-width="2"/>
        <path d="M42 35 Q38 70 58 110 Q78 150 70 200 L85 220" class="ink-thick"/>
        <path d="M42 50 L20 80 M42 50 L70 70" class="ink-thick"/>
        <path d="M70 200 L58 220" class="ink-thick"/>
        <text x="20" y="250" class="label">1. S-curve action line</text>
      </g>
      <g transform="translate(180,20)">
        <!-- stick figure with action -->
        <circle cx="40" cy="25" r="14" class="ink"/>
        <line x1="40" y1="39" x2="45" y2="90" class="ink-thick"/>
        <line x1="45" y1="90" x2="30" y2="140" class="ink-thick"/>
        <line x1="45" y1="90" x2="68" y2="150" class="ink-thick"/>
        <line x1="40" y1="55" x2="5" y2="75" class="ink-thick"/>
        <line x1="40" y1="55" x2="80" y2="45" class="ink-thick"/>
        <text x="10" y="250" class="label">2. gesture skeleton</text>
      </g>
      <g transform="translate(320,20)">
        <!-- silhouette -->
        <path d="M90 25 Q70 5 55 15 Q25 20 35 45 Q10 60 25 85 Q5 100 20 130 Q10 170 35 180 Q50 220 70 225 L85 225 Q85 200 80 170 Q115 150 100 120 Q125 100 105 75 Q120 55 95 45 Q110 20 90 25 Z" class="skin" stroke="#22211d" stroke-width="2.4"/>
        <text x="10" y="250" class="label">3. strong silhouette</text>
      </g>
    </svg>`,
    steps: [
      'Before any body parts, draw one flowing S-curve from head to planted foot — the action line.',
      'Snap a stick figure onto that curve — head, spine, hips, two arm lines, two leg lines.',
      'Every limb should either follow the curve or punch against it. Nothing vertical by accident.',
      'Check the silhouette: if you filled the figure pure black, would the pose still read?',
      'Only now start adding volume — torso, limbs, hands, feet, face.',
    ],
    principle: 'In caricature, the pose is itself exaggerated. Push the action line into near-impossible curves — legs buckling, torso twisting, arm flung.',
  },

  // 11
  {
    title: 'Putting it together — caricature principles',
    summary: 'The difference between a portrait and a caricature is one word: more.',
    illustration: `<svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg">${svgStyle}
      <!-- normal -->
      <g transform="translate(30,20)">
        <ellipse cx="50" cy="90" rx="45" ry="60" class="skin" stroke="#22211d" stroke-width="2"/>
        <ellipse cx="35" cy="80" rx="5" ry="3" fill="#22211d"/>
        <ellipse cx="65" cy="80" rx="5" ry="3" fill="#22211d"/>
        <path d="M50 85 L50 110" class="ink"/>
        <path d="M40 125 Q50 130 60 125" class="ink"/>
        <text x="15" y="180" class="label">portrait</text>
      </g>
      <!-- push 1 -->
      <g transform="translate(180,20)">
        <path d="M10 90 Q10 20 50 20 Q90 20 95 90 Q95 150 50 155 Q5 150 10 90 Z" class="skin" stroke="#22211d" stroke-width="2"/>
        <ellipse cx="32" cy="80" rx="7" ry="5" fill="#22211d"/>
        <ellipse cx="68" cy="80" rx="7" ry="5" fill="#22211d"/>
        <path d="M45 85 Q40 110 55 115" class="ink-thick"/>
        <path d="M35 135 Q50 142 65 135" class="ink"/>
        <text x="10" y="180" class="label">push 25%</text>
      </g>
      <!-- push 2 -->
      <g transform="translate(330,20)">
        <path d="M-5 95 Q0 0 50 10 Q110 15 120 95 Q120 170 60 180 Q-10 175 -5 95 Z" class="skin" stroke="#22211d" stroke-width="2.4"/>
        <ellipse cx="28" cy="75" rx="12" ry="8" fill="#22211d"/>
        <ellipse cx="75" cy="75" rx="12" ry="8" fill="#22211d"/>
        <path d="M55 80 Q40 140 60 145 Q80 145 70 120" class="ink-thick"/>
        <path d="M25 160 Q60 175 95 160" class="ink-thick"/>
        <text x="15" y="195" class="label">caricature</text>
      </g>
    </svg>`,
    steps: [
      'Observe first: draw the subject normally. What shape is their head? What is unusual?',
      'Pick one or two features to amplify. Resist amplifying everything — chaos reads as noise.',
      'Use contrast: if you enlarge the nose, shrink the chin. If you stretch the head, shorten the body.',
      'Keep proportions of unexaggerated features correct — they act as anchors for the exaggerated ones.',
      'Refine the line. Caricature lines are confident and varied in weight — no timid sketches.',
      'Step back. If the caricature is still recognizable as the subject, you succeeded.',
    ],
    principle: 'A caricature is an act of love: you cannot exaggerate what you have not first studied carefully.',
  },
];

// --- SVG helper for expression panel ---------------------------------------
function expressionFace(x, y, label, mods) {
  const m = Object.fromEntries(mods);
  // brow path
  let leftBrow = 'M25 45 Q40 35 55 45';
  let rightBrow = 'M75 45 Q90 35 105 45';
  if (m.brow === 'up') { leftBrow = 'M25 40 Q40 28 55 40'; rightBrow = 'M75 40 Q90 28 105 40'; }
  else if (m.brow === 'up-high') { leftBrow = 'M25 32 Q40 20 55 32'; rightBrow = 'M75 32 Q90 20 105 32'; }
  else if (m.brow === 'up-inner') { leftBrow = 'M25 50 Q40 32 55 45'; rightBrow = 'M75 45 Q90 32 105 50'; }
  else if (m.brow === 'up-strained') { leftBrow = 'M22 35 Q40 25 55 35'; rightBrow = 'M75 35 Q90 25 108 35'; }
  else if (m.brow === 'down-sharp') { leftBrow = 'M25 40 L55 55'; rightBrow = 'M75 55 L105 40'; }
  else if (m.brow === 'one-down') { leftBrow = 'M25 45 L55 55'; rightBrow = 'M75 35 Q90 28 105 40'; }
  // mouth path
  let mouth = 'M45 95 Q65 102 85 95';
  if (m.mouth === 'wide-smile') mouth = 'M35 92 Q65 120 95 92';
  else if (m.mouth === 'tight-frown') mouth = 'M40 108 Q65 92 90 108';
  else if (m.mouth === 'O') mouth = 'M55 95 Q65 115 75 95 Q65 85 55 95 Z';
  else if (m.mouth === 'down-soft') mouth = 'M45 100 Q65 115 85 100';
  else if (m.mouth === 'grimace') mouth = 'M30 100 L100 100 M35 95 L95 95';
  else if (m.mouth === 'sneer') mouth = 'M45 100 Q65 85 85 100 Q75 95 65 98';
  const mouthFill = m.mouth === 'O' ? '#22211d' : 'none';
  return `
    <g transform="translate(${x},${y})">
      <ellipse cx="65" cy="70" rx="55" ry="70" class="skin" stroke="#22211d" stroke-width="2.2"/>
      <path d="${leftBrow}" class="ink-thick"/>
      <path d="${rightBrow}" class="ink-thick"/>
      <ellipse cx="42" cy="65" rx="6" ry="4" fill="#22211d"/>
      <ellipse cx="88" cy="65" rx="6" ry="4" fill="#22211d"/>
      <path d="M60 70 Q58 85 68 88" class="ink"/>
      <path d="${mouth}" class="ink-thick" fill="${mouthFill}"/>
      <text x="50" y="150" class="label" text-anchor="middle">${label}</text>
    </g>
  `;
}
