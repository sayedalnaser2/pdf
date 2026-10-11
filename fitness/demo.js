/* Exercise demos: animated stick-figure + step-by-step instructions.
   Each exercise maps (by pattern + name rules) to a movement template (two key poses that loop) with steps, mistakes and cues. */
(function(){
'use strict';
var D = Math.PI/180, GY = 150, L = {torso:44, ua:26, fa:24, th:38, sh:38, foot:13};

/* ---- Poses: angles in degrees, measured from "straight down", positive toward the facing direction (right).
   t torso (from straight up), n head, a/f upper/fore-arm, th/s thigh/shin, th2/s2 back leg, ft foot angle (0 flat forward, 90 down),
   g = how the figure is anchored (feet, hands, knee, bar, abs), lift = jump height ---- */
var T = {
 squat:   {A:{t:3,a:70,f:80,th:2,s:0,g:'feet'},                  B:{t:38,a:80,f:85,th:88,s:-18,g:'feet'}},
 hinge:   {A:{t:3,a:0,f:0,th:4,s:0,g:'feet'},                    B:{t:80,a:0,f:0,th:16,s:-6,g:'feet'}},
 deadlift:{A:{t:55,a:0,f:0,th:68,s:-28,g:'feet'},                B:{t:2,a:0,f:0,th:2,s:0,g:'feet'}},
 lunge:   {A:{t:2,a:0,f:0,th:2,s:0,th2:2,s2:0,g:'feet'},         B:{t:4,a:0,f:0,th:86,s:0,th2:-28,s2:-86,ft2:70,g:'feet'}},
 pushup:  {A:{t:66,a:0,f:0,th:-66,s:-66,ft:70,g:'both',ax:45},  B:{t:81,a:-52,f:80,th:-81,s:-79,ft:70,g:'both',ax:45}},
 bench:   {A:{abs:[70,138],t:90,a:-85,f:-180,th:-158,s:-22,g:'abs'}, B:{abs:[70,138],t:90,a:-180,f:-180,th:-158,s:-22,g:'abs'}},
 press:   {A:{t:0,a:18,f:178,th:2,s:0,g:'feet'},                 B:{t:0,a:178,f:180,th:2,s:0,g:'feet'}},
 row:     {A:{t:66,a:0,f:0,th:24,s:-8,g:'feet'},                 B:{t:66,a:-118,f:12,th:24,s:-8,g:'feet'}},
 pullup:  {A:{t:0,a:178,f:180,th:4,s:-14,g:'bar',sc:.68},          B:{t:0,a:12,f:176,th:12,s:-34,g:'bar',sc:.68}},
 curl:    {A:{t:0,a:2,f:2,th:2,s:0,g:'feet'},                    B:{t:0,a:4,f:152,th:2,s:0,g:'feet'}},
 tricep:  {A:{t:0,a:176,f:-24,th:2,s:0,g:'feet'},                B:{t:0,a:176,f:-176,th:2,s:0,g:'feet'}},
 raise:   {A:{t:0,a:2,f:2,th:2,s:0,g:'feet'},                    B:{t:0,a:88,f:88,th:2,s:0,g:'feet'}},
 plank:   {A:{t:79,a:0,f:90,th:-79,s:-79,ft:70,g:'both',ax:45}, B:{t:77,a:0,f:90,th:-77,s:-77,ft:70,g:'both',ax:45}},
 crunch:  {A:{abs:[80,140],t:90,a:130,f:60,th:-158,s:-22,g:'abs'}, B:{abs:[80,140],t:58,a:130,f:60,th:-158,s:-22,g:'abs'}},
 legraise:{A:{abs:[135,140],t:90,a:-90,f:-90,th:-92,s:-92,g:'abs'}, B:{abs:[135,140],t:90,a:-90,f:-90,th:-176,s:-176,g:'abs'}},
 bridge:  {A:{abs:[80,140],t:90,a:-90,f:-90,th:-160,s:-20,g:'abs'}, B:{abs:[80,118],t:126,a:-60,f:-60,th:-110,s:15,g:'abs'}},
 calf:    {A:{t:0,a:0,f:0,th:0,s:0,ft:0,g:'feet'},               B:{t:0,a:0,f:0,th:0,s:0,ft:58,g:'feet',lift:12}},
 jump:    {A:{t:38,a:-45,f:-30,th:80,s:-22,g:'feet',sc:.68},     B:{t:0,a:150,f:150,th:0,s:0,ft:50,g:'feet',lift:22,sc:.68}},
 throw:   {A:{t:-6,a:172,f:172,th:6,s:0,g:'feet'},               B:{t:52,a:58,f:78,th:46,s:-14,g:'feet'}},
 carry:   {A:{t:0,a:0,f:0,th:22,s:6,th2:-20,s2:-12,g:'feet'},    B:{t:0,a:0,f:0,th:-20,s:-12,th2:22,s2:6,g:'feet'}},
 swing:   {A:{t:68,a:22,f:22,th:22,s:-10,g:'feet'},              B:{t:2,a:86,f:86,th:3,s:0,g:'feet'}},
 clean:   {A:{t:60,a:0,f:0,th:55,s:-24,g:'feet'},                B:{t:2,a:12,f:172,th:3,s:0,g:'feet'}},
 slrdl:   {A:{t:3,a:0,f:0,th:2,s:0,th2:2,s2:0,g:'feet'},         B:{t:78,a:0,f:0,th:10,s:-4,th2:-84,s2:-86,g:'feet'}},
 nordic:  {A:{t:2,a:60,f:60,th:2,s:-90,ft:0,g:'knee',ax:75},     B:{t:80,a:80,f:70,th:-80,s:-90,ft:0,g:'knee',ax:75}},
 hang:    {A:{t:0,a:178,f:180,th:2,s:-6,g:'bar',sc:.68},                B:{t:0,a:178,f:180,th:2,s:-20,g:'bar',sc:.68}}
};

/* ---- Steps ---- */
var S = {
 squat:{label:'Squat pattern',steps:['Stand with feet about shoulder-width apart, toes turned out slightly, holding {impl}.','Brace your core and keep your chest tall.','Sit your hips back and down while your knees track over your toes.','Lower until your thighs are about parallel (or as deep as you can keep your back flat).','Drive through your whole foot to stand up, squeezing your glutes at the top.'],bad:['Knees caving inward','Heels lifting off the floor','Rounding the lower back at the bottom'],br:'Breathe in on the way down, out as you stand.'},
 hinge:{label:'Hip hinge',steps:['Stand tall with feet hip-width apart, holding {impl}, knees slightly bent.','Push your hips straight back as if closing a door with your bum, keeping the back flat.','Let the weight slide down your thighs until you feel a stretch in the hamstrings.','Squeeze your glutes and drive your hips forward to stand tall.'],bad:['Squatting instead of hinging','Rounding the back','Letting the weight drift away from the legs'],br:'Breathe in as you hinge, out as you stand.'},
 deadlift:{label:'Deadlift pattern',steps:['Stand with the load over mid-foot and grip it just outside your legs using {impl}.','Bend your hips and knees until your shins touch the load; chest up, back flat.','Take the slack out of your arms and brace your core hard.','Push the floor away and stand tall, keeping the load close to your legs.','Lower under control by hinging the hips back first, then bending the knees.'],bad:['Jerking the weight off the floor','Rounding the back','Hips shooting up before the chest'],br:'Big breath and brace before each rep; breathe out at the top.'},
 lunge:{label:'Lunge / single-leg',steps:['Stand tall holding {impl} (or hands on hips).','Take a controlled step (or set your back foot) and keep your torso upright.','Lower until both knees are bent about 90°, front knee over the middle of the foot.','Push through the front heel to return to standing.','Finish all reps on one side, then switch.'],bad:['Front knee collapsing inward','Short steps that put all the load on the knee','Leaning the torso forward'],br:'Breathe in down, out up.'},
 pushup:{label:'Push-up pattern',steps:['Set your hands slightly wider than your shoulders under {impl} with a straight line from head to heels.','Squeeze your glutes and brace your core.','Lower your chest toward the floor with elbows at about 45° from your body.','Press the floor away until your arms are straight.'],bad:['Sagging hips','Flaring elbows straight out','Half reps'],br:'Breathe in down, out as you press.'},
 bench:{label:'Horizontal press',steps:['Lie on your back with feet planted and shoulder blades pinched together, holding {impl} over your chest.','Lower the weight under control to the middle of your chest, elbows about 45° from your body.','Press it up in a slight arc until your arms are straight.','Keep your hips down and wrists stacked over elbows.'],bad:['Bouncing the weight off the chest','Flared elbows','Lifting your hips off the bench'],br:'Breathe in down, out as you press.'},
 press:{label:'Overhead press',steps:['Stand with feet hip-width apart and hold {impl} at shoulder height.','Squeeze your glutes and brace your core so you do not arch your lower back.','Press straight overhead, moving your head slightly back then through.','Finish with biceps by your ears and arms locked out.','Lower under control to your shoulders.'],bad:['Leaning back to push the weight up','Flaring ribs','Pressing the weight out in front of you'],br:'Breathe in at the bottom, out as you press.'},
 row:{label:'Row (horizontal pull)',steps:['Hinge forward with a flat back, knees soft, holding {impl} with arms hanging.','Pull your elbows back toward your hips, squeezing your shoulder blades together.','Pause for a second when the weight touches your lower ribs/stomach.','Lower slowly until your arms are straight again.'],bad:['Jerking with the lower back','Shrugging the shoulders','Cutting the range short'],br:'Breathe out as you pull.'},
 pullup:{label:'Vertical pull',steps:['Grip {impl} slightly wider than your shoulders and hang with arms straight (shoulders pulled down away from your ears).','Brace your core and slightly squeeze your glutes.','Pull your elbows down toward your ribs until your chin passes the bar / the handle reaches your upper chest.','Lower slowly until your arms are straight.'],bad:['Kipping or swinging','Half-range reps','Letting the shoulders hunch up'],br:'Breathe out as you pull.'},
 curl:{label:'Curl',steps:['Stand tall with {impl} in your hands, arms by your sides and elbows pinned.','Curl the weight toward your shoulders without moving your elbows.','Squeeze your biceps at the top for a second.','Lower slowly for 2–3 seconds until your arms are straight.'],bad:['Swinging the body','Elbows drifting forward','Dropping the weight quickly'],br:'Breathe out as you curl.'},
 tricep:{label:'Triceps extension / press-down',steps:['Set up with {impl} and your elbows tucked close to your head or sides.','Keep your upper arms still and straighten your elbows until your arms are fully extended.','Squeeze the triceps for a second.','Lower slowly back to the start.'],bad:['Elbows flaring out','Using body momentum','Short range of motion'],br:'Breathe out as you extend.'},
 raise:{label:'Raise / shoulder isolation',steps:['Stand tall holding {impl}, with a slight bend in your elbows.','Lift your arms (to the side, front or back depending on the move) to about shoulder height, leading with the elbows.','Pause briefly at the top.','Lower slowly for about 3 seconds.'],bad:['Shrugging the shoulders','Swinging with the hips','Using weights that are too heavy'],br:'Breathe out as you lift.'},
 plank:{label:'Plank / hold',steps:['Set up on your forearms or hands using {impl} with elbows under your shoulders.','Make a straight line from head to heels: squeeze your glutes and quads and tuck your ribs down.','Hold the position, breathing steadily.','Stop the set when your hips sag or lower back arches.'],bad:['Sagging hips','Hips piking up','Holding your breath'],br:'Breathe steadily; do not hold your breath.'},
 crunch:{label:'Core curl / twist / raise',steps:['Lie or hang as the exercise requires, with your lower back gently pressed toward the floor.','Curl your ribs toward your hips (or raise your knees) by bracing the abs, not by pulling on your neck.','Pause at the top for a second.','Lower slowly with control; keep tension in the abs throughout.'],bad:['Pulling on the neck','Using momentum','Letting the lower back arch off the floor'],br:'Breathe out as you contract.'},
 legraise:{label:'Leg raise / dead bug',steps:['Lie on your back with your arms by your sides and lower back pressed into the floor.','Raise your legs (or opposite arm and leg) to the start position.','Slowly lower while keeping your lower back flat.','Stop just before your back starts to arch, then return.'],bad:['Back arching off the floor','Swinging the legs','Rushing the lowering phase'],br:'Breathe out as you lower, in as you return.'},
 bridge:{label:'Bridge / hip thrust',steps:['Lie on your back with knees bent and feet flat about hip-width apart (shoulders on a bench for hip thrusts).','Tuck your ribs down and push through your heels.','Lift your hips until your body forms a straight line from shoulders to knees.','Squeeze your glutes for a second at the top, then lower slowly.'],bad:['Over-arching the lower back','Pushing through the toes','Knees falling inward'],br:'Breathe out as you lift.'},
 calf:{label:'Calf raise / ankle work',steps:['Stand tall on the balls of your feet (hold something for balance if needed).','Rise as high as you can onto your toes.','Pause for a second at the top.','Lower slowly until your heels are below or level with the toes for a full stretch.'],bad:['Bouncing','Short range','Rolling the ankles outward'],br:'Breathe out as you rise.'},
 jump:{label:'Jump / landing',steps:['Stand with feet shoulder-width apart; swing your arms back and dip into a quarter squat.','Explode up, driving your arms forward and fully extending hips, knees and ankles.','Land softly on the balls of your feet, absorbing the force by bending your hips and knees.','Stand tall and reset fully between reps — quality over quantity.'],bad:['Landing with stiff, straight knees','Knees caving inward on landing','Doing reps while tired'],br:'Breathe out as you jump; reset your breath on each rep.'},
 throw:{label:'Throw / rotational power',steps:['Stand athletic, feet shoulder-width apart, holding {impl}.','Load by turning your hips and shoulders away from the target.','Drive from the legs, then hips, then shoulders and arms, releasing explosively.','Catch or reset, then repeat on the other side.'],bad:['Using only the arms','Letting the lower back twist instead of the hips','Going slow — this is power work'],br:'Breathe out forcefully on the throw.'},
 carry:{label:'Carry / walk',steps:['Pick up {impl} and stand tall with ribs down and shoulders back.','Walk with controlled steps; do not lean or twist.','Keep your grip tight and shoulders packed down.','Set the weight down under control at the end of the set.'],bad:['Leaning sideways','Letting your shoulders round forward','Taking very short, rushed steps'],br:'Breathe steadily while you walk.'},
 swing:{label:'Hip-drive swing',steps:['Stand slightly wider than your hips holding {impl} with both hands.','Hike the weight back between your legs by hinging your hips.','Snap your hips forward powerfully so the weight floats to chest height.','Let it fall back and hinge again — the power comes from the hips, not the arms.'],bad:['Squatting the swing','Using the arms to lift','Rounding the back'],br:'Breathe out sharply at the top of each swing.'},
 clean:{label:'Clean / power pull',steps:['Start with {impl} just in front of your shins, back flat, shoulders over the load.','Push the floor away, then explosively extend hips, knees and ankles.','Shrug and pull your elbows up, then drop under the load and catch it at your shoulders.','Stand tall, then lower with control to reset.'],bad:['Pulling early with the arms','Letting the load swing away from you','Catching with a rounded back'],br:'Big breath before each rep; breathe out after the catch.'},
 slrdl:{label:'Single-leg hinge / balance reach',steps:['Stand on one leg with a soft knee, holding {impl} if the exercise uses weight.','Hinge at the hip, sending the other leg straight back as your chest lowers.','Keep your hips level and your back flat until you feel the hamstring stretch.','Squeeze your glute and return to standing; finish all reps on one side first.'],bad:['Rotating the hips open','Rounding the back','Rushing — balance is part of the exercise'],br:'Breathe in on the way down, out up.'},
 nordic:{label:'Nordic hamstring curl',steps:['Kneel on a pad with your ankles held down (partner, sofa or heavy object).','Keep your body in a straight line from knees to head, hips extended.','Lower your body forward as slowly as you can, using your hamstrings to resist.','Catch yourself with your hands at the bottom, then push back up (use as little push as possible).'],bad:['Bending at the hips','Dropping fast','Skipping the controlled lowering'],br:'Breathe steadily; brace your core throughout.'},
 hang:{label:'Hang / grip',steps:['Grip {impl} with both hands about shoulder-width apart.','Pull your shoulders down away from your ears and engage your core.','Hold as long as the set prescribes, breathing normally.','Step down (do not drop) when your grip starts to fail.'],bad:['Shrugging into the ears','Holding your breath','Swinging'],br:'Breathe steadily.'}
};

/* ---- name rules -> template ---- */
var RULES = [
 [/Overhead squat/i,'squat'],
 [/slam|throw|chest pass|woodchop|windmill|get-up|Landmine rotation|Surf pop|Band explosive|Half-kneeling band rotation|rotational reach/i,'throw'],
 [/external rotation/i,'curl'],
 [/Single-leg (Romanian|RDL)|balance reach/i,'slrdl'],
 [/Nordic/i,'nordic'],
 [/jump|bound|pogo|hop|drop-landing|Explosive step-up|Squat jump/i,'jump'],
 [/swing/i,'swing'],
 [/Conventional|Deficit|deadlift|Good morning|Back extension|Romanian|RDL/i,'hinge'],
 [/clean|snatch|to shoulder/i,'clean'],
 [/Adductor squeeze/i,'bridge'],
 [/Pallof/i,'plank'],
 [/hip thrust|bridge|Hamstring curl|Slider|towel hamstring/i,'bridge'],
 [/lateral walk|Sled|carry/i,'carry'],
 [/Tibialis|calf|Calf|eversion/i,'calf'],
 [/knee raise|leg raise|Tuck front-lever|Dead bug|Flutter|march/i,'legraise'],
 [/lunge|split squat|step-up|step-down|Cossack|Shrimp|Bulgarian|Pistol/i,'lunge'],
 [/Dead hang|Towel hang|Lock-off|Farmer hold|Heavy backpack hold|Finger/i,'hang'],
 [/rear-delt/i,'raise'],
 [/Wrist curl/i,'curl'],
 [/Leg extension|Sissy|Leg press/i,'squat'],
 [/neck|Neck|Chin tuck/i,'plank'],
 [/extension|pushdown|skull|Skull/i,'tricep'],
 [/Push-?ups?|press-up|Explosive push|Archer|planche|Scapular push|Wide-grip push|dips?\b/i,'pushup'],
 [/bench press|floor press|Chest press|fly\b|Cable fly|Pec/i,'bench'],
 [/Overhead|shoulder press|Push press|Landmine press|Kettlebell press|Pike|handstand|Banded overhead/i,'press'],
 [/Pull-ups?|chin-up|pulldown|Pulldown|Typewriter|Muscle-up|pullover/i,'pullup'],
 [/row|Row|pull-apart|Face pull|Y-T|Wall slides|Serratus/i,'row'],
 [/raise|Raise|lateral/i,'raise'],
 [/curl|Curl/i,'curl'],
 [/plank|Plank|L-sit|Hollow|Copenhagen|hold|squeeze|isometric|Isometric|Wall sit|Spanish/i,'plank'],
 [/crunch|twist|Russian/i,'crunch'],
 [/squat|Squat/i,'squat']
];
var PAT_DEFAULT = {squat:'squat',hinge:'hinge',lunge:'lunge',hpush:'pushup',vpush:'press',hpull:'row',vpull:'pullup',core:'plank',biceps:'curl',triceps:'tricep',calves:'calf',glutes:'bridge',reardelt:'row',plyo:'jump',plyoU:'throw',rot:'throw',ham:'bridge',adduct:'lunge',ankle:'calf',shoulder:'row',grip:'hang',carry:'carry',neck:'plank',olympic:'clean',sdelt:'raise',fly:'bench',quad:'squat'};
var IMPL = {barbell:'a barbell',dumbbell:'dumbbells',kettlebell:'a kettlebell',bands:'a resistance band',machine:'the machine / cable',pullup:'the pull-up bar',medball:'a medicine ball',bench:'a bench',none:'your bodyweight'};
var TIPS = [
 [/Nordic/,'Go as slowly as you can on the way down — the lowering (eccentric) phase is what protects your hamstrings. Start with 3 reps and build up.'],
 [/Copenhagen/,'Top leg rests on a bench; keep your hips high and body in a straight line. Start with the knee supported if the full version is too hard.'],
 [/Turkish get-up/,'Keep your eyes on the weight and move in slow, deliberate steps: roll, post up, bridge, lunge, stand — then reverse.'],
 [/Face pull|Band pull-apart|Prone Y-T|rear-delt/i,'Think “pull the rope apart” and finish with your hands by your ears or sides; this is a light, high-control exercise.'],
 [/Pause/,'Pause for a full 1–2 seconds at the bottom with the bar completely still, then drive up.'],
 [/Eccentric step-down/,'Stand on a step and lower the other foot toward the floor over 3–4 seconds, then tap and return.'],
 [/Single-leg calf|Tibialis/,'Slow and controlled: 2 seconds up, 1 second hold, 3 seconds down.'],
 [/Dead hang|Lock-off/,'Pull your shoulders down and back, not up toward your ears; stop before your grip or shoulders give out.'],
 [/medicine-ball|Medicine-ball/i,'Aim for speed: stop the set when your throws start to slow down, not when you are exhausted.'],
 [/Landmine/,'Press up and slightly forward in an arc; keep your ribs down and glutes tight.'],
 [/Hanging knee raise|Hanging/,'Avoid swinging: pull your shoulders down and curl your pelvis up toward your ribs.'],
 [/Wall sit/,'Back flat on the wall, thighs parallel to the floor, knees over ankles. Hold for time.'],
 [/Plank|Side plank/,'Squeeze glutes and quads and keep your ribs pulled down; quit the set when form breaks.']
];

function templateFor(name, pat){
  if(pat==='biceps') return 'curl';
  if(pat==='triceps' && !/press|dips?|push-up/i.test(name)) return 'tricep';
  if(pat==='hpush' && /press/i.test(name)) return 'bench';
  for(var i=0;i<RULES.length;i++) if(RULES[i][0].test(name)) return RULES[i][1];
  return PAT_DEFAULT[pat] || 'squat';
}
function info(name){
  var ex = (typeof EX!=='undefined' ? EX : []).filter(function(e){return e[0]===name;})[0];
  var pat = ex ? ex[1] : '', eq = ex ? ex[2] : 'none';
  var tpl = templateFor(name, pat);
  var impl = eq.split('+')[0]; var tipEntries = TIPS.filter(function(t){return t[0].test(name);});
  return {tpl:tpl, pat:pat, eq:eq, impl:IMPL[impl]||'your bodyweight', tips: tipEntries.map(function(t){return t[1];})};
}

/* ---- drawing ---- */
function lerp(a,b,u){ return a+(b-a)*u; }
function mix(A,B,u){ var o={}; for(var k in A) if(typeof A[k]==='number') o[k]=B[k]!==undefined?lerp(A[k],B[k],u):A[k]; else o[k]=A[k]; if(A.abs&&B.abs) o.abs=[lerp(A.abs[0],B.abs[0],u),lerp(A.abs[1],B.abs[1],u)]; for(var k2 in B) if(o[k2]===undefined) o[k2]=B[k2]; return o; }
function fk(p){
  var sin=function(x){return Math.sin(x*D);}, cos=function(x){return Math.cos(x*D);};
  var sc = p.sc||0.8, L = {torso:44*sc, ua:26*sc, fa:24*sc, th:38*sc, sh:38*sc, foot:13*sc};
  var hd = p.n!==undefined ? p.n : p.t;
  var sho=[L.torso*sin(p.t), -L.torso*cos(p.t)];
  var head=[sho[0]+14*sc*sin(hd), sho[1]-14*sc*cos(hd)];
  var el=[sho[0]+L.ua*sin(p.a), sho[1]+L.ua*cos(p.a)];
  var wr=[el[0]+L.fa*sin(p.f), el[1]+L.fa*cos(p.f)];
  function leg(th,s,ft){ var kn=[L.th*sin(th),L.th*cos(th)]; var an=[kn[0]+L.sh*sin(s),kn[1]+L.sh*cos(s)]; var to=[an[0]+L.foot*cos(ft),an[1]+L.foot*sin(ft)]; return {kn:kn,an:an,to:to}; }
  var l1=leg(p.th,p.s,p.ft||0), l2=leg(p.th2!==undefined?p.th2:p.th, p.s2!==undefined?p.s2:p.s, p.ft2!==undefined?p.ft2:(p.ft||0));
  var pts={hip:[0,0],sho:sho,head:head,el:el,wr:wr,l1:l1,l2:l2};
  // anchor
  var dx=0, dy=0, ax=p.ax||105;
  if(p.g==='abs'){ dx=p.abs[0]; dy=p.abs[1]; }
  else if(p.g==='bar'){ dx=ax-wr[0]; dy=20-wr[1]; }
  else if(p.g==='hands'){ dy=GY-wr[1]; dx=ax-wr[0]; }
  else if(p.g==='knee'){ dy=GY-l1.kn[1]; dx=ax-l1.kn[0]; }
  else { var low=Math.max(l1.an[1],l1.to[1],l2.an[1],l2.to[1]); if(p.g==='both') low=Math.max(low,wr[1]); dy=GY-low; dx=ax-(p.g==='both'?l1.to[0]:l1.an[0]); }
  dy -= (p.lift||0);
  function tr(q){ return [q[0]+dx,q[1]+dy]; }
  return {sc:sc,hip:tr(pts.hip),sho:tr(sho),head:tr(head),el:tr(el),wr:tr(wr),l1:{kn:tr(l1.kn),an:tr(l1.an),to:tr(l1.to)},l2:{kn:tr(l2.kn),an:tr(l2.an),to:tr(l2.to)}};
}
function ln(a,b,cls,op){ return '<line class="'+cls+'" x1="'+a[0].toFixed(1)+'" y1="'+a[1].toFixed(1)+'" x2="'+b[0].toFixed(1)+'" y2="'+b[1].toFixed(1)+'"'+(op?' opacity="'+op+'"':'')+'/>'; }
function draw(p, tpl, impl, eq){
  var f=fk(p), s='';
  // environment
  s += '<line class="gnd" x1="10" y1="'+GY+'" x2="230" y2="'+GY+'"/>';
  if(p.g==='bar'||tpl==='hang'||tpl==='pullup') s += '<line class="rig" x1="60" y1="20" x2="150" y2="20"/><line class="rig" x1="60" y1="20" x2="60" y2="'+GY+'"/><line class="rig" x1="150" y1="20" x2="150" y2="'+GY+'"/>';
  if(tpl==='bench') s += '<rect class="bch" x="40" y="140" width="110" height="8" rx="2"/>';
  // far limbs
  s += ln(f.hip,f.l2.kn,'lim',.4)+ln(f.l2.kn,f.l2.an,'lim',.4)+ln(f.l2.an,f.l2.to,'lim',.4);
  s += ln(f.sho,f.el,'lim',.4)+ln(f.el,f.wr,'lim',.4);
  // torso + near limbs
  s += ln(f.hip,f.sho,'bod');
  s += ln(f.hip,f.l1.kn,'lim')+ln(f.l1.kn,f.l1.an,'lim')+ln(f.l1.an,f.l1.to,'lim');
  s += ln(f.sho,f.el,'lim')+ln(f.el,f.wr,'lim');
  s += '<circle class="hd" cx="'+f.head[0].toFixed(1)+'" cy="'+f.head[1].toFixed(1)+'" r="'+(9*f.sc).toFixed(1)+'"/>';
  // joints
  [f.hip,f.sho,f.el,f.wr,f.l1.kn,f.l1.an].forEach(function(j){ s+='<circle class="jt" cx="'+j[0].toFixed(1)+'" cy="'+j[1].toFixed(1)+'" r="3"/>'; });
  // implement at the hands
  var w=f.wr;
  if(eq==='barbell'){ var at = (tpl==='squat') ? f.sho : w; s += '<circle class="eqp" cx="'+at[0].toFixed(1)+'" cy="'+at[1].toFixed(1)+'" r="11"/>'; }
  else if(eq==='dumbbell'||eq==='kettlebell'){ s += '<rect class="eqp" x="'+(w[0]-6).toFixed(1)+'" y="'+(w[1]-4).toFixed(1)+'" width="12" height="8" rx="3"/>'; }
  else if(eq==='medball'){ s += '<circle class="eqp" cx="'+w[0].toFixed(1)+'" cy="'+(w[1]-8).toFixed(1)+'" r="9"/>'; }
  else if(eq==='bands'){ s += '<line class="band" x1="'+w[0].toFixed(1)+'" y1="'+w[1].toFixed(1)+'" x2="'+(w[0]-70)+'" y2="'+(GY-6)+'"/>'; }
  else if(eq==='machine'){ s += '<line class="band" x1="'+w[0].toFixed(1)+'" y1="'+w[1].toFixed(1)+'" x2="'+(w[0]+(tpl==='pullup'?0:60))+'" y2="'+(tpl==='pullup'?18:20)+'"/>'; }
  return '<svg viewBox="0 0 240 170" role="img" aria-label="Animated demonstration">'+s+'</svg>';
}

/* ---- modal ---- */
var modal, raf, running=false, speed=1, t0=0, cur=null, reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function ensureModal(){
  if(modal) return modal;
  modal = document.createElement('div'); modal.id='demo'; modal.hidden=true;
  modal.innerHTML = '<div class="demo-box" role="dialog" aria-modal="true" aria-labelledby="demo-title"><button class="demo-x" aria-label="Close">✕</button><h3 id="demo-title"></h3><div class="demo-sub" id="demo-sub"></div><div class="demo-fig" id="demo-fig"></div><div class="demo-ctl"><button id="demo-play">⏸ Pause</button><button id="demo-speed">1× speed</button></div><div id="demo-body"></div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e){ if(e.target===modal || e.target.className==='demo-x') close(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && !modal.hidden) close(); });
  modal.querySelector('#demo-play').onclick = function(){ running=!running; this.textContent = running?'⏸ Pause':'▶ Play'; if(running){ t0=performance.now()-(cur?cur.phase:0); loop(); } };
  modal.querySelector('#demo-speed').onclick = function(){ speed = speed===1?0.5:speed===0.5?1.5:1; this.textContent = speed+'× speed'; };
  return modal;
}
function frame(ts){
  if(!cur) return;
  var cycle = 3200/speed, ph = ((ts-t0)*speed)%3200; cur.phase = ph;
  // 0..1 ease: hold A, move to B, hold B, move back
  var x = ph/3200, u;
  if(x<.1) u=0; else if(x<.45) u=(x-.1)/.35; else if(x<.55) u=1; else if(x<.9) u=1-(x-.55)/.35; else u=0;
  u = u*u*(3-2*u);
  document.getElementById('demo-fig').innerHTML = draw(mix(cur.T.A,cur.T.B,u), cur.tpl, cur.impl, cur.eq);
}
function loop(){ if(!running) return; frame(performance.now()); raf = requestAnimationFrame(loop); }
function close(){ running=false; cancelAnimationFrame(raf); modal.hidden=true; document.body.classList.remove('demo-open'); cur=null; if(close.back) close.back.focus(); }
window.showDemo = function(name, meta){
  var inf = info(name), tpl = S[inf.tpl] ? inf.tpl : 'squat', T0 = T[tpl], st = S[tpl];
  ensureModal(); close.back = document.activeElement;
  cur = {T:T0, tpl:tpl, impl:{name:name}, eq:inf.eq.split('+')[0], phase:0};
  document.getElementById('demo-title').textContent = name;
  document.getElementById('demo-sub').textContent = (meta && meta.tag ? meta.tag+' · ' : '') + st.label + ' · uses ' + inf.impl;
  var steps = st.steps.map(function(x){ return '<li>'+x.replace('{impl}',inf.impl)+'</li>'; }).join('');
  var extra = inf.tips.length ? '<p class="demo-cue">💡 '+inf.tips.join(' ')+'</p>' : '';
  var rx = meta && meta.sets ? '<div class="demo-rx"><b>Your prescription:</b> '+meta.sets+' × '+meta.reps+(meta.rest?' · rest '+meta.rest:'')+(meta.target?'<br>'+meta.target:'')+'</div>' : '';
  document.getElementById('demo-body').innerHTML = rx + '<h4>How to do it</h4><ol>'+steps+'</ol>'+extra+'<h4>Common mistakes</h4><ul>'+st.bad.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul><p class="demo-br">🫁 '+st.br+'</p><p class="demo-note">The animation shows the general movement pattern from the side. Start light, keep every rep controlled, and stop if you feel sharp pain.</p>';
  modal.hidden=false; document.body.classList.add('demo-open');
  running = !reduce; var pb=document.getElementById('demo-play'); pb.textContent = running?'⏸ Pause':'▶ Play';
  document.getElementById('demo-fig').innerHTML = draw(T0.A, tpl, cur.impl, cur.eq);
  t0 = performance.now(); if(running) loop(); else document.getElementById('demo-fig').innerHTML = draw(mix(T0.A,T0.B,1), tpl, cur.impl, cur.eq);
  modal.querySelector('.demo-x').focus();
};
window.DEMO_TEMPLATES = T; window.demoDraw = draw; window.demoMix = mix; window.demoInfo = info;
})();
