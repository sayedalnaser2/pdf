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
  ['bands','Resistance bands'],['pullup','Pull-up bar'],['machine','Gym machines / cables'],['cardio','Cardio machine (bike, treadmill, rower)']
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
  ['Bike or rower sprints: 20s hard / 40s easy','cardio'],['Kettlebell swings: 30s on / 30s off','kettlebell'],
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
const LABELS = {squat:'Squat',hinge:'Hinge',lunge:'Single-leg',hpush:'Push',vpush:'Overhead push',hpull:'Row',vpull:'Vertical pull',core:'Core',biceps:'Biceps',triceps:'Triceps',calves:'Calves',glutes:'Glutes',reardelt:'Rear delts'};
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

function pickEx(p, ctx, off){
  let c = EX.filter(e=>e[1]===p && has(ctx.equip,e[2]) && !(ctx.lowImpact && e[3]) && !ctx.used.has(e[0]));
  if(!c.length) c = EX.filter(e=>e[1]===p && e[2]==='none' && !(ctx.lowImpact && e[3]) && !ctx.used.has(e[0]));
  if(!c.length) return null;
  const rot = (p==='core'||p==='calves') ? Math.min(c.length,3) : Math.min(c.length,2);
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
function restSec(goal, name, pat, eq, level, age, pref){
  const top = {strength:180, muscle:120, fat:50, endurance:40, mobility:30, general:80}[goal]; // rest after a heavy compound
  const [f, why] = demand(name, pat, eq);
  let r = top*f;
  if(level===2 && f>=0.8 && (goal==='strength'||goal==='muscle')) r += 15;
  if(level===0 && f>=0.8) r -= 10;
  if(age>=50) r += 15;
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

/* ---------- Build plan ---------- */
function buildPlan(p){
  const equip = new Set(p.equip);
  const lowImpact = p.limit==='impact' || p.bmi>=30 || p.age>=55;
  const sport = SPORTS[p.sport];
  const ctx = {equip, lowImpact, used:new Set()};
  const lvl = p.level;
  const days = [];
  const split = SPLITS[p.days];
  const mobilityOnly = p.goal==='mobility';

  split.forEach(([name,slots],i)=>{
    ctx.used = new Set();
    let sl = slots.slice();
    if(sport.bias.length && !mobilityOnly){ const b = sport.bias[i % sport.bias.length]; if(!sl.includes(b)) sl.push(b); }
    // Time budget: sets × (≈40 s working + rest) + 1 min setup per exercise, within session length minus warm-up/cool-down
    const budget = p.minutes - 10;
    sl = sl.filter(x=>COMPOUND.has(x)).concat(sl.filter(x=>!COMPOUND.has(x)));
    const rows = []; let used = 0;
    for(const pat of sl){
      const n = pickEx(pat, ctx, i);
      if(!n) continue;
      const ex = EX.find(e=>e[0]===n && e[1]===pat) || EX.find(e=>e[0]===n);
      const sc = scheme(p.goal, lvl, COMPOUND.has(pat), p.age);
      const rs = restSec(p.goal, n, pat, ex[2], lvl, p.age, p.rest);
      const t = sc.s*(40+rs.sec)/60 + 1;
      if(rows.length>=2 && used+t>budget){ ctx.used.delete(n); continue; }
      const isTime = ['Plank','Side plank','Dead bug'].includes(n);
      rows.push({n, tag:LABELS[pat], sets:sc.s, reps: isTime ? (n==='Dead bug' ? '10/side' : '30–45 s') : sc.reps, rest:fmtRest(rs.sec), why:rs.why});
      used += t;
    }
    const estMin = Math.round(used + 10);

    const day = {name, kind:'strength', rows, estMin, finisher:null, mobility:[], notes:[]};
    if(mobilityOnly){
      day.kind = 'mobility'; day.rows = [];
      day.mobility = MOBILITY.slice((i*4)%MOBILITY.length).concat(MOBILITY).slice(0,8);
      day.cardio = 'Optional: 10–15 min easy walk or cycling';
      day.name = name.replace('Full body','Mobility flow').replace('Upper','Mobility: upper body').replace('Lower','Mobility: lower body');
      day.strengthRows = rows.slice(0,3).map(r=>({...r, sets:2, reps:'10–12', rest:'30 s'}));
    } else if(p.goal==='fat'){
      const h = HIIT.filter(x=>has(equip,x[1]) && !(lowImpact && x[2]));
      day.finisher = 'Finisher (10–15 min): ' + h[i % h.length][0] + ' — repeat 8–10 rounds';
    }
    days.push(day);
  });

  // Replace last day with a sport session
  if(sport.drills.length && p.days>=3){
    days[days.length-1] = {name:`${sport.label} session`, kind:'sport', rows:[], drills:sport.drills.slice(0, p.minutes>=60?4:3), mobility:MOBILITY.slice(0,2), core:['Plank','Dead bug'], notes:[]};
  } else if(sport.drills.length){
    days[days.length-1].finisher = 'Sport finisher: ' + sport.drills[0];
  }
  // Endurance goal: replace one day with steady cardio
  if(p.goal==='endurance' && p.days>=3 && !sport.drills.length){
    const idx = Math.floor(days.length/2);
    days[idx] = {name:'Steady cardio', kind:'cardio', rows:[], mobility:MOBILITY.slice(0,3), notes:[],
      cardio:(equip.has('cardio')?CARDIO_STEADY.cardio:CARDIO_STEADY.none)[0] + ` for ${Math.max(30,p.minutes-10)} min at conversational pace`};
  } else if(p.goal==='endurance'){
    days.forEach(d=>{ if(d.kind==='strength') d.finisher = `Cardio finisher: ${equip.has('cardio')?'bike/rower':'jog or brisk walk'} 15 min steady`; });
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
function renderResult(p, plan, st){
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
  const week = DAYNAMES.map((d,i)=>{ const k = trainIdx.indexOf(i); return `<div class="${k>=0?'on':''}">${d}<br>${k>=0?'W'+(k+1):'Rest'}</div>`; }).join('');

  const daysHtml = plan.map((d,i)=>{
    const when = DAYNAMES[trainIdx[i]];
    let body = '';
    body += `<h4>Warm-up · 5–8 min</h4><p>Easy cardio (light jog, bike or jumping-free marching), arm circles, leg swings, then 1–2 light ramp-up sets of your first exercise.</p>`;
    if(d.rows.length){
      body += `<h4>Workout</h4><table><thead><tr><th>Exercise</th><th>Sets × reps</th><th>Rest</th></tr></thead><tbody>${
        d.rows.map(r=>`<tr><td class="n">${r.n}<small>${r.tag}</small></td><td class="s">${r.sets} × ${r.reps}</td><td>${r.rest}<small>${r.why}</small></td></tr>`).join('')
      }</tbody></table>`;
    }
    if(d.strengthRows){
      body += `<h4>Light strength</h4><table><tbody>${d.strengthRows.map(r=>`<tr><td class="n">${r.n}</td><td class="s">${r.sets} × ${r.reps}</td><td>${r.rest}</td></tr>`).join('')}</tbody></table>`;
    }
    if(d.drills) body += `<h4>Sport work</h4><table><tbody>${d.drills.map(x=>`<tr><td class="n">${x}</td></tr>`).join('')}</tbody></table>`;
    if(d.core) body += `<h4>Core</h4><p>${d.core.map(x=>x+' 3 × 30–45 s').join(' · ')}</p>`;
    if(d.cardio) body += `<h4>Cardio</h4><p>${d.cardio}</p>`;
    if(d.finisher) body += `<h4>Finisher</h4><p>${d.finisher}</p>`;
    body += `<h4>${d.kind==='mobility'?'Mobility flow':'Cool-down · 5 min'}</h4><p>${d.mobility.length?d.mobility.join(' · '):'Easy walking and static stretches for the muscles you trained, 30 s each.'}</p>`;
    return `<article class="day"><h3>${when} · ${d.name}</h3><div class="meta">Workout ${i+1} · ${d.estMin?'about '+d.estMin+' min incl. warm-up':'about '+p.minutes+' min'}</div>${body}</article>`;
  }).join('');

  $('result').innerHTML = `
    <div class="actions"><button id="print">🖨️ Print / save as PDF</button><button id="copy">📋 Copy as text</button><button id="again">✏️ Edit answers</button></div>
    <div class="card" style="margin-bottom:14px"><b>${g.label}</b> · ${sp.label} · ${p.days} days/week · ${p.minutes} min · rest: ${({short:'short',auto:'auto',long:'long'})[p.rest]} · ${p.equip.length?p.equip.length+' equipment types':'bodyweight only'}</div>
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
    <div class="week">${week}</div>
    ${daysHtml}
    <div class="notes">Keep the plan for 4–6 weeks, then rebuild it with your updated weight and experience. Stop an exercise if you feel sharp pain — swap it or ask a coach.</div>`;
  $('result').hidden = false;
  $('form').hidden = true;

  $('print').onclick = ()=>window.print();
  $('again').onclick = ()=>{ $('form').hidden = false; $('result').hidden = true; window.scrollTo({top:0,behavior:'smooth'}); };
  $('copy').onclick = ()=>{
    const t = [`FitPlan — ${g.label} / ${sp.label}`, `Target: ${Math.round(st.cal)} kcal, ${Math.round(st.protein)} g protein`, ''].concat(plan.map((d,i)=>{
      const lines = [`${DAYNAMES[trainIdx[i]]} — ${d.name}`];
      d.rows.forEach(r=>lines.push(`  • ${r.n}: ${r.sets} × ${r.reps} (rest ${r.rest})`));
      (d.drills||[]).forEach(x=>lines.push('  • '+x));
      if(d.cardio) lines.push('  • '+d.cardio);
      if(d.finisher) lines.push('  • '+d.finisher);
      return lines.join('\n');
    })).join('\n');
    navigator.clipboard.writeText(t).then(()=>{ $('copy').textContent='✅ Copied'; });
  };
  window.scrollTo({top:0,behavior:'smooth'});
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
      days:+$('days').value, minutes:+$('minutes').value, rest:$('rest').value
    };
    p.bmi = p.weight/Math.pow(p.height/100,2);
    try{ localStorage.setItem('fitplan', JSON.stringify(p)); }catch(_){}
    renderResult(p, buildPlan(p), stats(p));
  };
}
initForm();
