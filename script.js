function createParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles';
    document.body.appendChild(particlesContainer);
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.animationDuration = (8 + Math.random() * 4) + 's';
        particle.style.width = (4 + Math.random() * 8) + 'px';
        particle.style.height = particle.style.width;
        particlesContainer.appendChild(particle);
    }
}

function togglePassword(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const toggleIcon = event.target;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

function createRipple(event) {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
}

function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }
}

function getUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function ensureAdminUser() {
    let users = getUsers();
    
    let existingAdmin = users.find(u => u.username === 'admin');
    if (existingAdmin) {
        users = users.filter(u => u.username !== 'admin');
        saveUsers(users);
    }
}

function isAdmin() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return false;
    
    try {
        const user = JSON.parse(currentUser);
        console.log('Current user:', user);
        console.log('Is admin:', user && user.isAdmin === true);
        return user && user.isAdmin === true;
    } catch (e) {
        console.error('Error parsing user:', e);
        return false;
    }
}

function checkAdminAccess() {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('logs.html') || currentPage.includes('admin.html') || 
        currentPage.includes('dashboard.html') || currentPage.includes('db-viewer.html')) {
        if (!isAdmin()) {
            alert('您没有权限访问此页面，请使用管理员账户登录');
            window.location.href = 'index.html';
            return false;
        }
    }
    return true;
}

let loginMode = 'normal';

function fillAdminCredentials() {
    loginMode = 'admin';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('remember').checked = false;
    
    const brandIcon = document.getElementById('brandIcon');
    const brandTitle = document.getElementById('brandTitle');
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeSubtitle = document.getElementById('welcomeSubtitle');
    const adminLoginHint = document.getElementById('adminLoginHint');
    const userLoginHint = document.getElementById('userLoginHint');
    
    if (brandIcon) {
        brandIcon.className = 'fas fa-shield-alt';
        brandIcon.style.color = 'white';
        brandIcon.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
    }
    
    if (brandTitle) {
        brandTitle.textContent = '管理员登录';
        brandTitle.style.color = 'white';
        brandTitle.style.textShadow = '0 0 15px rgba(255, 255, 255, 0.8)';
    }
    
    if (welcomeTitle) {
        welcomeTitle.textContent = '管理员入口';
        welcomeTitle.style.color = 'white';
        welcomeTitle.style.textShadow = '0 0 15px rgba(255, 255, 255, 0.8)';
    }
    
    if (welcomeSubtitle) {
        welcomeSubtitle.textContent = '请输入管理员账户信息';
    }
    
    if (adminLoginHint) adminLoginHint.style.display = 'none';
    if (userLoginHint) userLoginHint.style.display = 'block';
}

function restoreUserLogin() {
    loginMode = 'normal';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('remember').checked = false;
    
    const brandIcon = document.getElementById('brandIcon');
    const brandTitle = document.getElementById('brandTitle');
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeSubtitle = document.getElementById('welcomeSubtitle');
    const adminLoginHint = document.getElementById('adminLoginHint');
    const userLoginHint = document.getElementById('userLoginHint');
    
    if (brandIcon) {
        brandIcon.className = 'fas fa-user-circle';
        brandIcon.style.color = '';
        brandIcon.style.textShadow = '';
    }
    
    if (brandTitle) {
        brandTitle.textContent = '个人主页';
        brandTitle.style.color = '';
        brandTitle.style.textShadow = '';
    }
    
    if (welcomeTitle) {
        welcomeTitle.textContent = '欢迎回来';
        welcomeTitle.style.color = '';
        welcomeTitle.style.textShadow = '';
    }
    
    if (welcomeSubtitle) {
        welcomeSubtitle.textContent = '请登录您的账户';
    }
    
    if (adminLoginHint) adminLoginHint.style.display = 'block';
    if (userLoginHint) userLoginHint.style.display = 'none';
}

function showLoginSuccessPanel(user) {
    if (loginMode === 'admin') {
        if (user.isAdmin) {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } else {
            showError('您不是管理员，无权进入管理平台');
            localStorage.removeItem('currentUser');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    } else {
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 500);
    }
}

function goToLogs() {
    window.location.href = 'logs.html';
}

function goToAdmin() {
    window.location.href = 'admin.html';
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberedUsername');
    localStorage.removeItem('rememberMe');
    window.location.href = 'index.html';
}

function updateAdminLinks() {
    const adminLinks = document.querySelectorAll('.admin-link');
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.isAdmin === true) {
            adminLinks.forEach(link => {
                link.style.display = 'block';
            });
        } else {
            adminLinks.forEach(link => {
                link.style.display = 'none';
            });
        }
    } else {
        adminLinks.forEach(link => {
            link.style.display = 'none';
        });
    }
}

function getLogs() {
    const logs = localStorage.getItem('logs');
    return logs ? JSON.parse(logs) : [];
}

function saveLogs(logs) {
    localStorage.setItem('logs', JSON.stringify(logs));
}

function getWallpapers() {
    const wallpapers = localStorage.getItem('wallpapers');
    return wallpapers ? JSON.parse(wallpapers) : [];
}

function saveWallpapers(wallpapers) {
    localStorage.setItem('wallpapers', JSON.stringify(wallpapers));
}

function addWallpaper(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const wallpapers = getWallpapers();
            const newWallpaper = {
                id: Date.now(),
                name: file.name,
                data: e.target.result,
                uploadTime: new Date().toISOString()
            };
            wallpapers.push(newWallpaper);
            saveWallpapers(wallpapers);
            addLog('上传壁纸', { name: file.name, id: newWallpaper.id });
            resolve(newWallpaper);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function deleteWallpaper(id) {
    const wallpapers = getWallpapers();
    const updated = wallpapers.filter(w => w.id !== id);
    saveWallpapers(updated);
    addLog('删除壁纸', { id: id });
}

function addLog(action, details = {}) {
    const logs = getLogs();
    const currentUser = localStorage.getItem('currentUser');
    const user = currentUser ? JSON.parse(currentUser) : null;
    
    const log = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action: action,
        user: user ? user.username : '未登录',
        userId: user ? user.id : null,
        details: details,
        ip: '本地',
        userAgent: navigator.userAgent
    };
    
    logs.push(log);
    
    if (logs.length > 1000) {
        logs.shift();
    }
    
    saveLogs(logs);
    return log;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function generateSalt(length = 16) {
    return CryptoJS.lib.WordArray.random(length).toString();
}

function hashPassword(password, salt) {
    if (!salt) {
        salt = generateSalt();
    }
    const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 512 / 32,
        iterations: 100000,
        hasher: CryptoJS.algo.SHA256
    });
    return {
        hash: key.toString(),
        salt: salt
    };
}

function verifyPassword(password, storedHash, salt) {
    const result = hashPassword(password, salt);
    return result.hash === storedHash;
}

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const rememberMe = document.getElementById('remember')?.checked || false;
    
    addLog('登录尝试', { username: username, rememberMe: rememberMe, success: false });
    
    if (!username || !password) {
        showError('请输入用户名和密码');
        addLog('登录失败', { username: username, reason: '用户名或密码为空' });
        return;
    }
    
    const loginBtn = document.querySelector('.login-btn');
    loginBtn.classList.add('loading');
    
    setTimeout(() => {
        const users = getUsers();
        const user = users.find(u => u.username === username);
        
        if (user) {
            const isPasswordValid = user.salt ? verifyPassword(password, user.password, user.salt) : (user.password === hashPassword(password).hash);
            
            if (isPasswordValid) {
                showSuccess('登录成功！欢迎回来...');
                console.log('Logging in user:', user);
                console.log('User isAdmin:', user.isAdmin);
                localStorage.setItem('currentUser', JSON.stringify(user));
            
                if (rememberMe) {
                    localStorage.setItem('rememberedUsername', username);
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('rememberedUsername');
                    localStorage.removeItem('rememberMe');
                }
                
                addLog('登录成功', { username: username, userId: user.id, rememberMe: rememberMe, isAdmin: user.isAdmin });
                
                setTimeout(() => {
                    showLoginSuccessPanel(user);
                }, 1500);
            } else {
                showError('用户名或密码错误');
                addLog('登录失败', { username: username, reason: '用户名或密码错误' });
            }
        } else {
            showError('用户名或密码错误');
            addLog('登录失败', { username: username, reason: '用户名不存在' });
        }
        
        loginBtn.classList.remove('loading');
    }, 1000);
}

function loadRememberedUser() {
    const rememberMe = localStorage.getItem('rememberMe');
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    
    if (rememberMe === 'true' && rememberedUsername) {
        const usernameInput = document.getElementById('username');
        const rememberCheckbox = document.getElementById('remember');
        
        if (usernameInput) {
            usernameInput.value = rememberedUsername;
        }
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
}

function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const isAdmin = document.getElementById('isAdmin')?.checked || false;
    
    const loginBtn = document.querySelector('.login-btn');
    loginBtn.classList.add('loading');
    
    addLog('注册尝试', { username: username, email: email, isAdmin: isAdmin });
    
    if (!username) {
        showError('请输入用户名');
        addLog('注册失败', { username: username, reason: '用户名为空' });
        loginBtn.classList.remove('loading');
        return;
    }
    
    if (!password) {
        showError('请输入密码');
        addLog('注册失败', { username: username, reason: '密码为空' });
        loginBtn.classList.remove('loading');
        return;
    }
    
    if (password.length < 6) {
        showError('密码长度至少为6位');
        addLog('注册失败', { username: username, reason: '密码长度不足6位' });
        loginBtn.classList.remove('loading');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('两次输入的密码不一致');
        addLog('注册失败', { username: username, reason: '两次密码不一致' });
        loginBtn.classList.remove('loading');
        return;
    }
    
    setTimeout(() => {
        try {
            const users = getUsers();
            const existingUser = users.find(u => {
                const usernameMatch = u.username === username;
                const emailMatch = email && u.email === email;
                return usernameMatch || emailMatch;
            });
            
            if (existingUser) {
                showError('用户名或邮箱已存在');
                addLog('注册失败', { username: username, reason: '用户名或邮箱已存在' });
                loginBtn.classList.remove('loading');
                return;
            }
            
            const passwordHash = hashPassword(password);
            const newUser = {
                id: Date.now(),
                username: username,
                password: passwordHash.hash,
                salt: passwordHash.salt,
                email: email,
                createdAt: new Date().toISOString(),
                isAdmin: isAdmin
            };
            
            users.push(newUser);
            saveUsers(users);
            
            addLog('注册成功', { username: username, email: email, userId: newUser.id, isAdmin: isAdmin });
            showSuccess('注册成功！正在跳转到登录页面...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            console.error('注册失败:', error);
            showError('注册失败，请重试');
            addLog('注册失败', { username: username, reason: '系统错误: ' + error.message });
        } finally {
            loginBtn.classList.remove('loading');
        }
    }, 500);
}

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
}

const loginBtn = document.querySelector('.login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', createRipple);
}

document.addEventListener('DOMContentLoaded', createParticles);
document.addEventListener('DOMContentLoaded', loadRememberedUser);
document.addEventListener('DOMContentLoaded', ensureAdminUser);
document.addEventListener('DOMContentLoaded', checkAdminAccess);
document.addEventListener('DOMContentLoaded', updateAdminLinks);

document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');
    if (container) {
        container.style.opacity = '0';
        container.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            container.style.transition = 'all 0.6s ease-out';
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 100);
    }
});

function toggleBgCustomizer() {
    const panel = document.getElementById('bgPanel');
    if (panel) {
        panel.classList.toggle('active');
    }
}

function setBackground(imageUrl) {
    const root = document.documentElement;
    root.style.setProperty('--bg-image', `url('${imageUrl}')`);
    
    document.querySelectorAll('.bg-option').forEach(option => {
        option.classList.remove('active');
    });
    
    const activeOption = document.querySelector(`[data-bg="${imageUrl}"]`);
    if (activeOption) {
        activeOption.classList.add('active');
    }
}

function applyCustomBg() {
    const urlInput = document.getElementById('bgUrlInput');
    if (urlInput) {
        const url = urlInput.value.trim();
        if (url) {
            setBackground(url);
            urlInput.value = '';
        }
    }
}

document.querySelectorAll('.bg-option').forEach(option => {
    option.addEventListener('click', function() {
        const bgUrl = this.getAttribute('data-bg');
        setBackground(bgUrl);
    });
});

document.addEventListener('click', function(event) {
    const panel = document.getElementById('bgPanel');
    const btn = document.querySelector('.bg-customizer-btn');
    
    if (panel && btn && !panel.contains(event.target) && !btn.contains(event.target)) {
        panel.classList.remove('active');
    }
});