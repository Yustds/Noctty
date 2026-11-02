// ==========================================
// 1. ESTADO GLOBAL (Base de datos LocalStorage)
// ==========================================
let users = JSON.parse(localStorage.getItem('noctty_users')) || [
    { email: 'estudiante@unipamplona.edu.co', password: '123', name: 'Juan Diego S.', avatar: null }
];
let activeUserEmail = localStorage.getItem('noctty_active_user') || null;

let db = {
    subjects: JSON.parse(localStorage.getItem('noctty_subjects')) || [{ id: 's1', name: 'Ingeniería', color: 'bg-blue-500' }],
    notes: JSON.parse(localStorage.getItem('noctty_notes')) || [],
    profile: JSON.parse(localStorage.getItem('noctty_profile')) || { name: 'Juan Diego S.', avatar: null }
};

let isDarkMode = localStorage.getItem('noctty_dark') === 'true';
let isAuthenticated = localStorage.getItem('noctty_auth') === 'true' && activeUserEmail !== null;
let isFocusMode = false;
let currentCategoryFilter = 'all';

let currentNoteId = null;
let selectedColor = 'bg-blue-500';
let activeBlockElement = null; 
let activeBlockContainer = null; 

// Estado para Editor de Imágenes
let currentEditingImageId = null;
let currentImageScale = 100;
let currentImageRotation = 0;
let currentCropTop = 0;
let currentCropRight = 0;
let currentCropBottom = 0;
let currentCropLeft = 0;

function saveDB() {
    localStorage.setItem('noctty_subjects', JSON.stringify(db.subjects));
    localStorage.setItem('noctty_notes', JSON.stringify(db.notes));
    localStorage.setItem('noctty_profile', JSON.stringify(db.profile));
}
function generateId() { return Math.random().toString(36).substr(2, 9); }

// ==========================================
// 2. SISTEMA DE AUTENTICACIÓN Y REGISTRO DE USUARIOS
// ==========================================
function checkAuth() {
    const loginView = document.getElementById('view-login'); 
    const appLayout = document.getElementById('app-layout');
    if (isAuthenticated && activeUserEmail) {
        const currentUser = users.find(u => u.email === activeUserEmail);
        if (currentUser) {
            db.profile.name = currentUser.name;
            db.profile.avatar = currentUser.avatar || null;
            saveDB();
        }
        loginView.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => { 
            loginView.classList.add('hidden'); 
            appLayout.classList.remove('hidden'); 
            setTimeout(() => appLayout.classList.remove('opacity-0'), 50); 
            switchView('dashboard'); 
            loadProfile(); 
        }, 300);
    } else {
        loginView.classList.remove('hidden', 'pointer-events-none'); 
        appLayout.classList.add('hidden', 'opacity-0'); 
        setTimeout(() => loginView.classList.remove('opacity-0'), 50);
    }
}

function toggleAuthTab(tab) {
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const btnLogin = document.getElementById('tab-btn-login');
    const btnRegister = document.getElementById('tab-btn-register');

    if (tab === 'login') {
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
        btnLogin.className = "w-1/2 py-2 font-bold text-sm border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 transition";
        btnRegister.className = "w-1/2 py-2 font-bold text-sm border-b-2 border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition";
    } else {
        formLogin.classList.add('hidden');
        formRegister.classList.remove('hidden');
        btnRegister.className = "w-1/2 py-2 font-bold text-sm border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 transition";
        btnLogin.className = "w-1/2 py-2 font-bold text-sm border-b-2 border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition";
    }
}

function handleLogin(e) { 
    e.preventDefault(); 
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pwd = document.getElementById('login-pwd').value;

    const user = users.find(u => u.email === email && u.password === pwd);
    if (!user) {
        createToast('Error de inicio de sesión', 'Correo o contraseña incorrectos.');
        return;
    }

    activeUserEmail = email;
    localStorage.setItem('noctty_active_user', email);
    localStorage.setItem('noctty_auth', 'true'); 
    isAuthenticated = true; 
    checkAuth(); 
    createToast('¡Bienvenido!', `Hola de nuevo, ${user.name}`); 
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const pwd = document.getElementById('reg-pwd').value;
    const pwdConfirm = document.getElementById('reg-pwd-confirm').value;

    if (pwd !== pwdConfirm) {
        createToast('Error', 'Las contraseñas no coinciden.');
        return;
    }

    if (users.some(u => u.email === email)) {
        createToast('Error', 'El correo ya está registrado.');
        return;
    }

    const newUser = { email, password: pwd, name, avatar: null };
    users.push(newUser);
    localStorage.setItem('noctty_users', JSON.stringify(users));

    activeUserEmail = email;
    localStorage.setItem('noctty_active_user', email);
    localStorage.setItem('noctty_auth', 'true');
    isAuthenticated = true;

    db.profile = { name: newUser.name, avatar: null };
    saveDB();

    checkAuth();
    createToast('¡Registro Exitoso!', `Cuenta creada para ${name}`);
}

function handleLogout() { 
    localStorage.setItem('noctty_auth', 'false'); 
    localStorage.removeItem('noctty_active_user');
    isAuthenticated = false; 
    activeUserEmail = null;
    checkAuth(); 
}

function initDarkMode() { 
    if (isDarkMode) document.documentElement.classList.add('dark'); 
    else document.documentElement.classList.remove('dark'); 
}
function toggleDarkMode() { 
    isDarkMode = !isDarkMode; 
    localStorage.setItem('noctty_dark', isDarkMode); 
    initDarkMode(); 
    createToast(isDarkMode ? 'Modo Oscuro' : 'Modo Claro', 'Preferencia visual guardada.'); 
}

// ==========================================
// 3. PERFIL (Nombre y Foto)
// ==========================================
function loadProfile() {
    document.getElementById('user-name-display').innerText = db.profile.name;
    document.getElementById('profile-name').value = db.profile.name;
    const avatars = [document.getElementById('sidebar-avatar'), document.getElementById('modal-avatar')];
    const fallbacks = [document.getElementById('sidebar-avatar-fallback'), document.getElementById('modal-avatar-fallback')];
    
    if (db.profile.avatar) {
        avatars.forEach(el => { if(el) { el.src = db.profile.avatar; el.classList.remove('hidden'); } });
        fallbacks.forEach(el => { if(el) el.classList.add('hidden'); });
    } else {
        avatars.forEach(el => { if(el) el.classList.add('hidden'); });
        fallbacks.forEach(el => { if(el) el.classList.remove('hidden'); });
    }
}

function updateProfileName() { 
    const newName = document.getElementById('profile-name').value;
    db.profile.name = newName; 
    document.getElementById('user-name-display').innerText = newName; 
    
    // Actualizar también en el array de usuarios
    const u = users.find(usr => usr.email === activeUserEmail);
    if(u) u.name = newName;
    localStorage.setItem('noctty_users', JSON.stringify(users));

    saveDB(); 
}

function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => { 
            db.profile.avatar = evt.target.result; 
            const u = users.find(usr => usr.email === activeUserEmail);
            if(u) u.avatar = evt.target.result;
            localStorage.setItem('noctty_users', JSON.stringify(users));

            saveDB(); 
            loadProfile(); 
            createToast('Foto actualizada', 'Tu perfil ha sido modificado.'); 
        };
        reader.readAsDataURL(file);
    }
}

// ==========================================
// 4. NAVEGACIÓN Y MODO ZEN
// ==========================================
function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar'); 
    const overlay = document.getElementById('mobile-overlay');
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full'); 
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full'); 
        overlay.classList.add('hidden');
    }
}

function switchView(viewId) {
    if(window.innerWidth < 768 && document.getElementById('main-sidebar') && !document.getElementById('main-sidebar').classList.contains('-translate-x-full')) {
        toggleSidebar();
    }
    const navDash = document.getElementById('nav-dashboard');
    if (navDash) { 
        navDash.className = navDash.className.replace('bg-white/10 text-white', 'hover:bg-white/5 text-gray-300'); 
        if(viewId === 'dashboard') navDash.className = navDash.className.replace('hover:bg-white/5 text-gray-300', 'bg-white/10 text-white'); 
    }
    document.getElementById('view-dashboard').classList.add('hidden'); 
    document.getElementById('view-editor').classList.add('hidden');
    document.getElementById('view-' + viewId).classList.remove('hidden');
    
    if(viewId === 'dashboard') renderDashboard();
}

function toggleFocusMode() {
    isFocusMode = !isFocusMode;
    const sidebar = document.getElementById('main-sidebar');
    const topbar = document.getElementById('editor-topbar');
    const focusIcon = document.getElementById('focus-icon');
    const exitBtn = document.getElementById('exit-zen-btn');
    
    if (isFocusMode) {
        if(sidebar) sidebar.classList.add('md:hidden'); 
        if(topbar) topbar.classList.add('-translate-y-full', 'opacity-0', 'pointer-events-none');
        if(focusIcon) focusIcon.setAttribute('data-lucide', 'minimize');
        if(exitBtn) exitBtn.classList.remove('hidden');
        createToast('Modo Zen', 'Distracciones ocultas.');
    } else {
        if(sidebar) sidebar.classList.remove('md:hidden');
        if(topbar) topbar.classList.remove('-translate-y-full', 'opacity-0', 'pointer-events-none');
        if(focusIcon) focusIcon.setAttribute('data-lucide', 'maximize');
        if(exitBtn) exitBtn.classList.add('hidden');
    }
    lucide.createIcons();
}

function exitEditorSafely() {
    if(isFocusMode) toggleFocusMode();
    switchView('dashboard');
}

// ==========================================
// 5. DASHBOARD Y FILTROS POR CATEGORÍA
// ==========================================
function renderSidebarSubjects() {
    const list = document.getElementById('subjects-list'); 
    const select = document.getElementById('editor-subject-select'); 
    const filterContainer = document.getElementById('category-filters');
    if(list) list.innerHTML = ''; 
    if(select) select.innerHTML = '<option value="">General</option>';
    
    if(filterContainer) {
        filterContainer.innerHTML = `<button onclick="filterNotesBySubject('all')" class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition filter-btn ${currentCategoryFilter === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}" id="filter-all">Todos</button>`;
    }

    db.subjects.forEach(sub => {
        if(list) {
            list.innerHTML += `<div class="w-full flex items-center justify-between px-3 py-1.5 hover:bg-white/5 rounded-lg transition group"><button class="flex-1 flex items-center text-left truncate" onclick="performSearch('${sub.name}')"><span class="w-2 h-2 rounded-full mr-3 ${sub.color}"></span><span class="text-sm text-gray-400 group-hover:text-white transition">${sub.name}</span></button><button onclick="deleteSubject('${sub.id}', event)" class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button></div>`;
        }
        if(select) {
            select.innerHTML += `<option value="${sub.id}">${sub.name}</option>`;
        }
        
        if(filterContainer) {
            const activeClass = currentCategoryFilter === sub.id ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700';
            filterContainer.innerHTML += `<button onclick="filterNotesBySubject('${sub.id}')" class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition filter-btn flex items-center gap-2 ${activeClass}"><span class="w-2 h-2 rounded-full ${sub.color}"></span> ${sub.name}</button>`;
        }
    });

    const favList = document.getElementById('favorites-list'); 
    if(favList) {
        favList.innerHTML = '';
        db.notes.filter(n => n.isFavorite).forEach(fav => { 
            favList.innerHTML += `<button onclick="openNote('${fav.id}')" class="w-full flex items-center px-3 py-1.5 hover:bg-white/5 rounded-lg transition text-left text-sm text-gray-400 hover:text-white"><i data-lucide="file-text" class="w-3.5 h-3.5 mr-3 text-yellow-500"></i><span class="truncate flex-1">${fav.title || 'Sin título'}</span></button>`; 
        });
    }
    lucide.createIcons();
}

function filterNotesBySubject(subId) {
    currentCategoryFilter = subId;
    renderSidebarSubjects();
    renderDashboard();
}

function renderDashboard() {
    renderSidebarSubjects();
    const grid = document.getElementById('notes-grid'); 
    if(!grid) return;
    grid.innerHTML = '';
    
    let notesToShow = db.notes;
    if(currentCategoryFilter !== 'all') notesToShow = db.notes.filter(n => n.subjectId === currentCategoryFilter);
    
    if (notesToShow.length === 0) { 
        grid.innerHTML = `<div class="col-span-full text-center py-10"><p class="text-gray-400">No hay apuntes aquí. ¡Crea uno nuevo!</p></div>`; 
        return; 
    }
    
    [...notesToShow].sort((a, b) => b.updatedAt - a.updatedAt).forEach(note => {
        const sub = db.subjects.find(s => s.id === note.subjectId) || { name: 'General', color: 'bg-gray-400' };
        let preview = "...";
        if(note.content && note.content.length > 0) {
            const textBlocks = note.content.filter(b => b.type === 'p' || b.type === 'todo' || b.type === 'h1' || b.type === 'h2');
            if(textBlocks.length > 0) preview = textBlocks.map(b => b.text).join(' ').replace(/<[^>]*>?/gm, '').substring(0, 80) + '...';
        }
        
        const bgClasses = `bg-white dark:bg-gray-800 border-${sub.color.split('-')[1]}-200 dark:border-gray-700`;
        const star = note.isFavorite ? "text-yellow-500 opacity-100" : "text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100";
        
        grid.innerHTML += `
            <div onclick="openNote('${note.id}')" class="${bgClasses} p-5 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition-all group relative flex flex-col h-48">
                <div class="absolute top-4 right-4 flex gap-2 z-10">
                    <button onclick="toggleFavorite('${note.id}', event)" class="${star} hover:text-yellow-400 transition p-1"><i data-lucide="star" class="w-4 h-4 ${note.isFavorite?'fill-current':''}"></i></button>
                    <button onclick="deleteNote('${note.id}', event)" class="text-gray-300 dark:text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
                <div class="flex items-center gap-2 mb-3">
                    <span class="w-2.5 h-2.5 rounded-full shadow-sm ${sub.color}"></span>
                    <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">${sub.name}</span>
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 pr-12 line-clamp-2 leading-snug">${note.title || 'Apunte en blanco'}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mt-auto">${preview}</p>
            </div>`;
    }); 
    lucide.createIcons();
}

// ==========================================
// 6. HELPER Y EDITOR DE BLOQUES (YouTube e Imágenes)
// ==========================================
function extractYouTubeID(url) {
    if (!url) return null;
    const regExp = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
}

function openNote(id) {
    currentNoteId = id; 
    const note = db.notes.find(n => n.id === id);
    if(!note) return;
    document.getElementById('editor-title').value = note.title; 
    document.getElementById('editor-subject-select').value = note.subjectId;
    const container = document.getElementById('editor-blocks'); 
    container.innerHTML = '';
    if(!note.content || note.content.length === 0) note.content = [{ id: generateId(), type: 'p', text: '' }];
    
    note.content.forEach(b => {
        container.innerHTML += createBlockHTML(b.type, b.text, b.data);
    });
    switchView('editor'); 
    lucide.createIcons();
}

function createBlockHTML(type, text = '', data = {}) {
    const baseClasses = "outline-none focus:bg-gray-50 dark:focus:bg-gray-800 px-2 py-1 rounded flex-1 leading-relaxed block-content text-[17px] md:text-lg transition w-full";
    let cls = baseClasses; 
    let extraHTML = ""; 
    let contentHTML = text;

    if(type === 'h1') cls = baseClasses.replace('text-[17px] md:text-lg', 'text-3xl md:text-4xl font-bold mt-6 text-gray-900 dark:text-white');
    else if(type === 'h2') cls = baseClasses.replace('text-[17px] md:text-lg', 'text-xl md:text-2xl font-bold mt-4 text-gray-800 dark:text-gray-100');
    else if(type === 'code') cls = "outline-none px-4 py-3 flex-1 block-content bg-[#1e1e24] text-green-400 rounded-xl font-mono text-xs md:text-sm mt-2 w-full overflow-x-auto";
    else if(type === 'todo') {
        cls = baseClasses;
        extraHTML = `<input type="checkbox" class="mt-1.5 md:mt-2.5 mr-3 w-4 h-4 md:w-5 md:h-5 text-blue-600 rounded cursor-pointer" onclick="triggerAutosave()">`;
    }
    else if(type === 'divider') {
        return `<div class="flex items-center group relative mt-6 mb-6 block-container"><div onclick="showBlockMenu(event, this)" class="w-8 flex justify-center opacity-0 absolute -left-6 md:-left-8 cursor-pointer text-gray-400 transition group-hover:opacity-100"><i data-lucide="grip-vertical" class="w-4 h-4"></i></div><hr class="flex-1 border-t-2 border-gray-100 dark:border-gray-800 block-content" data-type="divider"></div>`;
    }
    else if(type === 'youtube') {
        const videoId = data.url ? extractYouTubeID(data.url) : '';
        const iframeSrc = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&showinfo=0` : '';
        cls = "block-content hidden"; 
        extraHTML = `
            <div class="w-full max-w-2xl mx-auto mt-4 mb-4 relative group" data-type="youtube" data-url="${data.url || ''}">
                <div class="youtube-container bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm relative" style="padding-bottom: 56.25%; height: 0;">
                    ${iframeSrc ? `<iframe src="${iframeSrc}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="pdf-exclude absolute top-0 left-0 w-full h-full rounded-xl"></iframe>` : '<div class="absolute inset-0 flex items-center justify-center text-gray-400">URL Inválida</div>'}
                    <div class="pdf-only hidden text-blue-500 underline absolute inset-0 flex items-center justify-center bg-gray-50"><a href="${data.url || '#'}" target="_blank">Enlace al video de YouTube</a></div>
                </div>
            </div>`;
    }
    else if(type === 'image') {
        cls = "block-content hidden";
        const scale = data.scale || 100; 
        const rot = data.rotation || 0;
        const cropTop = data.cropTop || 0;
        const cropRight = data.cropRight || 0;
        const cropBottom = data.cropBottom || 0;
        const cropLeft = data.cropLeft || 0;
        const clipPathStyle = `clip-path: inset(${cropTop}% ${cropRight}% ${cropBottom}% ${cropLeft}%);`;

        extraHTML = `
            <div class="w-full mt-4 mb-4 relative group flex justify-center" data-type="image" data-src="${data.src || ''}" data-scale="${scale}" data-rotation="${rot}" data-croptop="${cropTop}" data-cropright="${cropRight}" data-cropbottom="${cropBottom}" data-cropleft="${cropLeft}">
                <div class="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer shadow-sm transition-shadow hover:shadow-md" onclick="openImageEditor(this)" style="max-width: ${scale}%;">
                    <div style="overflow: hidden; ${clipPathStyle}">
                        <img src="${data.src || ''}" class="w-full h-auto object-contain transition-transform duration-200" style="transform: rotate(${rot}deg)">
                    </div>
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white rounded-xl"><i data-lucide="crop" class="w-6 h-6"></i></div>
                </div>
            </div>`;
    }

    return `<div class="flex items-start group relative mt-1 block-container w-full max-w-full"><div onclick="showBlockMenu(event, this)" class="w-8 flex justify-center pt-2 opacity-0 absolute -left-6 md:-left-8 cursor-pointer text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition group-hover:opacity-100"><i data-lucide="grip-vertical" class="w-4 h-4"></i></div>${extraHTML}<p class="${cls} min-w-0" contenteditable="true" data-type="${type}" placeholder="Escribe '/' para comandos..." oninput="handleBlockInput(event, this)" onkeydown="handleBlockKeydown(event, this)">${contentHTML}</p></div>`;
}

function handleBlockInput(e, el) {
    const text = el.innerText; 
    activeBlockElement = el;
    if (text === '# ') convertActiveBlock('h1');
    if (text === '## ') convertActiveBlock('h2');
    if (text === '``` ') convertActiveBlock('code');
    if (text === '[] ') convertActiveBlock('todo');
    if (text === '---') convertActiveBlock('divider');
    
    const menu = document.getElementById('slash-menu');
    if (text === '/') {
        const rect = el.getBoundingClientRect();
        let left = rect.left + 20; 
        if(window.innerWidth < 400) left = 20; 
        menu.style.top = `${rect.bottom + window.scrollY + 10}px`; 
        menu.style.left = `${left}px`;
        menu.classList.remove('hidden'); 
        setTimeout(() => menu.classList.remove('opacity-0', '-translate-y-2'), 10);
    } else menu.classList.add('hidden', 'opacity-0');
    triggerAutosave();
}

function convertActiveBlock(t) {
    if (!activeBlockElement) return;
    document.getElementById('slash-menu').classList.add('hidden');
    const parent = activeBlockElement.closest('.block-container');
    
    if (t === 'youtube') {
        const url = prompt("Pega el enlace de YouTube:");
        if(url) { 
            parent.outerHTML = createBlockHTML('youtube', '', { url }); 
            triggerAutosave(); 
        } else { 
            activeBlockElement.innerText = ''; 
        }
    } 
    else if (t === 'image') {
        const input = document.createElement('input'); 
        input.type = 'file'; 
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = (evt) => { 
                    parent.outerHTML = createBlockHTML('image', '', { src: evt.target.result, scale: 100, rotation: 0, cropTop: 0, cropRight: 0, cropBottom: 0, cropLeft: 0 }); 
                    triggerAutosave(); 
                };
                reader.readAsDataURL(file);
            }
        };
        input.click(); 
        activeBlockElement.innerText = '';
    }
    else {
        parent.outerHTML = createBlockHTML(t);
        const newBlocks = document.querySelectorAll('.block-content');
        if(t !== 'divider' && newBlocks.length > 0) newBlocks[newBlocks.length - 1].focus();
        triggerAutosave();
    }
    lucide.createIcons();
}

// ==========================================
// 7. EDICIÓN DE IMÁGENES (Escala, Rotación y Recorte 4 Lados)
// ==========================================
function openImageEditor(imgContainer) {
    const parent = imgContainer.closest('[data-type="image"]');
    currentEditingImageId = parent; 
    
    currentImageScale = parseInt(parent.getAttribute('data-scale')) || 100;
    currentImageRotation = parseInt(parent.getAttribute('data-rotation')) || 0;
    currentCropTop = parseInt(parent.getAttribute('data-croptop')) || 0;
    currentCropRight = parseInt(parent.getAttribute('data-cropright')) || 0;
    currentCropBottom = parseInt(parent.getAttribute('data-cropbottom')) || 0;
    currentCropLeft = parseInt(parent.getAttribute('data-cropleft')) || 0;
    
    const src = parent.getAttribute('data-src');
    const modal = document.getElementById('image-editor-modal');
    
    document.getElementById('img-scale-slider').value = currentImageScale;
    document.getElementById('img-crop-top-slider').value = currentCropTop;
    document.getElementById('img-crop-right-slider').value = currentCropRight;
    document.getElementById('img-crop-bottom-slider').value = currentCropBottom;
    document.getElementById('img-crop-left-slider').value = currentCropLeft;
    
    document.getElementById('img-to-edit').src = src;
    applyImageEditsToModal();
    
    modal.classList.remove('hidden'); 
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function rotateImage(deg) { 
    currentImageRotation += deg; 
    applyImageEditsToModal(); 
}

function applyImageEdits() { 
    currentImageScale = document.getElementById('img-scale-slider').value; 
    currentCropTop = document.getElementById('img-crop-top-slider').value;
    currentCropRight = document.getElementById('img-crop-right-slider').value;
    currentCropBottom = document.getElementById('img-crop-bottom-slider').value;
    currentCropLeft = document.getElementById('img-crop-left-slider').value;
    applyImageEditsToModal(); 
}

function applyImageEditsToModal() { 
    const img = document.getElementById('img-to-edit');
    const wrapper = document.getElementById('crop-wrapper');
    if(img) img.style.transform = `scale(${currentImageScale/100}) rotate(${currentImageRotation}deg)`;
    if(wrapper) wrapper.style.clipPath = `inset(${currentCropTop}% ${currentCropRight}% ${currentCropBottom}% ${currentCropLeft}%)`;
}

function saveImageEdits() {
    if(currentEditingImageId) {
        currentEditingImageId.setAttribute('data-scale', currentImageScale);
        currentEditingImageId.setAttribute('data-rotation', currentImageRotation);
        currentEditingImageId.setAttribute('data-croptop', currentCropTop);
        currentEditingImageId.setAttribute('data-cropright', currentCropRight);
        currentEditingImageId.setAttribute('data-cropbottom', currentCropBottom);
        currentEditingImageId.setAttribute('data-cropleft', currentCropLeft);
        
        const imgOuterContainer = currentEditingImageId.querySelector('.relative.overflow-hidden');
        const imgInnerCropDiv = imgOuterContainer ? imgOuterContainer.querySelector('div') : null;
        const imgTag = currentEditingImageId.querySelector('img');
        
        if(imgOuterContainer) imgOuterContainer.style.maxWidth = `${currentImageScale}%`;
        if(imgTag) imgTag.style.transform = `rotate(${currentImageRotation}deg)`;
        if(imgInnerCropDiv) imgInnerCropDiv.style.clipPath = `inset(${currentCropTop}% ${currentCropRight}% ${currentCropBottom}% ${currentCropLeft}%)`;
        
        triggerAutosave();
    }
    closeImageEditor();
}

function closeImageEditor() { 
    const modal = document.getElementById('image-editor-modal'); 
    if(modal) {
        modal.classList.add('opacity-0'); 
        setTimeout(()=>modal.classList.add('hidden'), 200); 
    }
}

// ==========================================
// 8. GUARDADO MANUAL, AUTOSAVE, PDF Y EVENTOS
// ==========================================
function saveNoteManual() {
    if (!currentNoteId) return;
    clearTimeout(saveTimeout);
    
    const idx = db.notes.findIndex(n => n.id === currentNoteId);
    if(idx === -1) return;

    const contentJson = Array.from(document.querySelectorAll('.block-container')).map(container => {
        const el = container.querySelector('.block-content') || container.querySelector('[data-type]');
        const type = el.getAttribute('data-type') || 'p';
        let data = {};
        
        if(type === 'youtube') data = { url: el.getAttribute('data-url') };
        if(type === 'image') {
            data = { 
                src: el.getAttribute('data-src'), 
                scale: el.getAttribute('data-scale'), 
                rotation: el.getAttribute('data-rotation'),
                cropTop: el.getAttribute('data-croptop'),
                cropRight: el.getAttribute('data-cropright'),
                cropBottom: el.getAttribute('data-cropbottom'),
                cropLeft: el.getAttribute('data-cropleft')
            };
        }
        
        return { id: generateId(), type: type, text: el.innerHTML || '', data: data };
    });

    db.notes[idx] = { 
        ...db.notes[idx], 
        title: document.getElementById('editor-title').value, 
        subjectId: document.getElementById('editor-subject-select').value, 
        content: contentJson, 
        updatedAt: Date.now() 
    };
    saveDB();

    const status = document.getElementById('save-status');
    if(status) {
        status.innerHTML = '<i data-lucide="check-circle-2" class="w-4 h-4 text-green-500"></i> Guardado manual';
        lucide.createIcons();
    }
    createToast('Guardado Exitoso', 'Los cambios del apunte se han guardado manualmente.');
}

let saveTimeout;
function triggerAutosave() {
    if (!currentNoteId) return;
    const status = document.getElementById('save-status'); 
    if(status) {
        status.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i>'; 
        lucide.createIcons();
    }
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        const idx = db.notes.findIndex(n => n.id === currentNoteId);
        if(idx === -1) return;
        
        const contentJson = Array.from(document.querySelectorAll('.block-container')).map(container => {
            const el = container.querySelector('.block-content') || container.querySelector('[data-type]');
            const type = el.getAttribute('data-type') || 'p';
            let data = {};
            
            if(type === 'youtube') data = { url: el.getAttribute('data-url') };
            if(type === 'image') {
                data = { 
                    src: el.getAttribute('data-src'), 
                    scale: el.getAttribute('data-scale'), 
                    rotation: el.getAttribute('data-rotation'),
                    cropTop: el.getAttribute('data-croptop'),
                    cropRight: el.getAttribute('data-cropright'),
                    cropBottom: el.getAttribute('data-cropbottom'),
                    cropLeft: el.getAttribute('data-cropleft')
                };
            }
            
            return { id: generateId(), type: type, text: el.innerHTML || '', data: data };
        });

        db.notes[idx] = { 
            ...db.notes[idx], 
            title: document.getElementById('editor-title').value, 
            subjectId: document.getElementById('editor-subject-select').value, 
            content: contentJson, 
            updatedAt: Date.now() 
        };
        saveDB(); 
        if(status) {
            status.innerHTML = '<i data-lucide="cloud-check" class="w-4 h-4 text-green-500"></i>'; 
            lucide.createIcons();
        }
    }, 800);
}

function exportToPDF() {
    document.querySelectorAll('.pdf-exclude').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.pdf-only').forEach(el => el.style.display = 'flex');
    
    const element = document.getElementById('pdf-content');
    const opt = { margin: 10, filename: `${document.getElementById('editor-title').value || 'Apunte'}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    
    html2pdf().set(opt).from(element).save().then(() => {
        document.querySelectorAll('.pdf-exclude').forEach(el => el.style.display = '');
        document.querySelectorAll('.pdf-only').forEach(el => el.style.display = 'none');
    });
}

function handleBlockKeydown(e, el) {
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault(); 
        const div = document.createElement('div'); 
        const type = el.getAttribute('data-type') === 'todo' ? 'todo' : 'p'; 
        div.innerHTML = createBlockHTML(type); 
        el.parentElement.after(div.firstElementChild); 
        lucide.createIcons(); 
        div.firstElementChild.querySelector('.block-content').focus(); 
        triggerAutosave(); 
    }
    if (e.key === 'Backspace' && el.innerText === '') { 
        e.preventDefault(); 
        const prev = el.parentElement.previousElementSibling; 
        if (prev) { 
            el.parentElement.remove(); 
            const p = prev.querySelector('.block-content'); 
            if(p) p.focus(); 
            triggerAutosave(); 
        } 
    }
}

document.addEventListener('selectionchange', () => {
    const sel = window.getSelection(); 
    const t = document.getElementById('inline-toolbar');
    if (sel.rangeCount > 0 && !sel.isCollapsed && document.activeElement && document.activeElement.classList.contains('block-content')) {
        const r = sel.getRangeAt(0).getBoundingClientRect(); 
        t.style.top = `${r.top + window.scrollY - 40}px`; 
        t.style.left = `${Math.max(10, r.left + (r.width/2) - 40)}px`; 
        t.classList.remove('hidden'); 
        setTimeout(() => t.classList.remove('opacity-0', '-translate-y-2'), 10);
    } else if(t) { 
        t.classList.add('opacity-0', '-translate-y-2'); 
        setTimeout(() => t.classList.add('hidden'), 150); 
    }
});

function formatText(c) { 
    document.execCommand(c, false, null); 
    triggerAutosave(); 
}

function showBlockMenu(e, btn) { 
    e.stopPropagation(); 
    activeBlockContainer = btn.closest('.block-container'); 
    const m = document.getElementById('block-menu'); 
    const r = btn.getBoundingClientRect(); 
    m.style.top = `${r.bottom + window.scrollY}px`; 
    m.style.left = `${r.left}px`; 
    m.classList.remove('hidden'); 
    setTimeout(() => m.classList.remove('opacity-0'), 10); 
}

document.addEventListener('click', () => { 
    const blockMenu = document.getElementById('block-menu');
    const slashMenu = document.getElementById('slash-menu');
    if(blockMenu) blockMenu.classList.add('hidden', 'opacity-0'); 
    if(slashMenu) slashMenu.classList.add('hidden', 'opacity-0'); 
});

function moveBlock(dir) { 
    if(!activeBlockContainer) return; 
    if(dir === -1 && activeBlockContainer.previousElementSibling) {
        activeBlockContainer.parentNode.insertBefore(activeBlockContainer, activeBlockContainer.previousElementSibling); 
    } else if(dir === 1 && activeBlockContainer.nextElementSibling) {
        activeBlockContainer.parentNode.insertBefore(activeBlockContainer.nextElementSibling, activeBlockContainer); 
    }
    triggerAutosave(); 
}

function deleteActiveBlock() { 
    if(activeBlockContainer) { 
        activeBlockContainer.remove(); 
        triggerAutosave(); 
    } 
}

function selectColor(cls) { 
    selectedColor = cls; 
    document.querySelectorAll('.color-btn').forEach(b => b.className = b.className.replace(/ring-\w+-500/, 'ring-transparent').replace(/ring-gray-800/, 'ring-transparent')); 
    if(event && event.target) {
        event.target.classList.remove('ring-transparent'); 
        event.target.classList.add(`ring-${cls.split('-')[1]}-500`); 
    }
}

function createSubject() { 
    const n = document.getElementById('new-subject-name').value; 
    if (!n.trim()) return; 
    db.subjects.push({ id: generateId(), name: n, color: selectedColor }); 
    saveDB(); 
    renderSidebarSubjects(); 
    renderDashboard(); 
    toggleModal('subject-modal'); 
    document.getElementById('new-subject-name').value = ''; 
    createToast('Categoría creada', 'Etiqueta lista para usarse.'); 
}

function createNewNote() { 
    const n = { 
        id: generateId(), 
        subjectId: currentCategoryFilter !== 'all' ? currentCategoryFilter : (db.subjects.length > 0 ? db.subjects[0].id : null), 
        title: '', 
        content: [{ id: generateId(), type: 'p', text: '' }], 
        updatedAt: Date.now(), 
        isFavorite: false 
    }; 
    db.notes.push(n); 
    saveDB(); 
    openNote(n.id); 
}

function deleteNote(id, e) { 
    e.stopPropagation(); 
    if(confirm("¿Eliminar apunte?")) { 
        db.notes = db.notes.filter(n => n.id !== id); 
        saveDB(); 
        renderDashboard(); 
    } 
}

function deleteSubject(id, e) { 
    e.stopPropagation(); 
    if(confirm("CASCADA: Eliminará TODOS los apuntes asociados. ¿Continuar?")) { 
        db.subjects = db.subjects.filter(s => s.id !== id); 
        db.notes = db.notes.filter(n => n.subjectId !== id); 
        if(currentCategoryFilter === id) currentCategoryFilter = 'all'; 
        saveDB(); 
        renderDashboard(); 
        if(currentNoteId && !db.notes.find(n=>n.id===currentNoteId)) switchView('dashboard'); 
    } 
}

function toggleFavorite(id, e) { 
    e.stopPropagation(); 
    const n = db.notes.find(x => x.id === id); 
    if(n) n.isFavorite = !n.isFavorite; 
    saveDB(); 
    renderDashboard(); 
}

function performSearch() { 
    const q = document.getElementById('search-input').value.toLowerCase(); 
    const c = document.getElementById('search-results'); 
    c.innerHTML = ''; 
    if (!q) return; 
    const res = db.notes.filter(n => { 
        const s = db.subjects.find(x => x.id === n.subjectId); 
        return (n.title && n.title.toLowerCase().includes(q)) || 
               n.content.some(b => typeof b.text==='string' && b.text.toLowerCase().includes(q)) || 
               (s && s.name.toLowerCase().includes(q)); 
    }); 
    if (res.length === 0) { 
        c.innerHTML = '<p class="text-gray-500 text-sm p-2">Sin resultados.</p>'; 
        return; 
    } 
    res.forEach(n => { 
        const s = db.subjects.find(x => x.id === n.subjectId) || { name: 'General' }; 
        c.innerHTML += `<button onclick="toggleModal('search-modal'); openNote('${n.id}')" class="w-full flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-left mt-1"><div class="flex items-center gap-3 truncate"><div class="p-2 bg-gray-200 dark:bg-gray-600 rounded"><i data-lucide="file-text" class="w-4 h-4 text-blue-500"></i></div><div class="truncate"><p class="text-sm font-bold dark:text-white">${n.title || 'Sin título'}</p><p class="text-xs text-gray-500">${s.name}</p></div></div></button>`; 
    }); 
    lucide.createIcons(); 
}

function toggleModal(id) { 
    const m = document.getElementById(id); 
    if(!m) return;
    const c = m.children[0]; 
    if (m.classList.contains('hidden')) { 
        m.classList.remove('hidden'); 
        if(id==='search-modal') { 
            document.getElementById('search-input').value=''; 
            document.getElementById('search-results').innerHTML=''; 
            setTimeout(()=>document.getElementById('search-input').focus(),50); 
        } 
        setTimeout(() => { m.classList.remove('opacity-0'); if(c) c.classList.remove('scale-95'); }, 10); 
    } else { 
        m.classList.add('opacity-0'); 
        if(c) c.classList.add('scale-95'); 
        setTimeout(() => m.classList.add('hidden'), 200); 
    } 
}

function createToast(t, d) { 
    const c = document.getElementById('toast-container'); 
    if(!c) return;
    const el = document.createElement('div'); 
    el.className = 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 transform translate-y-10 opacity-0 transition-all pointer-events-auto'; 
    el.innerHTML = `<div class="bg-green-500/20 dark:bg-green-500 p-1 rounded-full"><i data-lucide="check" class="w-4 h-4 text-green-400 dark:text-white"></i></div><div><p class="text-sm font-bold">${t}</p><p class="text-xs opacity-70">${d}</p></div>`; 
    c.appendChild(el); 
    lucide.createIcons(); 
    requestAnimationFrame(() => el.classList.remove('translate-y-10', 'opacity-0')); 
    setTimeout(() => { el.classList.add('translate-y-10', 'opacity-0'); setTimeout(() => el.remove(), 300); }, 3000); 
}

// Escuchar atajos globales (Ctrl+S / Cmd+S para Guardado Manual, ESC, Cmd+K)
document.addEventListener('keydown', (e) => { 
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { 
        e.preventDefault(); 
        saveNoteManual(); 
    }
    if (e.key === 'Escape') {
        document.querySelectorAll('[id$="-modal"]').forEach(m => { 
            if(!m.classList.contains('hidden')) toggleModal(m.id); 
        });
    } 
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { 
        e.preventDefault(); 
        toggleModal('search-modal'); 
    } 
});

document.addEventListener('DOMContentLoaded', () => { 
    initDarkMode(); 
    checkAuth(); 
    lucide.createIcons(); 
});