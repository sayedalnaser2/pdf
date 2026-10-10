'use strict';

/* ---------- Data ---------- */
const GOALS = {
  fat:      {label:'Lose fat',        desc:'Burn calories, keep muscle'},
  muscle:   {label:'Build muscle',    desc:'Size & shape (hypertrophy)'},
  strength: {label:'Get stronger',    desc:'Heavy, low-rep lifting'},
  endurance:{label:'Endurance',       desc:'Stamina & cardio fitness'},
  general:  {label:'General fitness', desc:'Healthy, balanced, athletic'},
  mobility: {label:'Mobility & posture', desc:'Flexibility, joint health'}
};

const EQUIP = [
  ['dumbbell','Dumbbells'],['barbell','Barbell & plates'],['bench','Bench'],['kettlebell','Kettlebell'],
  ['bands','Resistance bands'],['medball','Medicine ball'],['pullup','Pull-up bar'],['machine','Gym machines / cables'],['cardio','Cardio machine (bike, treadmill, rower)']
];

// Exercise: [name, pattern, required equipment ("a+b" = needs both), highImpact]
const EX = [
  ['Barbell back squat','squat','barbell'],['Leg press','squat','machine'],['Goblet squat','squat','dumbbell'],
  ['Kettlebell goblet squat','squat','kettlebell'],['Banded squat','squat','bands'],['Bodyweight squat','squat','none'],['Jump squat','squat','none',1],
  ['Romanian deadlift','hinge','barbell'],['Dumbbell Romanian deadlift','hinge','dumbbell'],['Kettlebell swing','hinge','kettlebell'],
  ['Banded good morning','hinge','bands'],['Single-leg glute bridge','hinge','none'],['Glute bridge','hinge','none'],
  ['Barbell reverse lunge','lunge','barbell'],['Dumbbell walking lunge','lunge','dumbbell'],['Bulgarian split squat','lunge','none'],['Step-ups (chair/box)','lunge','none'],['Reverse lunge','lunge','none'],
  ['Barbell bench press','hpush','barbell+bench'],['Dumbbell bench press','hpush','dumbbell+bench'],['Dumbbell floor press','hpush','dumbbell'],
  ['Chest press machine','hpush','machine'],['Banded push-up','hpush','bands'],['Push-ups','hpush','none'],['Decline push-ups (feet on chair)','hpush','none'],
  ['Overhead press','vpush','barbell'],['Dumbbell shoulder press','vpush','dumbbell'],['Shoulder press machine','vpush','machine'],
  ['Kettlebell press','vpush','kettlebell'],['Banded overhead press','vpush','bands'],['Pike push-ups','vpush','none'],
  ['Barbell row','hpull','barbell'],['One-arm dumbbell row','hpull','dumbbell'],['Seated cable row','hpull','machine'],
  ['Kettlebell row','hpull','kettlebell'],['Banded row','hpull','bands'],['Inverted row (under sturdy table)','hpull','none'],
  ['Pull-ups / chin-ups','vpull','pullup'],['Lat pulldown','vpull','machine'],['Banded pulldown','vpull','bands'],
  ['Dumbbell pullover','vpull','dumbbell+bench'],['Prone Y-T raises','vpull','none'],
  ['Plank','core','none'],['Hanging knee raise','core','pullup'],['Cable crunch','core','machine'],['Russian twist','core','dumbbell'],
  ['Pallof press','core','bands'],['Dead bug','core','none'],['Side plank','core','none'],['Bicycle crunch','core','none'],
  ['Barbell curl','biceps','barbell'],['Dumbbell curl','biceps','dumbbell'],['Banded curl','biceps','bands'],['Towel/backpack curl','biceps','none'],
  ['Cable triceps pushdown','triceps','machine'],['Dumbbell overhead extension','triceps','dumbbell'],['Banded pushdown','triceps','bands'],['Close-grip push-ups','triceps','none'],['Bench dips (chair)','triceps','none'],
  ['Dumbbell calf raise','calves','dumbbell'],['Standing calf raise','calves','none'],
  ['Barbell hip thrust','glutes','barbell+bench'],['Dumbbell hip thrust','glutes','dumbbell+bench'],['Banded lateral walk','glutes','bands'],['Glute bridge','glutes','none'],
  ['Dumbbell rear-delt fly','reardelt','dumbbell'],['Band pull-apart','reardelt','bands'],['Prone Y-T raises','reardelt','none']
];

const MOBILITY = ['Cat-cow ×10','World’s greatest stretch ×5/side','Hip flexor stretch 40s/side','Thoracic rotations ×8/side','Deep squat hold 45s','Hamstring stretch 40s/side','Child’s pose 45s','Wall shoulder slides ×10','Pigeon pose 40s/side','Downward dog ↔ cobra ×8'];

const CARDIO_STEADY = {
  cardio:['Bike / treadmill / rower at steady pace'],
  none:['Brisk walk, jog or cycle outdoors']
};
const HIIT = [ // [name, equip, highImpact]
  ['Bike or rower sprints: 20s hard / 60s easy (1:3 — sprints need more rest)','cardio'],['Kettlebell swings: 30s on / 30s off','kettlebell'],
  ['Mountain climbers: 30s on / 30s off','none'],['Burpees: 30s on / 30s off','none',1],['High knees: 30s on / 30s off','none',1],
  ['Shadow boxing rounds: 30s on / 30s off','none'],['Fast bodyweight squats: 30s on / 30s off','none']
];

// Sport: key -> [label, category, bias patterns, note, drills[]]
const SPORT_DEFS = [
 ['gym','Gym / no specific sport','General',[],'',[]],
 // Endurance
 ['running','Running (5K–marathon)','Endurance',['lunge','calves','hinge','core'],'Keep 1 hard run + 1–2 easy runs per week on non-lifting days or after lifting. Strength work cuts injury risk and improves running economy.',['Easy run 20–40 min (conversation pace)','Tempo: 10 min easy, 15 min comfortably hard, 5 min easy','Intervals: 6 × 2 min hard / 2 min jog','Strides: 6 × 20 s fast, relaxed form']],
 ['trail','Trail / Ultra running','Endurance',['lunge','calves','hinge','core'],'Train on hills and uneven ground; ankle, glute and single-leg strength protect you on long descents.',['Long steady run/hike 60–120 min','Hill repeats: 6 × 90 s uphill, walk down','Downhill control: 5 × 1 min easy descents','Single-leg balance on uneven surface 3 × 40 s']],
 ['cycling','Cycling (road, MTB, indoor)','Endurance',['squat','hinge','core','reardelt'],'Add 2–3 rides weekly around lifting. Lower-body strength boosts power; core and upper-back work keeps you comfortable in the saddle.',['Endurance ride 45–90 min, steady Zone 2','Sweet-spot: 3 × 10 min hard / 5 min easy','Hill repeats: 5 × 3 min seated climbs','Cadence drills: 5 × 1 min at 100+ rpm']],
 ['swimming','Swimming','Water',['vpull','reardelt','core','vpush'],'Dryland strength emphasises lats, shoulder stability and core. Keep pressing volume moderate to protect the shoulders.',['Pool: 400 m easy + 4 × 100 m drills (catch-up, fingertip drag)','Pool: 8 × 50 m fast / 20 s rest','Pool: 1 × 800 m steady, count strokes per length','Dryland: band straight-arm pulldowns 3 × 15']],
 ['triathlon','Triathlon','Endurance',['hinge','core','reardelt','lunge'],'Rotate swim / bike / run through the week with at least one brick (bike → run) session. Keep strength work short and heavy-ish.',['Swim 20–30 min technique + aerobic sets','Bike 45–75 min steady','Brick: 30 min bike then 10 min run','Run 25–40 min easy']],
 ['rowing','Rowing / Kayak / Canoe','Water',['hinge','hpull','core','squat'],'Power comes from legs → back → arms. Build posterior-chain strength and a bulletproof core.',['Steady row/paddle 30–50 min','Intervals: 8 × 500 m hard / 1 min rest','Technique: 10 min pick drill','Power strokes: 10 × 10 strokes max effort']],
 ['surfing','Surfing / Paddleboarding','Water',['vpull','core','hpush','reardelt'],'Paddle endurance, pop-up power and hip mobility. Train shoulders and lower back for balance.',['Paddling: 5 × 3 min fast arm circles (or swim)','Pop-up practice: 4 × 8 burpee-style pop-ups','Balance board / single-leg stands 3 × 45 s','Mobility: hips and thoracic spine 8 min']],
 ['crossfit','CrossFit / HIIT classes','Strength & Power',['hinge','vpush','core','squat'],'Mix heavy lifting with short metabolic circuits. Keep technique sharp and manage fatigue.',['AMRAP 12 min: 5 pull-ups, 10 push-ups, 15 squats','EMOM 10 min: alternate 10 swings / 12 burpees','Rowing/bike 5 × 500 m or 1 min hard','Skill work: handstand or double-under practice 8 min']],
 // Team sports
 ['football','Football / Soccer','Team',['lunge','hinge','core','calves'],'Mix speed, change-of-direction and stamina. Single-leg strength and hamstring work are key for sprinting and injury protection.',['Sprints: 8 × 20 m, walk-back recovery','Shuttle runs 5-10-5 × 6','Ladder/cone agility footwork × 6 patterns','Interval run: 8 × 1 min hard / 1 min easy']],
 ['basketball','Basketball','Team',['lunge','squat','calves','core'],'Build explosive legs and ankle/knee stability. Land softly and keep jump volume modest.',['Defensive slides: 6 × 20 s','Vertical jump: 5 × 4 (full recovery)','Suicide sprints × 5','Ball-handling circuit 10 min']],
 ['volleyball','Volleyball','Team',['squat','vpush','reardelt','core'],'Jump height, shoulder health and landing mechanics. Protect knees and shoulders with rear-delt and hamstring work.',['Approach jumps: 5 × 5','Lateral shuffle + dive-roll footwork × 8','Medicine-ball overhead throws 4 × 8','Serve/spike shoulder band routine 3 × 15']],
 ['handball','Handball / Water polo','Team',['vpush','core','lunge','reardelt'],'Throwing power, repeat sprints and shoulder resilience.',['Sprints: 10 × 15 m','Band/med-ball throws 4 × 8 each arm','Jump-lunge shuffles 4 × 12','Interval circuit 10 × 40 s on / 20 s off']],
 ['rugby','Rugby / American football','Team',['squat','hinge','hpush','core'],'Mass, power and collision-readiness: heavy compound lifts, sprint work and neck/trunk strength.',['Sprints: 8 × 30 m','Sled/hill push 6 × 20 m (or heavy walking lunges)','Tackle-position mobility & neck isometrics 3 × 20 s','Shuttle conditioning 6 × 40 s']],
 ['hockey','Ice / Field hockey','Team',['lunge','hinge','core','glutes'],'Skating stride and field-hockey crouch need strong glutes, adductors and core.',['Lateral bounds 4 × 8/side','Sprint intervals 10 × 20 s / 40 s','Adductor copenhagen plank 3 × 20 s/side','Wrist & forearm stick-control drills']],
 ['baseball','Baseball / Softball / Cricket','Team',['hinge','core','reardelt','lunge'],'Rotational power, shoulder/elbow health and short sprints. Keep throwing volume managed.',['Med-ball rotational throws 4 × 6/side','Sprints: 6 × 30 m','Shoulder care band routine 3 × 15','Hip-hinge & rotation mobility 8 min']],
 ['ultimate','Ultimate frisbee / Lacrosse','Team',['lunge','hinge','core','calves'],'Repeat sprints and cutting with strong hamstrings and ankles.',['Sprint-cut drills × 8','Interval run 8 × 1 min / 1 min','Lateral bounds 4 × 8','Throwing accuracy 10 min']],
 // Racket
 ['tennis','Tennis / Badminton / Padel','Racket',['lunge','core','reardelt','hinge'],'Prioritise leg drive, rotational core and shoulder health (rear delts, rotator cuff).',['Split-step & first-step drills × 10','Lateral shuffles: 6 × 20 s','Med-ball/band rotational throws 3 × 8/side','Court sprints: 8 × 15 s']],
 ['tabletennis','Table tennis / Squash','Racket',['lunge','core','reardelt','calves'],'Quick feet, wrist/shoulder stability and fast reactions.',['Footwork shuffles 6 × 30 s','Reaction ball drops × 20','Lunge-and-reach 4 × 10/side','Interval rally practice 6 × 2 min']],
 ['golf','Golf','Precision',['core','hinge','reardelt','glutes'],'Rotational power, hip and thoracic mobility, and lower-back protection. Warm up spine and hips before every round.',['Thoracic rotations & hip turns 3 × 10/side','Med-ball rotational throws 3 × 8/side','Single-leg balance with club swing 3 × 30 s','Walk 30–45 min brisk (golf-day endurance)']],
 // Combat
 ['boxing','Boxing / Kickboxing / Muay Thai','Combat',['hpull','core','vpush','hinge'],'Rotational core, strong pulling muscles and short-burst conditioning transfer best. Avoid heavy leg work the day before sparring.',['Shadow boxing/kicks: 6 × 3 min rounds, 1 min rest','Heavy bag: 5 × 2 min rounds','Jump rope or skipping drills: 6 × 2 min','Neck, grip & rotational core circuit']],
 ['mma','MMA / Wrestling / Judo / BJJ','Combat',['hpull','hinge','core','vpull'],'Grip, neck, hip power and repeated high-intensity rounds. Mobility for hips and spine is essential.',['Drilling rounds 5 × 5 min at 70%','Sprawl/shoot burpee ladder 6 × 30 s','Grip circuit: farmer holds / towel hangs 4 × 30 s','Hip escape/bridge drills 3 × 10']],
 ['karate','Karate / Taekwondo','Combat',['lunge','core','calves','hinge'],'Explosive kicks need hip mobility, hamstring flexibility and single-leg stability.',['Kicking combos 6 × 2 min','Stance work & kata 10 min','Dynamic hip/hamstring mobility 3 × 10/side','Reaction footwork drills 6 × 30 s']],
 ['fencing','Fencing','Combat',['lunge','calves','core','reardelt'],'Explosive lunges, one-sided loading balance and fast footwork.',['Advance-lunge drills 6 × 10','Footwork ladder × 6 patterns','Reaction starts 8 × 3 m','Opposite-side strength balance 3 × 12']],
 // Strength / power sports
 ['powerlifting','Powerlifting','Strength & Power',['squat','hinge','hpush','core'],'Peak the big three: heavy low-rep work with accessory volume for weak points and bracing practice.',['Competition-style squat singles @ 80–85%','Bench pause reps 5 × 3','Deadlift speed pulls 6 × 2 @ 60%','Bracing / belt-free core practice 3 × 8']],
 ['weightlifting','Olympic weightlifting','Strength & Power',['squat','hinge','vpush','core'],'Technique first: snatch & clean-and-jerk variations, then strength and mobility (ankles, hips, shoulders).',['Snatch technique: pulls + hang snatch 6 × 2','Clean & jerk complexes 5 × 1+1','Front squats 4 × 3','Overhead mobility 10 min']],
 ['bodybuilding','Bodybuilding / Physique','Strength & Power',['biceps','triceps','reardelt','glutes'],'High volume, full range of motion, mind-muscle focus and lagging-muscle priority.',['Weak-point specialisation: 3 extra sets 12–15 reps','Mind-muscle tempo work 3 × 10 (3-1-1)','Posing/stretch mobility 8 min','Low-intensity cardio 20 min (optional)']],
 ['calisthenics','Calisthenics / Gymnastics','Strength & Power',['vpull','vpush','core','hpush'],'Master progressions: pull-up, dip, handstand, L-sit, front lever. Keep joints warm and wrists conditioned.',['Handstand wall practice 5 × 30 s','L-sit holds 5 × 15 s','Muscle-up / pull-up progressions 5 × 3–5','Wrist & shoulder prep 8 min']],
 ['strongman','Strongman / Highland games','Strength & Power',['hinge','squat','vpush','core'],'Heavy carries, loading events and grip strength. Build capacity then specificity.',['Farmer carries 5 × 30 m heavy','Yoke/sandbag carries 4 × 20 m','Stone/sandbag loading 5 × 3','Grip finisher: dead hang 3 × max']],
 ['athletics','Sprinting / Jumping / Throwing','Strength & Power',['hinge','squat','core','calves'],'Speed and power: heavy strength, plyometrics and technique. Full recovery between hard efforts.',['Acceleration sprints 6 × 30 m','Plyo: bounds & hops 4 × 6','Technical event drills 15 min','Med-ball throws 4 × 5']],
 ['crosscountry','Cross-country skiing / Nordic','Winter',['hinge','hpull','core','lunge'],'Full-body endurance with poling power; build lats, triceps and hips.',['Roller-ski/ski or run steady 45–75 min','Double-pole intervals 6 × 2 min (band or ski)','Ski-striding bounds 4 × 20 m','Uphill hike/run 4 × 4 min']],
 // Winter / outdoor
 ['skiing','Skiing / Snowboarding','Winter',['squat','lunge','core','glutes'],'Eccentric quad strength, hip/ankle stability and balance protect knees on the slopes. Start 6–8 weeks before the season.',['Wall sits 4 × 45 s','Skater jumps 4 × 10/side','Balance-board / single-leg stands 3 × 40 s','Interval cycling 6 × 2 min hard']],
 ['iceskating','Ice skating / Speed skating','Winter',['lunge','glutes','core','squat'],'Deep-knee-bend endurance, adductors and balance.',['Skater squat-and-glide 4 × 12/side','Lateral bounds 4 × 8','Low squat holds 4 × 30 s','Interval bike 8 × 40 s / 20 s']],
 ['climbing','Rock climbing / Bouldering','Outdoor',['hpull','reardelt','core','triceps'],'Balance all the pulling with pushing and rear-delt work to keep shoulders and elbows healthy. Train fingers carefully.',['Hangs from bar: 5 × 10 s','Climb/traverse 4 × 4 min easy-moderate','Core: hanging leg raises or L-sits 4 × max','Antagonist push-ups 3 × 15']],
 ['hiking','Hiking / Mountaineering','Outdoor',['squat','lunge','calves','core'],'Loaded step-ups, eccentric downhill strength and long aerobic base. Train with a pack.',['Weighted-pack hike 60–180 min','Step-ups with pack 4 × 12/side','Stair or hill repeats 6 × 2 min','Balance & ankle stability 3 × 40 s']],
 ['obstacle','Obstacle racing / Military fitness','Outdoor',['vpull','hinge','core','lunge'],'Grip, running endurance, carries and bodyweight strength.',['Run 2 km + 10 burpees × 3 rounds','Carries (sandbag/backpack) 5 × 40 m','Pull-up / hang hold circuit 4 × max','Crawls: bear/lizard 4 × 20 m']],
 // Mind-body & precision
 ['yoga','Yoga / Pilates','Mind-body',['core','glutes','reardelt','hinge'],'Add strength to complement your flexibility, and keep the practice for recovery and mobility.',['Sun salutations 5 rounds','Balance flow 15 min','Pilates core series 15 min','Breathwork 5 min']],
 ['dance','Dance / Cheerleading','Mind-body',['calves','glutes','core','lunge'],'Jump-landing control, ankle strength, hip mobility and stamina. Keep lower-limb loading balanced.',['Dance cardio 20 min at performance pace','Jumps/landings 4 × 6 (soft landings)','Turnout & hip mobility 8 min','Core & balance circuit 10 min']],
 ['equestrian','Horse riding','Precision',['core','glutes','reardelt','lunge'],'Core stability, inner thigh strength and balance while seated or posting.',['Seat balance: single-leg stands 3 × 40 s','Adductor squeezes 3 × 15','Posting-trot squats 4 × 20','Spine mobility 8 min']],
 ['shooting','Archery / Shooting','Precision',['reardelt','core','hpull','vpush'],'Static shoulder stability, back strength and breathing control.',['Draw-hold with band 6 × 15 s','Steady-aim holds 5 × 30 s','Breathing practice 5 min','Rear-delt / scapular band series 3 × 15']],
 ['skate','Skateboarding / BMX / Roller skating','Outdoor',['lunge','calves','core','glutes'],'Ankle strength, landing control and fall-resilience; keep wrists and shoulders strong.',['Balance board 3 × 45 s','Ollie-style jumps 4 × 6','Single-leg squats 3 × 8','Wrist and ankle mobility 6 min']],
 ['esports','Desk life / Esports / Gaming','Mind-body',['reardelt','hpull','core','glutes'],'Counter hours of sitting: posture muscles, hip flexor stretching, wrists and eye breaks.',['Posture reset: wall angels 3 × 12','Wrist extensor/flexor stretches 3 × 30 s','Brisk walk 20 min after sessions','Hip-flexor stretch 3 × 40 s/side']]
];
const SPORTS = {};
SPORT_DEFS.forEach(([k,label,cat,bias,note,drills])=>{ SPORTS[k] = {label, cat, desc:cat, bias, note, drills}; });

/* ---------- Helpers ---------- */
const $ = id => document.getElementById(id);
const LABELS = {squat:'Squat',hinge:'Hinge',lunge:'Single-leg',hpush:'Push',vpush:'Overhead push',hpull:'Row',vpull:'Vertical pull',core:'Core',biceps:'Biceps',triceps:'Triceps',calves:'Calves',glutes:'Glutes',reardelt:'Rear delts',
  plyo:'Jump power',plyoU:'Upper-body power',rot:'Rotation',ham:'Hamstrings',adduct:'Adductors / hips',ankle:'Ankles & balance',shoulder:'Shoulder health',grip:'Grip & forearms',carry:'Carry',neck:'Neck',olympic:'Olympic-style power',sdelt:'Side delts',fly:'Chest isolation',quad:'Quads'};
EX.push.apply(EX, EX_SPORT);
const DAYNAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const TRAIN_DAYS = {2:[0,3],3:[0,2,4],4:[0,1,3,4],5:[0,1,2,4,5],6:[0,1,2,3,4,5]};

const SPLITS = {
  2:[['Full body A',['squat','hpush','hpull','core']],['Full body B',['hinge','vpush','vpull','core']]],
  3:[['Full body A',['squat','hpush','hpull','vpush','core']],['Full body B',['hinge','vpull','lunge','hpush','core']],['Full body C',['lunge','vpush','hpull','glutes','core']]],
  4:[['Upper A',['hpush','hpull','vpush','vpull','biceps','triceps']],['Lower A',['squat','hinge','lunge','calves','core']],
     ['Upper B',['vpush','vpull','hpush','hpull','reardelt','triceps']],['Lower B',['hinge','squat','lunge','glutes','core']]],
  5:[['Push',['hpush','vpush','triceps','core']],['Pull',['vpull','hpull','reardelt','biceps']],['Legs',['squat','hinge','lunge','calves','core']],
     ['Upper',['hpush','hpull','vpush','vpull','biceps']],['Lower',['hinge','squat','glutes','lunge','core']]],
  6:[['Push A',['hpush','vpush','triceps','core']],['Pull A',['vpull','hpull','reardelt','biceps']],['Legs A',['squat','hinge','lunge','calves']],
     ['Push B',['vpush','hpush','triceps','core']],['Pull B',['hpull','vpull','reardelt','biceps']],['Legs B',['hinge','squat','glutes','calves','core']]]
};

function has(sel, req){ return req==='none' || req.split('+').every(t=>sel.has(t)); }

const WIDE_ROT = new Set(['core','calves','ankle','shoulder','grip','rot','adduct','ham','plyo','plyoU','carry','neck','sdelt','fly','quad','olympic']);
function pickEx(p, ctx, off){
  const ok = e=>e[1]===p && !(ctx.lowImpact && e[3]) && !ctx.used.has(e[0]) && (!e[5] || e[5].includes(ctx.sport));
  let c = EX.filter(e=>ok(e) && has(ctx.equip,e[2]));
  if(!c.length) c = EX.filter(e=>ok(e) && e[2]==='none');
  if(!c.length) return null;
  const pref = (ctx.prefer||{})[p];
  if(pref){ const rk = e=>{ const k = pref.indexOf(e[0]); return k<0 ? 99 : k; }; c = c.slice().sort((a,b)=>rk(a)-rk(b)); }
  const rot = WIDE_ROT.has(p) ? Math.min(c.length,3) : Math.min(c.length,2);
  const e = c[off % rot]; ctx.used.add(e[0]); return e[0];
}

const REST_PREF = {short:0.7, auto:1, long:1.4};
function fmtRest(sec){
  if(sec<120) return sec+' s';
  const m = Math.floor(sec/60), r = sec%60;
  return r ? `${m} min ${r} s` : `${m} min`;
}
// Exercise-specific rest. Returns [factor, reason]: how demanding THIS exercise is relative to a heavy compound lift.
function demand(name, pat, eq){
  if(['Plank','Side plank','Dead bug','Bicycle crunch','Russian twist','Hanging knee raise','Cable crunch','Pallof press'].includes(name)) return [0.35,'core / low fatigue'];
  if(pat==='calves') return [0.4,'small muscle, fast recovery'];
  if(pat==='reardelt') return [0.4,'small muscle, light load'];
  if(pat==='biceps'||pat==='triceps') return [0.45,'isolation'];
  if(/jump|swing/i.test(name)) return [0.9,'explosive — needs full recovery'];
  if(name==='Pull-ups / chin-ups') return [0.85,'bodyweight pull, high demand'];
  const bar = eq.includes('barbell'), mach = eq==='machine', band = eq==='bands', none = eq==='none';
  const big = pat==='squat'||pat==='hinge'||pat==='lunge'||pat==='glutes';
  if(bar) return [1.0,'heavy barbell compound'];
  if(band) return [0.55,'band — low load'];
  if(mach) return [0.8,'machine compound'];
  if(none) return big ? [0.6,'bodyweight lower body'] : [0.65,'bodyweight upper body'];
  if(pat==='lunge') return [0.75,'single-leg, dumbbell'];
  return [0.8, big?'dumbbell/kettlebell lower body':'dumbbell/kettlebell compound'];
}
function restSec(goal, name, pat, eq, level, age, pref, sport, opt){
  opt = opt || {};
  let top = {strength:180, muscle:105, fat:50, endurance:40, mobility:30, general:80}[goal]; // rest after a heavy compound
  const sr = (typeof REST_DEFS!=='undefined' && REST_DEFS[sport]) || {};
  if(sr.top && (goal==='strength'||goal==='muscle'||goal==='general')) top = sr.top;
  if(opt.heavy) top = Math.max(top, 150);
  if(opt.fixed){ const sec = Math.max(30, Math.round(opt.fixed.sec*(REST_PREF[pref]||1)/5)*5); return {sec, why:opt.fixed.why}; }
  const [f, why] = demand(name, pat, eq);
  let r = top*f;
  if(sr.upper && ['hpush','vpush','hpull','vpull'].includes(pat)) r *= sr.upper;
  if(level===2 && f>=0.8 && (goal==='strength'||goal==='muscle')) r += 15;
  if(level===0 && f>=0.8) r -= 10;
  // Age: research is mixed (older lifters may recover faster between sets, yet hold reps better with longer rest), so no blanket change.
  if(f<0.5) r = Math.min(r, 60); // core, calves, arms, rear delts recover quickly
  r *= REST_PREF[pref] || 1;
  const floor = goal==='mobility'?20:30;
  return {sec:Math.max(floor, Math.round(r/5)*5), why};
}

function scheme(goal, level, compound, age){
  let s, reps;
  switch(goal){
    case 'strength': s = compound?5:3; reps = compound?'3–5':'6–8'; break;
    case 'muscle':   s = compound?4:3; reps = compound?'6–10':'10–15'; break;
    case 'fat':      s = 3; reps = '12–15'; break;
    case 'endurance':s = 3; reps = '15–20'; break;
    case 'mobility': s = 2; reps = '10–12 (slow, controlled)'; break;
    default:         s = 3; reps = compound?'8–12':'10–15';
  }
  if(level===0) s = Math.max(2, s-1);
  if(level===2 && (goal==='muscle'||goal==='strength') && compound) s += 1;
  if(age>=50 && reps==='3–5') reps='5–6';
  return {s, reps};
}

const COMPOUND = new Set(['squat','hinge','hpush','vpush','hpull','vpull','lunge','glutes']);

/* ---------- Progression ---------- */
function cardioMin(base, wk){ const m = base + 5*(wk.inBlock-1) + 5*wk.block; return Math.round(wk.deload ? base*0.7 : m); }
function sportProgress(wk){
  if(wk.deload) return 'Deload week: cut total volume ~40% and keep every effort easy.';
  if(wk.n===1) return 'Week 1 baseline: do the work at a comfortable effort and note your times/paces.';
  if(wk.inBlock===1) return 'New block: add 1 extra repeat/round vs. your last build week and beat your baseline.';
  if(wk.inBlock===2) return 'Progression: add 1 repeat/round or ~5% more distance/time than last week.';
  return 'Peak week: add another repeat or go ~5% faster (keep rest at the sport guide, not shorter).';
}
const PROG_KEY = 'fitplan.program';
function loadProg(){ try{ return JSON.parse(localStorage.getItem(PROG_KEY)); }catch(_){ return null; } }
function saveProg(prog){ try{ localStorage.setItem(PROG_KEY, JSON.stringify(prog)); }catch(_){} }
const roundW = (w,imp)=> imp ? Math.round(w) : Math.round(w*2)/2;

// Double progression: reps first, then weight. Feedback (easy / ok / hard) tunes the jump.
function nextTarget(e, imp){ const t = nextTarget0(e, imp); t.unit = e.unit; return t; }
function nextTarget0(e, imp){
  const inc = imp ? 5 : 2.5, fb = e.fb || 'ok', r = +e.r, w = +e.w || 0;
  const lo = e.lo || 8, hi = e.hi || 12;
  if(e.time){ const next = fb==='hard' ? r : Math.min(90, r + (fb==='easy'?10:5)); return {w:0, r:next, time:true, note: next>r?'Hold 5–10 s longer':'Repeat — build control first'}; }
  if(w>0){
    if(fb==='hard' || r<lo) return r<lo-1 ? {w:roundW(w*0.95,imp), r:lo, note:'Slightly lighter — own the reps first'} : {w, r:lo, note:'Same weight — hit every rep first'};
    if(r>=hi || (fb==='easy' && r>=lo+1)) return {w:roundW(w+inc*(fb==='easy'&&r>=hi?2:1),imp), r:lo, note:'Weight up — reps reset to the bottom of the range'};
    return {w, r:Math.min(hi, r+1), note:'Same weight — add a rep'};
  }
  if(fb==='hard' || r<lo) return {w:0, r:lo, note:'Same variation — own every rep'};
  if(r>=hi) return {w:0, r:r+1, note:'Top of range — slow the tempo (3 s down) or add a loaded backpack / harder variation'};
  return {w:0, r:r+(fb==='easy'?2:1), note:'Add reps'};
}
// State after every completed non-deload week before week n
function targetsFor(prog, n){
  const st = {...(prog.carry||{})};
  for(let k=1;k<n;k++){
    if(weekInfo(k).deload) continue;
    const L = prog.log[k]; if(!L) continue;
    for(const [ex,e] of Object.entries(L)) if(e && e.r>0) st[ex] = nextTarget(e, prog.p.units==='imperial');
  }
  return st;
}

/* ---------- Build plan ---------- */
function weekInfo(n){
  const inBlock = ((n-1)%4)+1;
  const cues = {1:'Learn the loads — stop each set with ~3 reps left in the tank',2:'Push a little — stop with ~2 reps left',3:'Hardest build week — last set with 0–1 rep left; +1 set on big lifts',4:'Deload — lighter weights and fewer sets so you recover and come back stronger'};
  return {n, block:Math.floor((n-1)/4), inBlock, deload:inBlock===4, cue:cues[inBlock], phase:inBlock===4?'Deload':inBlock===3?'Peak':'Build'};
}
function weekSets(base, compound, wk, goal){
  if(wk.deload) return Math.max(2, Math.round(base*0.6));
  let s = base;
  if(wk.inBlock===3 && compound) s += 1;
  if(wk.block>0 && compound && (goal==='muscle'||goal==='strength')) s += 1;
  return Math.min(6, s);
}
function parseRange(reps){
  const m = String(reps).match(/(\d+)\s*[–-]\s*(\d+)/);
  return m ? [+m[1], +m[2]] : null;
}
function buildPlan(p, wk){
  wk = wk || weekInfo(1);
  const equip = new Set(p.equip);
  const lowImpact = p.limit==='impact' || p.bmi>=30 || p.age>=55;
  const sport = SPORTS[p.sport];
  const pl = PLANS[p.sport] || PLANS.gym;
  const ctx = {equip, lowImpact, used:new Set(), sport:p.sport, prefer:pl.prefer};
  const lvl = p.level;
  const days = [];
  const split = SPLITS[p.days];
  const mobilityOnly = p.goal==='mobility';

  split.forEach(([name,slots],i)=>{
    ctx.used = new Set();
    let sl = slots.slice();
    let picks = [];
    if(!pl.focus.length && sport.bias.length && !mobilityOnly){ const b = sport.bias[i % sport.bias.length]; if(!sl.includes(b)) sl.push(b); }
    // Time budget: sets × (≈40 s working + rest) + 1 min setup per exercise, within session length minus warm-up/cool-down
    const budget = p.minutes - 10;
    if(pl.focus.length && !mobilityOnly){
      sl = sl.filter(x=>!pl.skip.includes(x));
      const per = Math.min(3, pl.focus.length);
      for(let k=0;k<per;k++){ const f = pl.focus[(i*per+k) % pl.focus.length]; if(!picks.includes(f)) picks.push(f); }
      const comp = sl.filter(x=>COMPOUND.has(x)), others = sl.filter(x=>!COMPOUND.has(x) && !picks.includes(x));
      sl = comp.slice(0,2).concat(picks.filter(x=>!comp.slice(0,2).includes(x)), comp.slice(2).filter(x=>!picks.includes(x)), others);
    } else sl = sl.filter(x=>COMPOUND.has(x)).concat(sl.filter(x=>!COMPOUND.has(x)));
    const rows = []; let used = 0;
    for(const pat of sl){
      const n = pickEx(pat, ctx, i + (COMPOUND.has(pat) ? 0 : (wk.rot ?? wk.block)));
      if(!n) continue;
      const ex = EX.find(e=>e[0]===n && e[1]===pat) || EX.find(e=>e[0]===n);
      const rx = ex[4] ? RX[ex[4]] : null;
      const heavy = !!(pl.heavy && COMPOUND.has(pat) && !rx && !['fat','mobility'].includes(p.goal));
      const sc = rx ? {s: lvl===0?Math.max(2,rx.s-1):rx.s, reps:rx.reps}
               : heavy ? {s: lvl===0?2:3, reps:'4–6'}
               : scheme(p.goal, lvl, COMPOUND.has(pat), p.age);
      const rs = restSec(p.goal, n, pat, ex[2], lvl, p.age, p.rest, p.sport, {fixed: rx?{sec:rx.rest,why:rx.why}:null, heavy});
      const t = sc.s*(40+rs.sec)/60 + 1;
      if(rows.length>=2 && used+t>budget){ ctx.used.delete(n); continue; }
      const isTime = !rx && ['Plank','Side plank','Dead bug'].includes(n);
      const reps = rx ? rx.reps : isTime ? (n==='Dead bug' ? '10/side' : '30–45 s') : sc.reps;
      rows.push({n, tag:LABELS[pat], sets:weekSets(sc.s, COMPOUND.has(pat) && !rx, wk, p.goal), reps, rest:fmtRest(rs.sec), why:rs.why,
        sp: picks.includes(pat),
        time: rx ? !!rx.time : (isTime && n!=='Dead bug'), unit: rx && rx.unit,
        range: rx ? rx.range : heavy ? [4,6] : isTime ? (n==='Dead bug'?[8,12]:[30,45]) : parseRange(sc.reps)});
      used += t;
    }
    const estMin = Math.round(used + 10);

    const dayName = picks.length ? name + ' + ' + picks.map(x=>LABELS[x]).join(' / ') : name;
    const day = {name: dayName, kind:'strength', rows, estMin, finisher:null, mobility:(!mobilityOnly && pl.mob.length)?pl.mob:[], notes:[]};
    if(mobilityOnly){
      day.kind = 'mobility'; day.rows = [];
      day.mobility = MOBILITY.slice((i*4)%MOBILITY.length).concat(MOBILITY).slice(0,8);
      day.cardio = 'Optional: 10–15 min easy walk or cycling';
      day.name = name.replace('Full body','Mobility flow').replace('Upper','Mobility: upper body').replace('Lower','Mobility: lower body');
      day.strengthRows = rows.slice(0,3).map(r=>({...r, sets:2, reps:'10–12', rest:'30 s'}));
    } else if(p.goal==='fat'){
      const h = HIIT.filter(x=>has(equip,x[1]) && !(lowImpact && x[2]));
      day.finisher = 'Finisher: ' + h[i % h.length][0] + ' — ' + (wk.deload ? 5 : Math.min(12, 5 + wk.inBlock + wk.block*2)) + ' rounds' + (wk.deload?' (easy week)':'');
    }
    days.push(day);
  });

  // Sport sessions: replace the last day(s) with sport-specific work
  if(sport.drills.length && p.days>=3 && !pl.nosd){
    const n = (pl.sd && pl.sd[p.days]) || 1;
    for(let j=0;j<n;j++){
      const idx = days.length-1-j;
      const rotd = sport.drills.slice((n-1-j)*2 % sport.drills.length).concat(sport.drills).slice(0, p.minutes>=60?4:3);
      days[idx] = {progress:sportProgress(wk), name: n>1 ? `${sport.label} session ${n-j}` : `${sport.label} session`, kind:'sport', rows:[], drills:rotd, sportKey:p.sport, mobility:pl.mob.length?pl.mob:MOBILITY.slice(0,2), core:['Plank','Dead bug'], notes:[]};
    }
  } else if(sport.drills.length && !pl.nosd){
    days[days.length-1].finisher = 'Sport finisher: ' + sport.drills[0] + ' — ' + sportProgress(wk);
  }
  // Endurance goal: replace one day with steady cardio
  if(p.goal==='endurance' && p.days>=3 && !sport.drills.length){
    const idx = Math.floor(days.length/2);
    days[idx] = {name:'Steady cardio', kind:'cardio', rows:[], mobility:MOBILITY.slice(0,3), notes:[],
      cardio:(equip.has('cardio')?CARDIO_STEADY.cardio:CARDIO_STEADY.none)[0] + ` for ${cardioMin(Math.max(30,p.minutes-10), wk)} min at conversational pace`};
  } else if(p.goal==='endurance'){
    days.forEach(d=>{ if(d.kind==='strength') d.finisher = `Cardio finisher: ${equip.has('cardio')?'bike/rower':'jog or brisk walk'} ${cardioMin(15, wk)} min steady`; });
  }

  return days;
}

/* ---------- Nutrition & stats ---------- */
function stats(p){
  const bmi = p.weight / Math.pow(p.height/100,2);
  const bmr = 10*p.weight + 6.25*p.height - 5*p.age + (p.sex==='m'?5:-161);
  const tdee = bmr * p.activity;
  const adj = {fat:-0.2,muscle:0.1,strength:0.05,endurance:0.05,general:0,mobility:0}[p.goal];
  let cal = tdee*(1+adj);
  cal = Math.max(cal, bmr*1.05, p.sex==='m'?1500:1200);
  const protG = {fat:2.0,muscle:1.8,strength:1.8,endurance:1.4,general:1.4,mobility:1.2}[p.goal];
  const protein = p.weight*protG;
  const fat = cal*0.27/9;
  const carbs = Math.max(0,(cal - protein*4 - fat*9)/4);
  const water = (p.weight*35 + 500)/1000;
  const hrMax = 220 - p.age;
  return {bmi, bmr, tdee, cal, protein, fat, carbs, water, z2:[Math.round(hrMax*.6),Math.round(hrMax*.7)], hrMax};
}

function bmiCat(b){ return b<18.5?'Underweight':b<25?'Healthy':b<30?'Overweight':'Obese'; }

/* ---------- Render ---------- */
function planCard(p, plan){
  const pl = PLANS[p.sport]; if(!pl || !pl.why) return '';
  const names = [...new Set(plan.flatMap(d=>d.rows).filter(r=>r.sp).map(r=>r.n))];
  const src = pl.src && PLAN_SRC[pl.src] ? ` <a href="${PLAN_SRC[pl.src][1]}" target="_blank" rel="noopener">${PLAN_SRC[pl.src][0]}</a>` : '';
  return `<div class="notes"><b>Why this plan fits ${SPORTS[p.sport].label}</b><p>${pl.why}</p>
    ${names.length?`<p><b>⭐ Sport-specific exercises this week:</b> ${names.join(' · ')}</p>`:''}
    <p class="ev">Evidence: ${REST_EV[pl.ev]}.${src}</p></div>`;
}
function restGuide(key){
  const r = REST_DEFS[key]; if(!r||!r.rules.length) return '';
  return `<h4>Rest guide for ${SPORTS[key].label}</h4><ul class="rules">${r.rules.map(x=>`<li>${x}</li>`).join('')}</ul><p class="ev">Evidence: ${REST_EV[r.ev]}</p>`;
}

function fmtTarget(t, imp, deload, r){
  const U = imp?'lb':'kg';
  if(deload) return `Deload: ${t.w>0?roundW(t.w*0.9,imp)+' '+U+' × ':''}${t.time?(r.range?r.range[0]:t.r)+' s':(r.range?r.range[0]:t.r)+' '+(t.unit||'reps')} — easy`;
  return `🎯 Target: ${t.w>0?t.w+' '+U+' × ':''}${t.r} ${t.time?'s':(t.unit||'reps')} — ${t.note}`;
}

function progressSummary(prog){
  const imp = prog.p.units==='imperial', U = imp?'lb':'kg', first = {}, last = {};
  for(let k=1;k<=prog.weeks;k++){
    if(weekInfo(k).deload || !prog.log[k]) continue;
    for(const [ex,e] of Object.entries(prog.log[k])){ if(!(e && e.r>0)) continue; if(!first[ex]) first[ex]=e; last[ex]=e; }
  }
  const f = e => `${+e.w>0?e.w+' '+U+' × ':''}${e.r}${e.time?' s':' '+(e.unit||'reps')}`;
  const rows = Object.keys(first).map(ex=>{
    const a=first[ex], b=last[ex], dw=(+b.w||0)-(+a.w||0), dr=(+b.r)-(+a.r);
    const d = dw!==0 ? `${dw>0?'+':''}${dw} ${U}` : (dr!==0 ? `${dr>0?'+':''}${dr} ${e_unit(b)}` : 'same');
    return `<tr><td class="n">${ex}</td><td>${f(a)}</td><td>${f(b)}</td><td class="s">${d}</td></tr>`;
  });
  return rows.length ? `<details class="notes" open><summary><b>Your progress so far</b></summary><table><thead><tr><th>Exercise</th><th>First logged</th><th>Latest</th><th>Change</th></tr></thead><tbody>${rows.join('')}</tbody></table></details>` : '';
}
const e_unit = e => e.time ? 's' : (e.unit||'reps');

function renderProgram(prog){
  const p = prog.p, N = prog.weeks, view = prog.view, wk = weekInfo(view), imp = p.units==='imperial', U = imp?'lb':'kg';
  wk.rot = wk.block + (prog.block0||0)*3;
  const plan = buildPlan(p, wk), st = stats(p), targets = targetsFor(prog, view);
  const finished = prog.cur > N;
  const g = GOALS[p.goal], sp = SPORTS[p.sport];
  const notes = [];
  if(p.age>=50) notes.push('Age 50+: longer warm-up, a little more rest between sets, and prioritise technique over load. Add balance work when you can.');
  if(p.age<18) notes.push('Under 18: focus on technique and bodyweight/light loads; skip max-effort lifts and keep calories adequate for growth.');
  if(st.bmi>=30) notes.push('BMI 30+: low-impact options were chosen (no jumping). Walking, cycling and strength work are excellent starting points.');
  if(st.bmi<18.5 && p.goal==='fat') notes.push('Your BMI is below 18.5 — fat loss is not recommended. Consider “Build muscle” or “General fitness” instead.');
  if(p.limit==='impact') notes.push('High-impact moves have been replaced with low-impact alternatives.');
  if(p.level===0) notes.push('Beginner: start with lighter weights than you think you need; add weight or 1–2 reps each week once all sets feel controlled.');
  if(p.level>0) notes.push('Progression: when you hit the top of the rep range on all sets, add 2.5% – 5% weight (or one extra rep / slower tempo for bodyweight).');
  if(sp.note) notes.push(sp.note);
  if(p.goal==='fat') notes.push('Fat loss is mostly made in the kitchen: aim for the calorie target below, 7–10k steps daily, and 7–9 hours of sleep.');
  if(p.goal==='muscle') notes.push('Muscle gain needs a calorie surplus, protein at every meal and progressive overload. Expect ~0.25–0.5 kg per month of lean gain.');

  const trainIdx = TRAIN_DAYS[p.days];
  const weekStrip = DAYNAMES.map((d,i)=>{ const k = trainIdx.indexOf(i); return `<div class="${k>=0?'on':''}">${d}<br>${k>=0?'W'+(k+1):'Rest'}</div>`; }).join('');
  const tabs = Array.from({length:N},(_,i)=>{ const n=i+1, w=weekInfo(n);
    return `<button class="wk ${n===view?'active':''} ${prog.done[n]?'done':''} ${w.deload?'deload':''}" data-wk="${n}" title="${w.phase}">${prog.done[n]?'✓ ':''}${w.deload?'D':'W'+n}</button>`; }).join('');

  const logRow = r => {
    if(!(view <= prog.cur)) return '';
    const e = (prog.log[view]||{})[r.n] || {};
    return `<tr class="logrow"><td colspan="3"><span class="lg">Log:</span>
      ${r.time?'':`<label>Weight (${U}, 0 = bodyweight)<input type="number" inputmode="decimal" step="0.5" min="0" data-ex="${r.n}" data-f="w" value="${e.w??''}"></label>`}
      <label>${r.time?'Seconds held':r.unit==='m'?'Metres (lowest set)':'Reps (lowest set)'}<input type="number" inputmode="numeric" min="0" data-ex="${r.n}" data-f="r" value="${e.r??''}"></label>
      <label>Felt<select data-ex="${r.n}" data-f="fb"><option value="ok" ${e.fb==='ok'||!e.fb?'selected':''}>Just right</option><option value="easy" ${e.fb==='easy'?'selected':''}>Too easy</option><option value="hard" ${e.fb==='hard'?'selected':''}>Too hard</option></select></label></td></tr>`;
  };

  const daysHtml = plan.map((d,i)=>{
    const when = DAYNAMES[trainIdx[i]];
    let body = '';
    body += `<h4>Warm-up · 5–8 min</h4><p>Easy cardio (light jog, bike or jumping-free marching), arm circles, leg swings, then 1–2 light ramp-up sets of your first exercise.</p>`;
    if(d.rows.length){
      body += `<h4>Workout</h4><table><thead><tr><th>Exercise</th><th>Sets × reps</th><th>Rest</th></tr></thead><tbody>${
        d.rows.map(r=>{
          const t = targets[r.n];
          const tg = t ? fmtTarget(t, imp, wk.deload, r) : (view===1 ? 'First week: choose a weight where you finish the reps with the left-in-tank cue above' : 'New exercise — find a weight that fits the rep range');
          return `<tr><td class="n">${r.sp?'⭐ ':''}${r.n}<small>${r.tag}</small></td><td class="s">${r.sets} × ${r.reps}<small class="tg">${tg}</small></td><td>${r.rest}<small>${r.why}</small></td></tr>${logRow(r)}`;
        }).join('')
      }</tbody></table>`;
    }
    if(d.strengthRows){
      body += `<h4>Light strength</h4><table><tbody>${d.strengthRows.map(r=>`<tr><td class="n">${r.n}</td><td class="s">${r.sets} × ${r.reps}</td><td>${r.rest}</td></tr>`).join('')}</tbody></table>`;
    }
    if(d.sportKey) body += restGuide(d.sportKey);
    if(d.drills) body += `<h4>Sport work</h4><table><tbody>${d.drills.map(x=>`<tr><td class="n">${x}</td></tr>`).join('')}</tbody></table>`;
    if(d.progress) body += `<p class="tg">📈 ${d.progress}</p>`;
    if(d.core) body += `<h4>Core</h4><p>${d.core.map(x=>x+' 3 × 30–45 s').join(' · ')}</p>`;
    if(d.cardio) body += `<h4>Cardio</h4><p>${d.cardio}</p>`;
    if(d.finisher) body += `<h4>Finisher</h4><p>${d.finisher}</p>`;
    body += `<h4>${d.kind==='mobility'?'Mobility flow':'Cool-down · 5 min'}</h4><p>${d.mobility.length?d.mobility.join(' · '):'Easy walking and static stretches for the muscles you trained, 30 s each.'}</p>`;
    return `<article class="day"><h3>${when} · ${d.name}</h3><div class="meta">Workout ${i+1} · ${d.estMin?'about '+d.estMin+' min incl. warm-up':'about '+p.minutes+' min'}</div>${body}</article>`;
  }).join('');

  const flash = prog.flash ? `<div class="notes flash"><b>Week ${prog.flash.week} saved — your next targets</b><ul>${prog.flash.items.map(x=>`<li>${x}</li>`).join('')}</ul></div>` : '';
  const banner = finished
    ? `<div class="notes flash"><b>🎉 Program complete!</b> You finished all ${N} weeks. Start the next program — it begins from your latest targets, with fresh accessory exercises.<br><button id="next" class="primary" style="margin-top:10px">Start next ${N}-week program</button></div>`
    : view>prog.cur ? `<div class="notes">Preview only — targets for this week update from your logged results when you get here.</div>` : '';
  const completeBtn = (!finished && view===prog.cur) ? `<button id="complete" class="primary">✅ Complete week ${view} &amp; get next targets</button>` : '';

  $('result').innerHTML = `
    <div class="actions"><button id="print">🖨️ Print / save as PDF</button><button id="copy">📋 Copy week as text</button><button id="again">✏️ New plan</button><button id="reset">🗑️ Delete program</button></div>
    <div class="card" style="margin-bottom:14px"><b>${g.label}</b> · ${sp.label} · ${p.days} days/week · ${p.minutes} min · rest: ${({short:'short',auto:'auto',long:'long'})[p.rest]} · ${p.equip.length?p.equip.length+' equipment types':'bodyweight only'} · ${N}-week program</div>
    <div class="phase ${wk.deload?'deload':''}"><b>Week ${view} of ${N} · ${wk.phase}</b><span>${wk.cue}</span></div>
    <div class="wks">${tabs}</div>
    ${flash}${banner}
    ${progressSummary(prog)}
    <div class="stats">
      <div><b>${st.bmi.toFixed(1)}</b><span>BMI · ${bmiCat(st.bmi)}</span></div>
      <div><b>${Math.round(st.tdee)}</b><span>kcal / day to maintain</span></div>
      <div><b>${Math.round(st.cal)}</b><span>kcal / day target</span></div>
      <div><b>${Math.round(st.protein)} g</b><span>protein</span></div>
      <div><b>${Math.round(st.carbs)} / ${Math.round(st.fat)} g</b><span>carbs / fat</span></div>
      <div><b>${st.water.toFixed(1)} L</b><span>water + more when sweating</span></div>
      <div><b>${st.z2[0]}–${st.z2[1]}</b><span>easy cardio heart rate (bpm)</span></div>
    </div>
    ${notes.length?`<div class="notes"><b>Notes for you</b><ul>${notes.map(n=>`<li>${n}</li>`).join('')}</ul></div>`:''}
    ${planCard(p, plan)}
    ${p.sport!=='gym'?`<div class="notes">${restGuide(p.sport)}</div>`:''}
    <div class="week">${weekStrip}</div>
    ${daysHtml}
    ${completeBtn}
    <details class="notes"><summary><b>Research behind the rest times</b></summary>
      <ul>
        <li>Strength &amp; hypertrophy: rests over ~60 s help muscle growth slightly, with no clear extra benefit beyond ~90 s; heavy strength work does better with 3+ min — <a href="https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1429789/pdf" target="_blank" rel="noopener">2024 meta-analysis</a>.</li>
        <li>Powerlifting: 3–5 min beat 1 min for absolute strength; bench press is fine with 2–3 min.</li>
        <li>Olympic lifts: 3 min kept maximal clean &amp; jerk technique and power better than 2 min — <a href="https://scholars.georgiasouthern.edu/en/publications/comparison-of-2-and-3-minute-inter-repetition-rest-periods-on-max/" target="_blank" rel="noopener">elite lifter study</a>.</li>
        <li>Sprints / team sports: 60 s rest gave lower power than 90–120 s — <a href="https://doaj.org/article/7972c0cf49ca44a4b4a4c88502c4e74b" target="_blank" rel="noopener">2024 study</a>; 15 m sprints recover at ~1:10, longer sprints need more.</li>
        <li>Tennis / badminton: match play is ~1:1–1:4 work:rest; training at 1:2–1:5 — <a href="https://pmc.ncbi.nlm.nih.gov/articles/2653872/" target="_blank" rel="noopener">BJSM review</a>.</li>
        <li>Boxing 3:1 and MMA 5:1 round-to-rest ratios come from official rules (1-min break).</li>
        <li>Older lifters: evidence is mixed (some recover faster, others hold reps better with longer rest), so no age penalty is applied — see <a href="https://ojs.srce.hr/kinesiology/article/view/5655" target="_blank" rel="noopener">Grgić &amp; Schoenfeld</a>.</li>
        <li>Each sport's evidence level is shown on its rest guide. Many sports have no direct rest studies, so those use the closest related sport.</li>
      </ul>
    </details>
    <div class="notes"><b>How progression works:</b> every 4 weeks = 3 build weeks (weights/reps go up, +1 set on big lifts in week 3) then a deload week. Log the weight and your lowest-set reps for each exercise — when you hit the top of the rep range the weight goes up (2.5 ${U}, or 5 ${U} if “too easy”); otherwise you add a rep. “Too hard” or missing the range holds or lowers the load. After 4 weeks the main lifts stay (so progress carries over), accessories rotate, and big lifts get +1 set. Stop an exercise if you feel sharp pain.</div>`;
  $('result').hidden = false; $('form').hidden = true; $('resume').hidden = true;
  delete prog.flash; saveProg(prog);

  $('result').querySelectorAll('.wk').forEach(b=>b.onclick=()=>{ prog.view = +b.dataset.wk; delete prog.flash; saveProg(prog); renderProgram(prog); window.scrollTo({top:0,behavior:'smooth'}); });
  $('result').oninput = e=>{
    const el = e.target; if(!el.dataset || !el.dataset.ex) return;
    const L = (prog.log[view] = prog.log[view] || {}), ex = el.dataset.ex;
    const row = plan.flatMap(d=>d.rows).find(r=>r.n===ex) || {};
    const ent = (L[ex] = L[ex] || {fb:'ok'});
    ent[el.dataset.f] = el.dataset.f==='fb' ? el.value : (el.value===''?undefined:+el.value);
    if(row.range){ ent.lo=row.range[0]; ent.hi=row.range[1]; } ent.time = !!row.time; ent.unit = row.unit;
    saveProg(prog);
  };
  const cb = $('complete');
  if(cb) cb.onclick = ()=>{
    const L = prog.log[view] || {};
    if(!wk.deload && !Object.values(L).some(e=>e && e.r>0) && !confirm('You have not logged any results this week, so next week\'s targets will not change. Complete it anyway?')) return;
    prog.done[view] = true; prog.cur = view+1; prog.view = Math.min(prog.cur, N);
    if(!wk.deload){
      const before = targetsFor(prog, view), after = targetsFor(prog, view+1);
      const items = Object.keys(L).filter(ex=>after[ex] && L[ex] && L[ex].r>0).map(ex=>{ const t=after[ex]; return `<b>${ex}</b>: ${t.w>0?t.w+' '+U+' × ':''}${t.r} ${t.time?'s':(t.unit||'reps')} — ${t.note}`; });
      prog.flash = {week:view, items:items.length?items:['No new targets — log weight and reps next time to unlock progression.']};
    } else prog.flash = {week:view, items:['Deload done — fresh legs. Next week starts a new block: same main lifts with your saved targets, plus fresh accessory exercises.']};
    saveProg(prog); renderProgram(prog); window.scrollTo({top:0,behavior:'smooth'});
  };
  const nx = $('next');
  if(nx) nx.onclick = ()=>{ const carry = targetsFor(prog, N+1); const np = {p:prog.p, weeks:N, cur:1, view:1, log:{}, done:{}, carry:{...(prog.carry||{}), ...carry}, block0:(prog.block0||0)+1}; saveProg(np); renderProgram(np); window.scrollTo({top:0}); };
  $('print').onclick = ()=>window.print();
  $('again').onclick = ()=>{ $('form').hidden = false; $('result').hidden = true; showResume(); window.scrollTo({top:0,behavior:'smooth'}); };
  $('reset').onclick = ()=>{ if(confirm('Delete this program and all logged results?')){ try{ localStorage.removeItem(PROG_KEY);}catch(_){} $('form').hidden = false; $('result').hidden = true; showResume(); } };
  $('copy').onclick = ()=>{
    const t = [`FitPlan — ${g.label} / ${sp.label} — Week ${view}/${N} (${wk.phase})`, wk.cue, `Target: ${Math.round(st.cal)} kcal, ${Math.round(st.protein)} g protein`, ''].concat(plan.map((d,i)=>{
      const lines = [`${DAYNAMES[trainIdx[i]]} — ${d.name}`];
      d.rows.forEach(r=>{ const tt = targets[r.n]; lines.push(`  • ${r.n}: ${r.sets} × ${r.reps} (rest ${r.rest})${tt?' → '+fmtTarget(tt,imp,wk.deload,r).replace('🎯 ',''):''}`); });
      (d.drills||[]).forEach(x=>lines.push('  • '+x));
      if(d.cardio) lines.push('  • '+d.cardio);
      if(d.finisher) lines.push('  • '+d.finisher);
      return lines.join('\n');
    })).join('\n');
    navigator.clipboard.writeText(t).then(()=>{ $('copy').textContent='✅ Copied'; });
  };
  window.scrollTo({top:0,behavior:'smooth'});
}

function showResume(){
  const prog = loadProg(), box = $('resume');
  if(!prog || !prog.p){ box.hidden = true; return; }
  const N = prog.weeks, fin = prog.cur > N;
  box.hidden = false;
  box.innerHTML = `<b>${fin?'Program complete':'Your program is saved'}</b> — ${GOALS[prog.p.goal].label} · ${SPORTS[prog.p.sport].label} · ${fin?'all '+N+' weeks done':'week '+Math.min(prog.cur,N)+' of '+N}
    <div class="actions" style="margin:10px 0 0"><button id="cont" class="primary" style="margin:0;width:auto">${fin?'View results':'Continue week '+prog.cur}</button></div>`;
  $('cont').onclick = ()=>{ prog.view = Math.min(prog.cur, N); renderProgram(prog); };
}

/* ---------- Form wiring ---------- */
function initForm(){
  $('goals').innerHTML = Object.entries(GOALS).map(([k,v],i)=>
    `<label class="choice"><input type="radio" name="goal" value="${k}" ${i===1?'checked':''}><span><b>${v.label}</b><i>${v.desc}</i></span></label>`).join('');
  const cats = [...new Set(SPORT_DEFS.map(d=>d[1]))];
  $('sportsel').innerHTML = cats.map(c=>`<optgroup label="${c}">${SPORT_DEFS.filter(d=>d[1]===c).map(d=>`<option value="${d[0]}">${d[1]}</option>`).join('')}</optgroup>`).join('');
  $('sportsel').onchange = ()=>{ const sp = SPORTS[$('sportsel').value]; $('sportdesc').textContent = sp.drills.length ? 'Includes sport-specific session: '+sp.drills[0]+' …' : 'Pure strength & fitness training.'; };
  $('sportsel').onchange();
  $('equip').innerHTML = `<label class="chip fixed"><input type="checkbox" checked disabled><span>✔ Bodyweight (always)</span></label>` +
    EQUIP.map(([k,l])=>`<label class="chip"><input type="checkbox" name="equip" value="${k}"><span>${l}</span></label>`).join('');

  $('units').onchange = ()=>{
    const imp = $('units').value==='imperial';
    $('wlabel').textContent = imp?'Weight (lb)':'Weight (kg)';
    $('hlabel').textContent = imp?'Height (in)':'Height (cm)';
    $('weight').value = imp ? Math.round($('weight').value*2.20462) : Math.round($('weight').value/2.20462*10)/10;
    $('height').value = imp ? Math.round($('height').value/2.54) : Math.round($('height').value*2.54);
    $('weight').min = imp?66:30; $('weight').max = imp?880:400; $('height').min = imp?40:100; $('height').max = imp?100:250;
  };

  $('form').onsubmit = e=>{
    e.preventDefault();
    const imp = $('units').value==='imperial';
    const p = {
      sex:$('sex').value, age:+$('age').value,
      weight: imp? $('weight').value/2.20462 : +$('weight').value,
      height: imp? $('height').value*2.54 : +$('height').value,
      activity:+$('activity').value, level:+$('level').value, limit:$('limit').value,
      goal:document.querySelector('input[name=goal]:checked').value,
      sport:$('sportsel').value,
      equip:[...document.querySelectorAll('input[name=equip]:checked')].map(x=>x.value),
      days:+$('days').value, minutes:+$('minutes').value, rest:$('rest').value, units:$('units').value
    };
    p.bmi = p.weight/Math.pow(p.height/100,2);
    const old = loadProg();
    if(old && old.p && Object.keys(old.log||{}).length && !confirm('This replaces your saved program and its logged results. Continue?')) return;
    const prog = {p, weeks:+$('weeks').value, cur:1, view:1, log:{}, done:{}};
    saveProg(prog); renderProgram(prog);
  };
}
initForm();
showResume();
