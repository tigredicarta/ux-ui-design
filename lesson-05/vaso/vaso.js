/* Local teaching prototype. No network calls and no real plant-care scheduling. */
(() => {
  const screen = document.querySelector('#screen');
  const KEY = 'vaso-lesson05-v1';
  const params=new URLSearchParams(location.search);
  let version=params.get('v')==='first'?'first':'improved', layout=['menu','hub'].includes(params.get('layout'))?params.get('layout'):'tabs', trace=[], done=null;
  const plants = [
    {id:'basil',name:'Basil',place:'Kitchen windowsill',species:'Ocimum basilicum'},
    {id:'monstera',name:'Monstera',place:'Living room',species:'Monstera deliciosa'},
    {id:'pothos',name:'Pothos',place:'Bedroom shelf',species:'Epipremnum aureum'}
  ];
  const defaults = () => ({pause:null,history:{},times:{basil:'09:00',monstera:'10:00',pothos:'09:30'}});
  let state;
  try { const saved=JSON.parse(localStorage.getItem(KEY)); state=defaults(); if(saved && typeof saved==='object'){if(saved.pause && /^\d{4}-\d{2}-\d{2}$/.test(saved.pause.start) && /^\d{4}-\d{2}-\d{2}$/.test(saved.pause.end))state.pause=saved.pause; for(const p of plants){if(Array.isArray(saved.history?.[p.id]))state.history[p.id]=saved.history[p.id].filter(x=>typeof x==='string').slice(0,50);if(/^\d{2}:\d{2}$/.test(saved.times?.[p.id]))state.times[p.id]=saved.times[p.id];}} } catch {state=defaults();}
  const esc = x => String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const later = n => {const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const dateLabel = x => new Date(x+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long'});
  const save = () => {try{localStorage.setItem(KEY,JSON.stringify(state));}catch{notify('Changes will last for this session only.');}};
  function notify(text) {const n=document.querySelector('#notice');n.textContent=text;n.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.classList.remove('show'),2600);}
  function pauseState(){if(state.pause && state.pause.end<=today()){state.pause=null;save();}return state.pause ? (state.pause.start<=today()?'active':'scheduled') : 'none';}
  // Line icons, 24px grid, drawn with currentColor so they follow the selected state.
  const ICON = {
    plants:'<path d="M6.5 13.5h11l-1.6 7H8.1z"/><path d="M12 13.5V8"/><path d="M12 10.5C12 7.4 10 5.5 6.5 5.5c0 3.1 2 5 5.5 5z"/><path d="M12 8.5c0-2.8 1.9-4.5 5.5-4.5 0 2.8-1.9 4.5-5.5 4.5z"/>',
    reminders:'<circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.5 1.8"/><path d="M4.5 6 7.5 3.5M19.5 6l-3-2.5"/>',
    guides:'<path d="M12 6.5C10 5 7.5 4.5 4 4.5v13c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2v-13c-3.5 0-6 .5-8 2z"/><path d="M12 6.5v13"/>',
    database:'<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
    notifications:'<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    camera:'<path d="M3.5 8h4L9 5.5h6L16.5 8h4v11.5h-17z"/><circle cx="12" cy="13.5" r="3.5"/>',
    settings:'<path d="M4 7h9.5M18.5 7H20M4 17h3.5M12.5 17H20"/><circle cx="16" cy="7" r="2.3"/><circle cx="10" cy="17" r="2.3"/>',
    more:'<circle cx="6" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18" cy="12" r="1.4" fill="currentColor"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    close:'<path d="M6 6l12 12M18 6 6 18"/>'
  };
  const icon = n => `<svg class="icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON[n]}</svg>`;
  const SECTIONS = [['plants','My plants'],['reminders','Reminders'],['guides','Care guides']];
  const LEGACY = [['database','Database'],['notifications','Notifications'],['camera','Camera'],['settings','Settings'],['more','More']];
  const home = () => version==='first'?'database':layout==='hub'?'home':'plants';
  function nav(section){
    const first=version==='first', bar=document.querySelector('.main-nav'), brand=document.querySelector('.brand');
    const items=first?LEGACY:SECTIONS;
    const selected=first?({plants:'database',reminders:'settings',guides:'more'}[section]||section):section;
    bar.className='main-nav'+(first?' legacy-nav':layout==='menu'?' menu-nav':'');
    // A home page with links replaces the bar: people return to Home to switch section.
    bar.hidden=!first&&layout!=='tabs';
    bar.removeAttribute('id');
    bar.innerHTML=items.map(([id,label])=>`<a href="#${id}" data-section="${id}" ${selected===id?'aria-current="page"':''}>${icon(id)}<span>${label}</span></a>`).join('');
    brand.querySelector('a').href='#'+home();
    brand.querySelector('a').setAttribute('aria-label',first?'Vaso, database':layout==='hub'?'Vaso, home':'Vaso, my plants');
    document.querySelector('#menu-toggle')?.remove();
    brand.querySelector('span').hidden=!first&&layout==='menu';
    if(!first&&layout==='menu'){
      const b=document.createElement('button');b.id='menu-toggle';b.className='menu-toggle';b.type='button';
      b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','primary-navigation');b.setAttribute('aria-label','Open menu');
      b.innerHTML=icon('menu');bar.id='primary-navigation';
      const set=open=>{bar.hidden=!open;b.setAttribute('aria-expanded',String(open));b.setAttribute('aria-label',open?'Close menu':'Open menu');b.innerHTML=icon(open?'close':'menu');};
      b.addEventListener('click',()=>set(bar.hidden));
      bar.addEventListener('keydown',e=>{if(e.key==='Escape'){set(false);b.focus();}});
      brand.append(b);
    }
  }
  function teachingNotes(){
    const first=version==='first';
    document.querySelectorAll('[data-version]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.version===version)));
    document.querySelector('#navigation-example').disabled=first;
    document.querySelector('#design-notes').innerHTML=first?'<h2>A · First draft</h2><p>The menu mixes technical categories. “Notifications” shows messages, while reminder controls live in Settings. The person has to work out the distinction.</p><p>The task is available under <strong>Settings / Notifications / Reminder delivery</strong>.</p>':'<h2>B · Reorganised</h2><p>The reminder schedule and pause share a clear home: <strong>Reminders</strong>. The action says <strong>Pause while away</strong>, and the result says when reminders resume.</p><p>Use the layout selector to compare a bottom bar, a menu and a home page with the same contents.</p>';
    document.querySelector('#route-trace').innerHTML=trace.map(t=>'<li>'+esc(t)+'</li>').join('');
    document.querySelector('#navigation-example').value=layout;
    const r=document.querySelector('#task-result');
    r.hidden=!done;
    if(done)r.innerHTML='<strong>Task done in '+done.steps+' screens</strong> (version '+(done.version==='first'?'A':'B')+'). '+(done.version==='first'?'Now try version B and compare the route.':'Compare with version A: where did you have to guess?');
  }
  const initial = p => `<span class="plant-initial ${p.id}" aria-hidden="true">${p.name[0]}</span>`;
  const back = (href,text) => `<a class="back" href="#${href}">‹ ${text}</a>`;
  function render(){
    let raw=location.hash.slice(1)||home();
    if(raw==='home'&&(version==='first'||layout!=='hub'))raw=home();
    const first=version==='first';
    const route=raw==='database'?'plants':raw==='settings/notifications'?'reminders':raw==='legacy/pause'?'pause':raw;
    const remindersRoute=first?'settings/notifications':'reminders';
    const status=pauseState();
    const section=route.startsWith('plant/')?'plants':route==='pause'||route.startsWith('time/')?'reminders':route.startsWith('guide/')?'guides':route;
    nav(section);
    if(route==='home'){
      const info={plants:'3 plants at home',reminders:status==='active'?'Paused until '+dateLabel(state.pause.end):status==='scheduled'?'Pause from '+dateLabel(state.pause.start):'3 reminders a day',guides:'Watering, light and plant problems'};
      screen.innerHTML='<div class="eyebrow">Good to see you</div><h1>Your plants, at home.</h1><p class="intro">Choose where to go. Come back here to switch section.</p><div class="hub-list">'+SECTIONS.map(([id,label])=>`<a class="hub-link${id==='reminders'&&status==='active'?' is-paused':''}" href="#${id}"><span class="hub-icon">${icon(id)}</span><span><strong>${label}</strong><small>${info[id]}</small></span><span class="arrow" aria-hidden="true">›</span></a>`).join('')+'</div>';
    } else if(route==='settings'){
      screen.innerHTML='<div class="eyebrow">Vaso configuration</div><h1>Settings</h1><p class="intro">Configure application preferences.</p><a class="settings-link" href="#settings/notifications"><h2>Notifications <span class="arrow">›</span></h2><small>Delivery preferences and schedules</small></a><div class="quiet-box"><h3>Device preferences</h3><p>Other device settings are outside this teaching example.</p></div>';
    } else if(route==='notifications'){
      screen.innerHTML='<div class="eyebrow">System messages</div><h1>Notifications</h1><p class="intro">Recent messages from Vaso.</p><div class="reminder-item"><div><h3>Plant record created</h3><p>Basil · Example message</p></div></div><div class="reminder-item"><div><h3>Care check reminder</h3><p>Monstera · Example message</p></div></div><div class="reminder-item"><div><h3>Plant record created</h3><p>Pothos · Example message</p></div></div>';
    } else if(route==='camera'){
      screen.innerHTML='<div class="eyebrow">Plant image records</div><h1>Camera</h1><p class="intro">Plant photos would live here. Photo capture is outside this reminder-task prototype.</p>'+plants.map(p=>`<a class="plant-link" href="#plant/${p.id}">${initial(p)}<div><h3>${p.name}</h3><small>Open plant record</small></div><span class="arrow">›</span></a>`).join('');
    } else if(route==='more'){
      screen.innerHTML='<h1>More</h1><a class="settings-link" href="#guides"><h2>Care guides <span class="arrow">›</span></h2><small>Watering, light and plant problems</small></a><div class="quiet-box"><h3>Vaso</h3><p>A fictional app for the Lesson 05 demonstration.</p></div>';
    } else if(route==='plants'){
      screen.innerHTML=`<div class="eyebrow">${first?'Plant records':'Your small green corner'}</div><h1>${first?'Database':'My plants'}</h1><p class="intro">A place for every plant and the care you give it.</p><div class="section-title"><h2>At home</h2><span class="count">3 plants</span></div>${plants.map(p=>`<a class="plant-link" href="#plant/${p.id}">${initial(p)}<div><h3>${p.name}</h3><small>${p.place}</small></div><span class="arrow" aria-hidden="true">›</span></a>`).join('')}${first?'<div class="quiet-box"><h3>3 plant records</h3><p>Open a record for its details and saved care history.</p></div>':'<div class="quiet-box"><h3>Going away?</h3><p>You can pause your reminders while someone else looks after your plants.</p><a href="#reminders">Go to Reminders</a></div>'}`;
    } else if(route==='reminders'){
      screen.innerHTML=`<div class="eyebrow">A gentle nudge</div><h1>Reminders</h1><p class="intro">Keep track of care, on your own schedule.</p>${status!=='none'?`<div class="paused"><span class="status">${status==='active'?'Ⅱ Paused':'Pause scheduled'}</span><h2>${status==='active'?'Paused until '+dateLabel(state.pause.end):'Pausing from '+dateLabel(state.pause.start)}</h2><p>All your Vaso reminders ${status==='active'?'are paused':'will pause'}. They resume on ${dateLabel(state.pause.end)}.</p><a class="small-link" href="#pause">Change dates</a></div><button class="button secondary" id="resume">${status==='active'?'Resume reminders now':'Cancel scheduled pause'}</button>`:`<a class="task-link" href="#pause"><h2>Pause while away</h2><p>Pause all reminders for the dates you are away. They resume when you return.</p><span class="arrow" aria-hidden="true">›</span></a>`}<div class="section-title"><h2>Reminder schedule</h2><span class="count">${status==='active'?'Paused':'3 reminders'}</span></div>${plants.map(p=>`<div class="reminder-item"><div><h3>${p.name}</h3><p>Check plant care · ${esc(state.times[p.id])}</p></div><a href="#time/${p.id}" aria-label="Change ${p.name} reminder time">Change</a></div>`).join('')}<p class="subtle">Example times for the demo. Check your plant’s needs before watering.</p>`;
      document.querySelector('#resume')?.addEventListener('click',()=>{state.pause=null;save();render();notify(status==='active'?'Reminders resumed.':'Scheduled pause cancelled.');});
      if(first){
        screen.querySelector('h1').textContent='Notifications';
        screen.querySelector('.eyebrow').textContent='Delivery preferences';
        screen.querySelector('.intro').textContent='Notification delivery configuration.';
        const task=screen.querySelector('.task-link');
        if(task){task.href='#legacy/pause';task.querySelector('h2').textContent='Reminder delivery';task.querySelector('p').textContent='Set a delivery exception period.';}
        const change=screen.querySelector('.small-link');if(change)change.href='#legacy/pause';
        screen.insertAdjacentHTML('afterbegin',back('settings','Settings'));
      }
    } else if(route==='pause'){
      screen.innerHTML=`${back('reminders','Reminders')}<h1>Pause while away</h1><p class="intro">Someone else looking after your plants? Pause your reminders until you return.</p><form id="pause-form" class="form-card" novalidate><p class="scope">Applies to all 3 plant reminders. Your plant details and care history stay available.</p><label for="pause-start">Pause from</label><input id="pause-start" type="date" required min="${today()}" value="${state.pause?.start||today()}"><label for="pause-end">Resume reminders on</label><input id="pause-end" type="date" required min="${later(1)}" value="${state.pause?.end||later(14)}"><p id="date-error" class="error" role="alert"></p><button class="button" type="submit">Save pause</button></form><p class="subtle">You can change these dates or resume early in Reminders.</p>`;
      document.querySelector('#pause-form').addEventListener('submit',e=>{
        e.preventDefault();const a=document.querySelector('#pause-start'),b=document.querySelector('#pause-end'),err=document.querySelector('#date-error');
        a.removeAttribute('aria-invalid');b.removeAttribute('aria-invalid');
        if(!a.value||!b.value){err.textContent='Choose both dates.';(!a.value?a:b).setAttribute('aria-invalid','true');(!a.value?a:b).focus();return;}
        if(a.value<today() && a.value!==state.pause?.start){err.textContent='Choose today or a later start date.';a.setAttribute('aria-invalid','true');a.focus();return;}
        if(b.value<=a.value||b.value<=today()){err.textContent='Choose a resume date after the start date and after today.';b.setAttribute('aria-invalid','true');b.focus();return;}
        state.pause={start:a.value,end:b.value};save();done={steps:trace.length,version};location.hash=remindersRoute;notify('Pause saved.');
      });
      if(first){screen.querySelector('.back').href='#settings/notifications';screen.querySelector('.back').textContent='‹ Notifications';screen.querySelector('h1').textContent='Reminder delivery';screen.querySelector('.intro').textContent='Set a delivery exception period.';}
    } else if(route.startsWith('plant/')){
      const p=plants.find(p=>p.id===route.split('/')[1]);if(!p)return fallback();
      const history=state.history[p.id]||[];
      screen.innerHTML=`${back(first?'database':'plants',first?'Database':'My plants')}<div class="plant-hero">${initial(p)}<div><div class="eyebrow">${p.place}</div><h1>${p.name}</h1><p class="intro">${p.species}</p></div></div><div class="quiet-box"><h3>A record of your care</h3><p>Already watered this plant? Add it to the care history.</p></div><button class="button yellow" id="record-care">${history.includes(today())?'Watering recorded today':'Record watering'}</button><div class="section-title"><h2>Care history</h2></div>${history.length?`<ul class="history">${history.map(d=>`<li>Watering recorded · ${esc(dateLabel(d))}</li>`).join('')}</ul>`:'<p class="subtle">No care recorded yet.</p>'}<a class="button secondary" href="#time/${p.id}">Change reminder time</a><a class="text-button" href="#guides">Explore care guides</a>`;
      document.querySelector('#record-care').addEventListener('click',()=>{if(history.includes(today())){notify('Today’s watering is already recorded.');return;}state.history[p.id]=[today(),...history];save();render();notify('Watering recorded.');});
    } else if(route.startsWith('time/')){
      const p=plants.find(p=>p.id===route.split('/')[1]);if(!p)return fallback();
      screen.innerHTML=`${back(remindersRoute,first?'Notifications':'Reminders')}<h1>${p.name} reminder</h1><p class="intro">Choose the time for this demo reminder.</p><form id="time-form"><label for="reminder-time">Reminder time</label><input id="reminder-time" type="time" required value="${esc(state.times[p.id])}"><button class="button" type="submit">Save time</button></form><p class="subtle">Changing the time keeps any holiday pause in place.</p>`;
      document.querySelector('#time-form').addEventListener('submit',e=>{e.preventDefault();state.times[p.id]=document.querySelector('#reminder-time').value;save();location.hash=remindersRoute;notify('Reminder time updated.');});
    } else if(route==='guides'){
      screen.innerHTML=`<div class="eyebrow">Get to know your plants</div><h1>Care guides</h1><p class="intro">Start with the basics. Every plant and home is different.</p><a class="guide-link" href="#guide/watering"><h2>Watering advice <span class="arrow">›</span></h2><p>Check before you reach for the watering can.</p></a><a class="guide-link" href="#guide/light"><h2>Light advice <span class="arrow">›</span></h2><p>Notice the light where your plant lives.</p></a><a class="guide-link" href="#guide/problems"><h2>Plant problems <span class="arrow">›</span></h2><p>Keep a note of changes over time.</p></a><p class="subtle">Short sample content to demonstrate the app structure.</p>`;
    } else if(route.startsWith('guide/')){
      const articles={watering:['Watering advice','A reminder is a prompt to check your plant, rather than an instruction to add water every time.','Notice the soil and the plant’s condition. Use guidance specific to its species and growing conditions.'],light:['Light advice','Notice how the light changes in your home during the day.','A position that suits one plant may not suit another. Use the species name to find guidance and observe how the plant responds.'],problems:['Plant problems','If something changes, record what you see and when you first noticed it.','Compare recent changes in watering, light and location. These sample pages do not diagnose a plant problem.']};
      const a=articles[route.split('/')[1]];if(!a)return fallback();
      screen.innerHTML=`${back('guides','Care guides')}<article class="article"><div class="eyebrow">Vaso · Sample guide</div><h1>${a[0]}</h1><p>${a[1]}</p><p>${a[2]}</p></article>`;
    } else {return fallback();}
    if(!first&&layout==='hub'&&['plants','reminders','guides'].includes(route))screen.insertAdjacentHTML('afterbegin',back('home','Home'));
    const name=screen.querySelector('h1')?.textContent||raw;
    if(trace[trace.length-1]!==name)trace.push(name);
    teachingNotes();screen.scrollTop=0;screen.focus({preventScroll:true});
  }
  function fallback(){location.hash=home();}
  document.querySelectorAll('[data-version]').forEach(b=>b.addEventListener('click',()=>{version=b.dataset.version;trace=[];done=null;fallback();render();}));
  document.querySelector('#navigation-example').addEventListener('change',e=>{layout=e.target.value;trace=[];done=null;fallback();render();});
  document.querySelector('#restart-task').addEventListener('click',()=>{state.pause=null;save();trace=[];done=null;fallback();render();notify('Task restarted.');});
  document.querySelector('#reset').addEventListener('click',()=>{state=defaults();save();trace=[];done=null;if(location.hash==='#'+home())render();else location.hash=home();notify('Demo reset.');});
  window.addEventListener('hashchange',render);render();
})();
