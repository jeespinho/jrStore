// js/auth.js
console.log("🔐 auth.js carregado!");

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.init();
    }

    init() {
        this.loadUserFromStorage();
        this.updateUI();
        this.setupEventListeners();
    }

    // Carregar usuário do localStorage
    loadUserFromStorage() {
        const userData = localStorage.getItem('userData');
        const token = localStorage.getItem('userToken');
        
        if (userData && token) {
            this.currentUser = JSON.parse(userData);
            this.token = token;
            console.log('✅ Usuário carregado do storage:', this.currentUser.name);
        }
    }

    // Salvar usuário no localStorage
    saveUserToStorage(user, token) {
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('userToken', token);
        this.currentUser = user;
        this.token = token;
        this.updateUI();
    }

    // Remover usuário do localStorage (logout)
    removeUserFromStorage() {
        localStorage.removeItem('userData');
        localStorage.removeItem('userToken');
        this.currentUser = null;
        this.token = null;
        this.updateUI();
    }

    // Verificar se usuário está logado
    isLoggedIn() {
        return this.currentUser !== null && this.token !== null;
    }

    // Atualizar interface baseado no estado de login
    updateUI() {
        const loginBtn = document.getElementById('header-login-btn');
        const userMenu = document.getElementById('user-menu');
        const userName = document.getElementById('user-name');

        if (this.isLoggedIn()) {
            // Usuário logado - mostrar menu do usuário
            if (loginBtn) loginBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            if (userName) userName.textContent = this.currentUser.name.split(' ')[0]; // Primeiro nome
        } else {
            // Usuário não logado - mostrar botão de login
            if (loginBtn) loginBtn.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Redirecionar para login se tentar acessar páginas protegidas sem estar logado
        this.protectRoutes();
    }

    // Fazer logout
    logout() {
        if (confirm('Tem certeza que deseja sair?')) {
            this.removeUserFromStorage();
            this.showNotification('👋 Até logo! Você saiu da sua conta.', 'success');
            
            // Redirecionar para home após logout
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    // Proteger rotas que requerem login
    protectRoutes() {
        const protectedRoutes = ['perfil.html', 'pedidos.html', 'checkout.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedRoutes.includes(currentPage) && !this.isLoggedIn()) {
            this.showNotification('🔐 Faça login para acessar esta página.', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    }

    // Fazer login
    async login(email, password) {
        try {
            const response = await fetch(`${window.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.saveUserToStorage(data.user, data.token);
                this.showNotification('🎉 Login realizado com sucesso!', 'success');
                return { success: true, data };
            } else {
                this.showNotification(data.message || '❌ Erro ao fazer login.', 'error');
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.showNotification('🌐 Erro de conexão. Tente novamente.', 'error');
            return { success: false, error: error.message };
        }
    }

    // Fazer cadastro
    async register(userData) {
        try {
            const response = await fetch(`${window.API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('✅ Cadastro realizado com sucesso!', 'success');
                return { success: true, data };
            } else {
                this.showNotification(data.message || '❌ Erro ao realizar cadastro.', 'error');
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Erro no cadastro:', error);
            this.showNotification('🌐 Erro de conexão. Tente novamente.', 'error');
            return { success: false, error: error.message };
        }
    }

    // Obter dados do usuário atual
    getCurrentUser() {
        return this.currentUser;
    }

    // Obter token
    getToken() {
        return this.token;
    }

    // Mostrar notificação
    showNotification(message, type = 'success') {
        // Remove notificações anteriores
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Cria nova notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e74c3c' : '#27ae60'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            font-family: inherit;
        `;

        document.body.appendChild(notification);

        // Remove após 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Verificar autenticação em todas as páginas
    checkAuthOnAllPages() {
        if (this.isLoggedIn()) {
            console.log('✅ Usuário autenticado:', this.currentUser.name);
        } else {
            console.log('🔐 Usuário não autenticado');
        }
        this.updateUI();
    }
}

// Inicializar gerenciador de autenticação
window.authManager = new AuthManager();

// Exportar funções globais
window.checkAuth = () => window.authManager.checkAuthOnAllPages();
window.getCurrentUser = () => window.authManager.getCurrentUser();
window.isLoggedIn = () => window.authManager.isLoggedIn();