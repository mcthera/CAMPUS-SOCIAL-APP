// ==========================================
// CAMPUSX - MAIN JAVASCRIPT LOGIC
// ==========================================

// Global application state stored in localStorage or fallback to initial data
let data = JSON.parse(localStorage.getItem('campusData')) || {
  users: [],
  post: [
    { id: 1, author: 'KWADWO MANU', programme: 'BSC IT 2A', text: 'Anyone interested in developing the school campus feed X?', img: '', likes: [], refeed: [], comments: [], reports: [] },
    { id: 2, author: 'KENNY', programme: 'BSC IT 1A', text: 'I have a party today', img: '', likes: [], refeed: [], comments: [], reports: [] },
    { id: 3, author: 'MC THERA', programme: 'SOCIAL 1B', text: 'Anyone interested in developing the school campus feed X?', img: '', likes: [], refeed: [], comments: [], reports: [] }
  ],
  lost: [
    { id: 1, title: 'Black phone', category: 'Phone', by: 'Kofi', phone: '024 000 0001', dept: 'Law', comment: 'Found near the library.', img: '', recovered: false },
    { id: 2, title: 'Blue backpack', category: 'Bag', by: 'Esi', phone: '055 000 0002', dept: 'Science', comment: 'Left in Lecture Hall B.', img: '', recovered: false }
  ],
  messages: [],
  notifs: [],
  reports: []
};

data.reports = Array.isArray(data.reports) ? data.reports : [];
data.users = Array.isArray(data.users) ? data.users : [];
data.post = Array.isArray(data.post) ? data.post : [];
data.lost = Array.isArray(data.lost) ? data.lost : [];
data.messages = Array.isArray(data.messages) ? data.messages : [];
data.notifs = Array.isArray(data.notifs) ? data.notifs : [];
data.post.forEach(post => {
  post.likes = Array.isArray(post.likes) ? post.likes : [];
  post.refeed = Array.isArray(post.refeed) ? post.refeed : [];
  post.comments = Array.isArray(post.comments) ? post.comments : [];
  post.reports = Array.isArray(post.reports) ? post.reports : [];
});

let me = localStorage.getItem('campusUser');
let authMode = 'signup';
let toastTimer;
if (me && !data.users.some(user => user.name === me)) {
  me = null;
  localStorage.removeItem('campusUser');
}

// Save data to the browser localStorage
function save() {
  try { 
    localStorage.setItem('campusData', JSON.stringify(data)); 
  } catch (e) { 
    alert('Storage is full. Try a smaller photo.'); 
  }
}

function showToast(message) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

function requestText(title, placeholder, initialText, submitLabel) {
  return new Promise(resolve => {
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    const dialog = document.createElement('form');
    dialog.className = 'text-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'text-dialog-title');

    const heading = document.createElement('h2');
    heading.id = 'text-dialog-title';
    heading.textContent = title;
    const input = document.createElement('textarea');
    input.placeholder = placeholder;
    input.value = initialText || '';
    input.setAttribute('aria-label', placeholder);
    const actions = document.createElement('div');
    actions.className = 'dialog-actions';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'small';
    cancel.textContent = 'Cancel';
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'btn';
    submit.textContent = submitLabel || 'Post comment';

    actions.append(cancel, submit);
    dialog.append(heading, input, actions);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    const finish = value => {
      document.removeEventListener('keydown', onKeyDown);
      backdrop.remove();
      resolve(value);
    };
    const onKeyDown = event => {
      if (event.key === 'Escape') finish(null);
    };
    document.addEventListener('keydown', onKeyDown);
    dialog.addEventListener('submit', event => {
      event.preventDefault();
      finish(input.value.trim() || null);
    });
    cancel.addEventListener('click', () => finish(null));
    backdrop.addEventListener('click', event => {
      if (event.target === backdrop) finish(null);
    });
    input.focus();
    if (initialText) input.select();
  });
}

// Announcements ticker data
const announcements = [
  { from: 'SRC PRESIDENT', text: 'INCOMING SRC WEEK PARTY AND DRINKS!!.' },
  { from: 'IT 2A COURSE REP', text: 'NEW BOOKS AVAILABLE.' },
  { from: 'IT 1A COURSE REP', text: 'PREPARE YOUR STUDENT ID CARD.' },
];

// Videos data array (videos are not heavily persisted due to file sizes)
let videos = [
  { id: 1, by: 'Yaw Owusu', dept: 'Computer Eng', index: 'CE/22/014', skills: 'Video editing', desc: 'Sample video: upload your own!', src: '', likes: [] }
];

let chatWith = null;       // Who you are currently chatting with
let category = 'All';      // Selected Lost & Found category


// ==========================================
// INITIALIZATION & HEADER SETUP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // GRABS THE ID OF THE SELECTED HTML SECTION OR PAGE
  const headerButtons = document.getElementById('header-buttons');
  if(headerButtons){
    renderHeader();
  }

  // ===========================================
  // TICKETS DISPLAYER
  const tickerText = document.getElementById('ticker-text');
  // IF TICKER TEXT EXIST DISPLAY CONTENT FROM ANNOUNCEMENT BAR
  if(tickerText && announcements.length > 0){
    tickerText.textContent = announcements.map(a => `[${a.from}]: ${a.text}`).join('   ***   ');
  }

  // Render initial feed on load
  renderFeed();
});


// ==========================================
// AUTHENTICATION & USER MANAGEMENT
// ==========================================

// TOGGLE FUNCTION FOR AUTH MODAL
function toggleAuth(){
  const auth = document.getElementById('app-auth');
  auth.classList.toggle('active');
  if (auth.classList.contains('active')) {
    document.getElementById('a-name').focus();
  }
}

function showregister(mode){
  authMode = mode;
  document.getElementById('tab-signup').classList.toggle('on', mode === "signup");
  document.getElementById('tab-login').classList.toggle('on', mode === "login");
  
  // A SIMPLE IF/ELSE STATEMENT 
  // ? block; IF YES OPEN IT
  // : none ; IF NOT THEN HIDE
  document.getElementById('signup-fields').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('auth-button').textContent = mode === 'signup' ? 'Create Account' : 'Login';
  document.getElementById('auth-message').textContent = '';
}

// SUBMITFORM BUTTON ACTION AUTH
function submitform(){
  const name = document.getElementById('a-name').value.trim();
  const password = document.getElementById('a-password').value;
  // DOM MESSAGE ELEMENT
  const message = document.getElementById('auth-message');
  
  // CONDITIONAL STATEMENT TO CHECK WHETHER NAME AND PASSWORD IS ENTERED
  if (!name || !password) {
    message.textContent = 'Please enter your name and password.';
    return; 
  }

  // WHAT IF USER IS NEW
  if (authMode === 'signup') {
    const existingUser = data.users.find(u => u.name === name);
    if(existingUser) {
      message.textContent = 'That name is already taken.';
      return;
    }
    
    data.users.push({
      name: name, 
      password: password,
      phone: document.getElementById('a-phone').value,
      dept: document.getElementById('a-dept').value,
      index: document.getElementById('a-index').value,
      gender: document.getElementById('a-gender').value,
      skills: document.getElementById('a-skills').value
    });
    save();
  } else {
    const user = data.users.find(u => u.name === name && u.password === password);
    if(!user) { 
      message.textContent = 'Account not found or password is incorrect.';
      return; 
    }
  }

  // Assigns the current user's name to a global or scoped state variable (me)
  me = name;
  // Saves the active user's name in the browser's localStorage
  localStorage.setItem('campusUser', me);
  
  message.textContent = '';
  document.getElementById('app-auth').classList.remove('active');
  renderHeader();
  renderFeed();
  showToast(authMode === 'signup' ? 'Account created. Welcome to CAMPUS X!' : 'Welcome back, ' + name + '!');
}

// LOGOUT FUNCTION
function logout() {
  me = null;
  localStorage.removeItem('campusUser');
  renderHeader();
  showToast('Logged out successfully.');
}

// HELPER: GET CURRENT LOGGED IN USER OBJECT
function myUser() {
  return data.users.find(u => u.name === me) || { dept: 'Student', index: '', skills: '' };
}

// LOGIN REQUIREMENT CHECKER
function requiredlogin(){
  if(me) return true; // IF EXIST TRUE
  toggleAuth(); // IF NOT THEN OPEN AUTH MODAL
  return false; // BLOCK EVERY ACTIVITY UNSIGNED USER WOULD WANT TO DO
}


// ==========================================
// NAVIGATION & PAGE ROUTING
// ==========================================
function showPage(name) {
  // HIDE EVERY PAGE
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  // SHOW THE PAGE PREFERRED
  const targetPage = document.getElementById('page-' + name);
  if(targetPage) targetPage.classList.add('active');

  document.querySelectorAll('nav button').forEach(button => {
    button.classList.toggle('on', button.id === 'nav-' + name);
  });

  // Draw the content of that page dynamically
  if (name === 'feed') renderFeed();
  if (name === 'videos') renderVideos();
  if (name === 'lost') renderLost();
  if (name === 'news') renderNews();
  if (name === 'profile') renderProfile();
  if (name === 'dm') renderDM();
  if (name === 'notifs') renderNotifs();
  
  renderHeader();
}

// HEADER DYNAMIC BUTTONS RENDERER
function renderHeader() {
  const box = document.getElementById('header-buttons');
  if (!box) return;
  
  if (!me) { 
    box.innerHTML = '<button class="btn" onclick="toggleAuth()">Log in / Sign Up</button>'; 
    return; 
  }
  
  const unread = data.notifs.filter(n => n.to === me && !n.read).length;
  box.innerHTML =
    '<button class="small" onclick="showPage(\'dm\')">DM</button>' +
    '<button class="small" onclick="showPage(\'notifs\')">Bell ' + (unread ? '(' + unread + ')' : '') + '</button>' +
    '<button class="small" onclick="logout()">Log out</button>';
}


// ==========================================
// UTILITY & SECURITY HELPERS
// ==========================================

// SECURITY REASON: Escape text to prevent basic HTML injection
function safe(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function safeAttr(text) {
  return safe(text).replace(/"/g, '&quot;');
}

// CREATING AVATAR INITIALS (KWADWO MANU BECOMES KM)
function initials(name) {
  if (!name) return 'CX';
  return name.split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ADD NOTIFICATION
function notify(to, text){
  if(to === me) return;
  data.notifs.unshift({
    to: to,
    text: text,
    read: false
  });
  save();
}

// READING CHOSING IMAGE FILE
function readImage(fileInput, done) {
  const file = fileInput.files[0];             // 1. Grabs the first file selected
  if (!file) { done(''); return; }             // 2. If no file, return empty string
  const reader = new FileReader();             // 3. Creates file reader tool
  reader.onload = () => done(reader.result);   // 4. Return result when loaded
  reader.onerror = () => showToast('Could not read that file. Please try another one.');
  reader.readAsDataURL(file);                  // 5. Read as data URL
}


// ==========================================
// HOME FEED & POST MANAGEMENT
// ==========================================

// FIND POST BY ID HELPER
function findPost(id) { 
  return data.post.find(p => p.id === id); 
}

// ADD MY NAME TO A LIST OR REMOVE IT (TOGGLE LIKE / REFEED)
function toggleName(list) {
  const i = list.indexOf(me);
  if (i === -1) { list.push(me); return true; }   // added
  list.splice(i, 1); return false;                // removed
}

function toggleLike(id) {
  if (!requiredlogin()) return;
  const post = findPost(id);
  if (post && toggleName(post.likes)) {
    notify(post.author, me + ' liked your post');
  }
  save(); 
  renderFeed();
}

function toggleRefeed(id) {
  if (!requiredlogin()) return;
  const post = findPost(id);
  if (post && toggleName(post.refeed)) {
    notify(post.author, me + ' refeeded your post');
  }
  save(); 
  renderFeed();
}

async function addComment(id) {
  if (!requiredlogin()) return;
  const text = await requestText('Add a comment', 'Write your comment');
  if (!text) return;
  const post = findPost(id);
  if (post) {
    post.comments.push({ by: me, text: text });
    notify(post.author, me + ' commented: ' + text.slice(0, 40));
    save(); 
    renderFeed();
  }
}

function shareContent(type, id) {
  const url = new URL(window.location.href);
  url.hash = type + '-' + encodeURIComponent(id);
  const text = url.toString();
  const fallbackCopy = () => {
    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    if (copied) showToast('Link copied to clipboard.');
    else requestText('Copy this link', 'Select and copy the link', text, 'Done');
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Link copied to clipboard.'))
      .catch(fallbackCopy);
    return;
  }
  fallbackCopy();
}

function reportContent(type, id) {
  if (!requiredlogin()) return;
  if (!data.reports.some(report => report.type === type && report.id === id && report.by === me)) {
    data.reports.push({ type: type, id: id, by: me });
    save();
  }
  showToast('Report saved on this device. Thank you.');
  if (type === 'post') renderFeed();
  if (type === 'video') renderVideos();
}

// RENDER FEED FUNCTION (Connected to data.post)
function renderFeed(){
  const feedList = document.getElementById('feed-list');
  if (!feedList) return;

  let html = '';
  
  if (!data.post || data.post.length === 0) {
    feedList.innerHTML = '<p style="text-align: center; color: var(--details); padding: 20px;">No posts on campus yet. Be the first to post!</p>';
    return;
  }

  for (const post of data.post){
    const liked = post.likes.includes(me);
    const refeed = post.refeed.includes(me);
    const reported = data.reports.some(report => report.type === 'post' && report.id === post.id && report.by === me);
    let commentsHTML = '';
    
    // LOOP THROUGH COMMENTS
    for (const c of post.comments){
      commentsHTML += '<div class="comment"><b>' + safe(c.by) + '</b>: ' + safe(c.text) + '</div>';
    }
    
    html += `
      <div class="post" id="post-${post.id}">
        <div class="avatar" title="${safe(post.author)}">${initials(post.author)}</div>
        <div class="body">
          <b>${safe(post.author)}</b> <span class="muted">· ${safe(post.programme)}</span>
          <p>${safe(post.text)}</p>
          ${post.img ? '<img src="' + post.img + '" alt="Post attachment">' : ''}
          <div class="actions">
            <button class="small btn-action" onclick="toggleLike(${post.id})">${liked ? 'Liked ❤️' : 'Like'} (${post.likes.length})</button>
            <button class="small btn-action" onclick="addComment(${post.id})">Comment (${post.comments.length})</button>
            <button class="small btn-action" onclick="toggleRefeed(${post.id})">${refeed ? 'Refeeded 🔄' : 'Refeed'} (${post.refeed.length})</button>
            <button class="small btn-action" onclick="shareContent('post', ${post.id})">Share</button>
            <button class="small btn-action" data-chat="${safeAttr(post.author)}">DM</button>
            <button class="small btn-action" onclick="reportContent('post', ${post.id})" ${reported ? 'disabled' : ''}>${reported ? 'Reported' : 'Report'}</button>
          </div>
          <div class="comments-section">
            ${commentsHTML}
          </div>
        </div>
      </div>
    `;
  }
  feedList.innerHTML = html;
  feedList.querySelectorAll('[data-chat]').forEach(button => {
    button.addEventListener('click', () => startChat(button.dataset.chat));
  });
}

// ADD POST FUNCTION
function addPost(){
  if(!requiredlogin()) return;
  
  const textInput = document.getElementById('new-post');
  const fileinput = document.getElementById('new-post-img');
  
  const text = textInput.value.trim();
  
  // When text and image file upload are both empty, stop execution
  if (!text && (!fileinput.files || !fileinput.files[0])) {
    showToast('Write something or attach an image before posting.');
    return;
  }

  readImage(fileinput, function(img){
    const user = myUser();
    
    // UNSHIFT: Drops the new post right at the beginning of the data.post array
    data.post.unshift({
      id: Date.now(), 
      author: me, 
      programme: user.dept || 'Student',
      text: text, 
      img: img, 
      likes: [], 
      refeed: [], 
      comments: [],
      reports: []
    });
    
    save();
    textInput.value = '';
    fileinput.value = '';
    renderFeed();
  });
}


// ==========================================
// ============ 6. VIDEOS ============

function renderVideos() {
  const container = document.getElementById('video-list');
  if(!container) return;
  let html = '';
  for (const v of videos) {
    const media = v.src ? '<video src="' + v.src + '" controls loop playsinline></video>' : '';
    const reported = data.reports.some(report => report.type === 'video' && report.id === v.id && report.by === me);
    const comments = (v.comments || []).map(comment =>
      '<div class="comment"><b>' + safe(comment.by) + '</b>: ' + safe(comment.text) + '</div>'
    ).join('');
    html +=
      '<div class="reel" id="video-' + v.id + '">' + media +
      '<div class="side">' +
      '<button onclick="likeVideo(' + v.id + ')">Like ' + v.likes.length + '</button>' +
      '<button onclick="addVideoComment(' + v.id + ')">Cmt ' + (v.comments || []).length + '</button>' +
      '<button onclick="shareContent(\'video\', ' + v.id + ')">Share</button>' +
      '<button onclick="reportContent(\'video\', ' + v.id + ')" ' + (reported ? 'disabled' : '') + '>' + (reported ? 'Reported' : 'Report') + '</button></div>' +
      '<div class="info"><b>' + safe(v.by) + '</b><br>' + safe(v.dept) + ' · ' + safe(v.index) + ' · ' + safe(v.skills) +
      '<br>' + safe(v.desc) + comments + '</div></div>';
  }
  container.innerHTML = html;
}

function addVideo() {
  if (!requiredlogin()) return;
  const file = document.getElementById('v-file').files[0];
  if (!file) { showToast('Choose a video first.'); return; }
  const u = myUser();
  videos.unshift({
    id: Date.now(), by: me, dept: u.dept, index: u.index, skills: u.skills,
    desc: document.getElementById('v-desc').value,
    src: URL.createObjectURL(file),   // a temporary link to the file on your device
    likes: [],
    comments: []
  });
  document.getElementById('v-file').value = '';
  document.getElementById('v-desc').value = '';
  renderVideos();
}

function likeVideo(id) {
  if (!requiredlogin()) return;
  const video = videos.find(v => v.id === id);
  if (!video) return;
  toggleName(video.likes);
  renderVideos();
}

async function addVideoComment(id) {
  if (!requiredlogin()) return;
  const video = videos.find(v => v.id === id);
  if (!video) return;
  const text = await requestText('Comment on this video', 'Write your comment');
  if (!text) return;
  video.comments = Array.isArray(video.comments) ? video.comments : [];
  video.comments.push({ by: me, text: text });
  renderVideos();
}


// ==========================================
// ============ 7. LOST AND FOUND ============
function renderLost() {
  // CHIPS
  let chips = '';
  for (const c of ['All', 'Phone', 'Bag', 'Book', 'Pen', 'Other']){
    chips += '<button class="chip ' + (c === category ? 'on' : '') + '" onclick="setLostCategory(\'' + c + '\')">' + c + '</button>';
  }
  const chipsEl = document.getElementById('lost-chips');
  if(chipsEl) chipsEl.innerHTML = chips;

  // ITEMS (FILTERED BY CATEGORY AND SEARCH WORDS) ///////////////////////
  const searchInput = document.getElementById('lost-search');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  let html = '';
  for (const item of data.lost) {
    if (category !== 'All' && item.category !== category) continue;
    if (!(item.title + ' ' + item.comment + ' ' + item.category + ' ' + item.by).toLowerCase().includes(search)) continue;
    html +=
      '<div class="card ' + (item.recovered ? 'recovered' : '') + '">' +
      (item.img ? '<img src="' + item.img + '" alt="Lost or found item">' : '') +
      '<p><b>' + safe(item.title) + '</b> <span class="muted">· ' + safe(item.category) + '</span> ' +
      (item.recovered ? '<span class="badge">RECOVERED</span>' : '') + '</p>' +
      '<p class="muted">' + safe(item.by) + ' · ' + safe(item.phone) + ' · ' + safe(item.dept) + '</p>' +
      '<p>' + safe(item.comment) + '</p>' +
      (item.by === me && !item.recovered ? '<button class="btn" onclick="markRecovered(' + item.id + ')">Mark as recovered</button>' : '') +
      '</div>';
  }
  const lostList = document.getElementById('lost-list');
  if(lostList) lostList.innerHTML = html || '<p class="muted">No items found.</p>';
}

function setLostCategory(value) {
  category = value;
  renderLost();
}

function addLost() {
  if (!requiredlogin()) return;
  const title = document.getElementById('l-title').value.trim();
  if (!title) { showToast('Enter the item name.'); return; }
  readImage(document.getElementById('l-img'), function (img) {
    const u = myUser();
    data.lost.unshift({
      id: Date.now(), title: title, category: document.getElementById('l-category').value,
      by: me, phone: u.phone, dept: u.dept,
      comment: document.getElementById('l-comment').value, img: img, recovered: false
    });
    save();
    document.getElementById('l-title').value = '';
    document.getElementById('l-comment').value = '';
    document.getElementById('l-img').value = '';
    renderLost();
  });
}

function markRecovered(id) {
  if (!requiredlogin()) return;
  const item = data.lost.find(i => i.id === id);
  if (!item || item.by !== me || item.recovered) return;
  item.recovered = true;
  save();
  renderLost();
}


// ============ 8. ANNOUNCEMENTS ============////////////////////////////////
function renderNews() {   
  const newsList = document.getElementById('news-list');
  if(!newsList) return;
  let html = '';
  for (const a of announcements) {
    html += '<div class="card news"><b>' + a.from + '</b><p>' + a.text + '</p></div>';
  }
  newsList.innerHTML = html; 
}


// ============ 9. PROFILE ============
function renderProfile() {   
  const box = document.getElementById('profile-box');
  if(!box) return;
  if (!me) { box.innerHTML = '<p>Please log in to see your profile.</p><button class="btn" onclick="toggleAuth()">Log in</button>'; return; }
  const u = myUser();
  const postCount = data.post.filter(p => p.author === me).length;
  box.innerHTML =
    '<div class="post"><div class="avatar">' + initials(me) + '</div><div><b>' + safe(me) + '</b><br><span class="muted">' +
    safe(u.dept) + ' · ' + safe(u.index) + '</span></div></div>' +
    '<p class="muted">' + postCount + ' posts</p>' +
    '<input id="p-phone" placeholder="Phone" value="' + safeAttr(u.phone) + '">' +
    '<input id="p-dept" placeholder="Department" value="' + safeAttr(u.dept) + '">' +
    '<input id="p-index" placeholder="Index number" value="' + safeAttr(u.index) + '">' +
    '<input id="p-skills" placeholder="Role / skills" value="' + safeAttr(u.skills) + '">' +
    '<button class="btn" onclick="saveProfile()">Save profile</button>';
}

function saveProfile() {
  if (!requiredlogin()) return;
  const u = myUser();
  u.phone = document.getElementById('p-phone').value;
  u.dept = document.getElementById('p-dept').value;
  u.index = document.getElementById('p-index').value;
  u.skills = document.getElementById('p-skills').value;
  save();
  showToast('Profile saved.');
  renderProfile();
}


// ============ 10. DIRECT MESSAGES ============
function startChat(name) {
  if (!requiredlogin()) return;
  if (!name) { showToast('Enter a name to start a chat.'); return; }
  if (name === me) { showToast('You cannot start a chat with yourself.'); return; }
  chatWith = name;
  showPage('dm');
}

function renderDM() {
  const box = document.getElementById('dm-box');
  if(!box) return;
  if (!me) { box.innerHTML = '<p>Please log in to send messages.</p>'; return; }

  // A) Chat screen with one person
  if (chatWith) {
    let html = '<button class="small" onclick="chatWith=null;renderDM()">Back</button> <b>' + safe(chatWith) + '</b><div>';
    for (const m of data.messages) {
      const mine = m.from === me && m.to === chatWith;
      const theirs = m.from === chatWith && m.to === me;
      if (mine || theirs) html += '<div class="bubble ' + (mine ? 'mine' : '') + '">' + safe(m.text) + '</div>';
    }
    html += '</div><input id="dm-text" placeholder="Message..."><button class="btn" onclick="sendMessage()">Send</button>';
    box.innerHTML = html;
    return;
  }

  // B) List of chats + start a new one
  const people = [];
  for (const m of data.messages) {
    if (m.from === me && !people.includes(m.to)) people.push(m.to);
    if (m.to === me && !people.includes(m.from)) people.push(m.from);
  }
  let html = '<input id="dm-new" placeholder="Type a name to start a chat"><button class="btn" onclick="startChat(document.getElementById(\'dm-new\').value.trim())">Chat</button><br><br>';
  for (const p of people) html += '<button class="card chat-person" data-chat="' + safeAttr(p) + '"><b>' + safe(p) + '</b></button>';
  box.innerHTML = html + (people.length ? '' : '<p class="muted">No chats yet.</p>');
  box.querySelectorAll('[data-chat]').forEach(button => {
    button.addEventListener('click', () => startChat(button.dataset.chat));
  });
}

function sendMessage() {
  if (!requiredlogin()) return;
  const input = document.getElementById('dm-text');
  if(!input) return;
  const text = input.value.trim();
  if (!text) return;
  data.messages.push({ from: me, to: chatWith, text: text });
  notify(chatWith, me + ' sent you a message');
  save(); 
  renderDM();
}


// ============ 11. NOTIFICATIONS ============
function renderNotifs() { 
  const notifList = document.getElementById('notif-list');
  if(!notifList) return;
  if(!me) { notifList.innerHTML = '<p>Please log in.</p>'; return;}
  let html = '';
  for (const n of data.notifs){
    if (n.to !== me) continue;
    html += '<div class="card">' + safe(n.text) + '</div>';
    n.read = true;
  }
  // Mark all notifications as read when opened
  save();
  renderHeader();
  notifList.innerHTML = html || '<p class="muted">No notifications yet.</p>';
}