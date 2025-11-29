// carrinho.js - Integrado com authManager

// Array para armazenar itens selecionados
let selectedItems = [];

// Sistema de autenticação integrado
document.addEventListener("DOMContentLoaded", function () {
    console.log("🛒 Carrinho - Inicializando...");
    
    // Verificar autenticação primeiro
    checkAuthentication();
    
    // Inicializar o carrinho
    updateCartDisplay();
    
    // Configurar eventos
    setupEventListeners();
});

function checkAuthentication() {
    console.log("🔐 Carrinho - Verificando autenticação...");
    
    if (!window.authManager || !window.authManager.isLoggedIn()) {
        console.log("🚫 Usuário não está logado");
        updateAuthUI(null);
        return;
    }

    // Usuário está logado - usar o mesmo sistema do perfil
    const user = window.authManager.getCurrentUser();
    if (user) {
        console.log("✅ Usuário logado:", user.name);
        updateAuthUI(user);
    } else {
        console.log("⚠️ authManager existe mas não retornou usuário");
        updateAuthUI(null);
    }
}

function updateAuthUI(user) {
    console.log("🎨 Atualizando UI de autenticação:", user ? user.name : 'Nenhum usuário');
    
    const userMenu = document.getElementById("user-menu");
    const loginBtn = document.getElementById("header-login-btn");
    const userName = document.getElementById("user-name");
    const checkoutBtn = document.getElementById("checkout-btn");
    const loginRequired = document.getElementById("login-required");

    if (user) {
        // Usuário logado
        if (userMenu) userMenu.style.display = "block";
        if (loginBtn) loginBtn.style.display = "none";
        if (userName) userName.textContent = user.name.split(" ")[0];
        if (checkoutBtn) checkoutBtn.style.display = "block";
        if (loginRequired) loginRequired.style.display = "none";
    } else {
        // Usuário não logado
        if (userMenu) userMenu.style.display = "none";
        if (loginBtn) loginBtn.style.display = "block";
        if (checkoutBtn) checkoutBtn.style.display = "none";
        if (loginRequired) loginRequired.style.display = "block";
    }
}

function setupEventListeners() {
    // Configurar logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            if (window.authManager) {
                window.authManager.logout();
                updateAuthUI(null);
                showNotification("✅ Logout realizado com sucesso!");
                // Opcional: redirecionar para página inicial
                // window.location.href = "index.html";
            }
        });
    }

    // Menu Mobile
    const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
    const mainNav = document.getElementById("main-nav");

    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener("click", function () {
            mainNav.classList.toggle("active");
            mobileMenuToggle.classList.toggle("active");
        });

        const navLinks = mainNav.querySelectorAll("a");
        navLinks.forEach((link) => {
            link.addEventListener("click", function () {
                mainNav.classList.remove("active");
                mobileMenuToggle.classList.remove("active");
            });
        });

        document.addEventListener("click", function (e) {
            if (!mainNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                mainNav.classList.remove("active");
                mobileMenuToggle.classList.remove("active");
            }
        });
    }
}

// 🛒 FUNÇÕES DO CARRINHO
function getCart() {
    const cart = localStorage.getItem("cart");
    return cart ? JSON.parse(cart) : [];
}

function updateCartDisplay() {
    const cart = getCart();
    const container = document.getElementById("cart-items-container");
    const cartHeader = document.getElementById("cart-header");
    const subtotalEl = document.getElementById("subtotal");
    const totalEl = document.getElementById("total");
    const freteEl = document.getElementById("frete");
    const descontoEl = document.getElementById("desconto");
    const cartCount = document.querySelector(".cart-count");
    const selectedSummary = document.getElementById("selected-summary");

    let subtotal = 0;
    let selectedSubtotal = 0;
    let selectedCount = 0;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <h3>Seu carrinho está vazio</h3>
                <p>Adicione alguns produtos incríveis!</p>
                <a href="index.html" class="btn">Continuar Comprando</a>
            </div>
        `;
        if (cartHeader) cartHeader.style.display = "none";
        if (selectedSummary) selectedSummary.style.display = "none";
    } else {
        if (cartHeader) cartHeader.style.display = "flex";

        container.innerHTML = cart
            .map((item, index) => {
                const price = item.price || 0;
                const itemTotal = price * (item.quantity || 1);
                subtotal += itemTotal;

                const isSelected = selectedItems.includes(index);
                if (isSelected) {
                    selectedSubtotal += itemTotal;
                    selectedCount += item.quantity || 1;
                }

                return `
                    <div class="cart-item ${isSelected ? "selected" : ""}" data-id="${item.id}" data-index="${index}">
                        <div class="cart-item-select">
                            <input type="checkbox" 
                                class="item-checkbox" 
                                ${isSelected ? "checked" : ""}
                                onchange="toggleItemSelection(${index}, this.checked)">
                        </div>
                        <img src="${item.image || "https://via.placeholder.com/100x100?text=Produto"}" 
                            alt="${item.name || "Produto"}"
                            onerror="this.src='https://via.placeholder.com/100x100?text=Imagem+Indisponível'">
                        <div class="cart-item-details">
                            <h4>${item.name || "Produto sem nome"}</h4>
                            <div class="cart-item-category">${item.category || "Geral"}</div>
                            <div class="cart-item-price">R$ ${price.toFixed(2)}</div>
                            ${item.size ? `<div class="cart-item-variant">Tamanho: ${item.size}</div>` : ""}
                            ${item.color ? `<div class="cart-item-variant">Cor: ${item.color}</div>` : ""}
                        </div>
                        <div class="cart-item-controls">
                            <div class="quantity-controls">
                                <button type="button" onclick="updateQuantity(${index}, -1)">−</button>
                                <span>${item.quantity || 1}</span>
                                <button type="button" onclick="updateQuantity(${index}, 1)">+</button>
                            </div>
                            <button type="button" class="remove-btn" onclick="removeFromCart(${index})">🗑️ Remover</button>
                        </div>
                        <div class="cart-item-total">R$ ${itemTotal.toFixed(2)}</div>
                    </div>
                `;
            })
            .join("");
    }

    updateSelectionInfo(selectedCount, selectedSubtotal);

    const frete = subtotal > 200 ? 0 : 15.9;
    const desconto = subtotal > 300 ? subtotal * 0.1 : 0;
    const total = subtotal + frete - desconto;

    if (subtotalEl) subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    if (freteEl) freteEl.textContent = frete === 0 ? "Grátis" : `R$ ${frete.toFixed(2)}`;
    if (descontoEl) descontoEl.textContent = desconto > 0 ? `- R$ ${desconto.toFixed(2)}` : "R$ 0,00";
    if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2)}`;

    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }

    if (selectedSummary) {
        if (selectedCount > 0) {
            selectedSummary.style.display = "block";
            document.getElementById("selected-items-count").textContent = selectedCount;
            document.getElementById("selected-items-total").textContent = `R$ ${selectedSubtotal.toFixed(2)}`;
        } else {
            selectedSummary.style.display = "none";
        }
    }
}

function toggleItemSelection(index, isSelected) {
    if (isSelected) {
        if (!selectedItems.includes(index)) {
            selectedItems.push(index);
        }
    } else {
        selectedItems = selectedItems.filter((i) => i !== index);
    }
    updateCartDisplay();
}

function toggleSelectAll(selectAll) {
    const cart = getCart();
    if (selectAll) {
        selectedItems = cart.map((_, index) => index);
    } else {
        selectedItems = [];
    }
    updateCartDisplay();
}

function updateSelectionInfo(count, total) {
    const selectedCountEl = document.getElementById("selected-count");
    const selectedTotalEl = document.getElementById("selected-total");
    
    if (selectedCountEl && selectedTotalEl) {
        selectedCountEl.textContent = `${count} ${count === 1 ? "item selecionado" : "itens selecionados"}`;
        selectedTotalEl.textContent = `Total: R$ ${total.toFixed(2)}`;
    }

    const cart = getCart();
    const selectAllCheckbox = document.getElementById("select-all-checkbox");
    if (selectAllCheckbox) {
        if (selectedItems.length === cart.length && cart.length > 0) {
            selectAllCheckbox.checked = true;
        } else {
            selectAllCheckbox.checked = false;
        }
    }
}

function updateQuantity(index, change) {
    const cart = getCart();
    if (cart[index]) {
        cart[index].quantity = (cart[index].quantity || 1) + change;
        if (cart[index].quantity <= 0) {
            removeFromCart(index);
            return;
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartDisplay();
        showNotification("✅ Quantidade atualizada!");
    }
}

function removeFromCart(index) {
    let cart = getCart();
    cart.splice(index, 1);
    selectedItems = selectedItems
        .map((i) => (i > index ? i - 1 : i))
        .filter((i) => i !== index);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartDisplay();
    showNotification("🗑️ Produto removido do carrinho!");
}

function limparCarrinho() {
    if (confirm("Tem certeza que deseja limpar todo o carrinho?")) {
        localStorage.removeItem("cart");
        selectedItems = [];
        updateCartDisplay();
        showNotification("🗑️ Carrinho limpo com sucesso!");
    }
}

function finalizarCompra() {
    // Verificar autenticação usando o mesmo sistema do perfil
    if (!window.authManager || !window.authManager.isLoggedIn()) {
        showNotification("⚠️ Faça login para finalizar a compra!", "error");
        return;
    }

    const user = window.authManager.getCurrentUser();
    if (!user) {
        showNotification("⚠️ Erro ao obter dados do usuário.", "error");
        return;
    }

    const cart = getCart();
    const selectedCartItems = selectedItems.map((index) => cart[index]);

    if (selectedCartItems.length === 0) {
        showNotification("⚠️ Selecione pelo menos um item para finalizar a compra!", "error");
        return;
    }

    localStorage.setItem("selectedForCheckout", JSON.stringify(selectedCartItems));
    showNotification(`✅ Compra finalizada com sucesso, ${user.name.split(" ")[0]}! (Simulação)`);
    
    // Aqui você pode redirecionar para checkout ou processar o pedido
    // window.location.href = "checkout.html";
}

function showNotification(message, type = "success") {
    // Usar o sistema de notificação do authManager se disponível
    if (window.authManager && window.authManager.showNotification) {
        window.authManager.showNotification(message, type);
    } else {
        // Fallback para notificação simples
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Função para adicionar produtos de exemplo (para teste)
function adicionarProdutosExemplo() {
    const produtosExemplo = [
        {
            id: 1,
            name: "Camiseta Básica Premium",
            price: 79.9,
            originalPrice: 99.9,
            image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
            category: "Masculino",
            quantity: 2,
            size: "M",
            color: "Preto",
        },
        {
            id: 2,
            name: "Calça Jeans Slim",
            price: 129.9,
            originalPrice: 159.9,
            image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop",
            category: "Masculino",
            quantity: 1,
            size: "42",
            color: "Azul Escuro",
        },
    ];

    localStorage.setItem("cart", JSON.stringify(produtosExemplo));
    selectedItems = [];
    updateCartDisplay();
    showNotification("🧪 Produtos de exemplo adicionados ao carrinho!");
}