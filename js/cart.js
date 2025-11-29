// cart.js - Versão atualizada e unificada
console.log("🛒 cart.js carregado!");

// Estado do carrinho
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Função para adicionar produto ao carrinho
function addToCart(e) {
  const productId = parseInt(e.target.getAttribute("data-id"));
  const product = window.productsModule?.productsData?.find(
    (p) => p.id === productId
  );

  if (!product) {
    console.error('Produto não encontrado:', productId);
    return;
  }

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1,
    });
  }

  updateCart();
  saveCartToStorage();
  showNotification(`${product.name} adicionado ao carrinho!`);
}

// Função para adicionar ao carrinho a partir de objeto produto
function addToCartFromProduct(product) {
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1,
    });
  }

  updateCart();
  saveCartToStorage();
  showNotification(`${product.name} adicionado ao carrinho!`);
}

// Função para atualizar o carrinho
function updateCart() {
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const cartCount = document.querySelector(".cart-count");

  // Atualizar contador
  updateCartCount();

  // Atualizar itens no modal (se existir)
  if (cartItems) {
    cartItems.innerHTML = "";

    if (cart.length === 0) {
      cartItems.innerHTML = "<p>Seu carrinho está vazio</p>";
      if (cartTotal) cartTotal.textContent = "Total: R$ 0,00";
      return;
    }

    let totalPrice = 0;

    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      totalPrice += itemTotal;

      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";
      cartItem.innerHTML = `
              <img src="${item.image}" alt="${item.name}" class="cart-item-image">
              <div class="cart-item-details">
                  <h4 class="cart-item-title">${item.name}</h4>
                  <p class="cart-item-price">R$ ${item.price.toFixed(2)}</p>
                  <div class="cart-item-quantity">
                      <button class="quantity-btn minus" data-id="${
                        item.id
                      }">-</button>
                      <span class="quantity">${item.quantity}</span>
                      <button class="quantity-btn plus" data-id="${
                        item.id
                      }">+</button>
                      <button class="remove-item" data-id="${item.id}">🗑️</button>
                  </div>
              </div>
          `;
      cartItems.appendChild(cartItem);
    });

    if (cartTotal) cartTotal.textContent = `Total: R$ ${totalPrice.toFixed(2)}`;

    // Adicionar eventos aos botões de quantidade e remover
    document.querySelectorAll(".quantity-btn.minus").forEach((button) => {
      button.addEventListener("click", decreaseQuantity);
    });

    document.querySelectorAll(".quantity-btn.plus").forEach((button) => {
      button.addEventListener("click", increaseQuantity);
    });

    document.querySelectorAll(".remove-item").forEach((button) => {
      button.addEventListener("click", removeFromCart);
    });
  }
}

// Função para atualizar apenas o contador do carrinho
function updateCartCount() {
  const cartCountElements = document.querySelectorAll('.cart-count');
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  
  cartCountElements.forEach(element => {
    if (element) {
      element.textContent = totalItems;
    }
  });
}

// Funções para manipular quantidade no carrinho
function decreaseQuantity(e) {
  const productId = parseInt(e.target.getAttribute("data-id"));
  const item = cart.find((item) => item.id === productId);

  if (item.quantity > 1) {
    item.quantity -= 1;
  } else {
    cart = cart.filter((item) => item.id !== productId);
  }

  updateCart();
  saveCartToStorage();
}

function increaseQuantity(e) {
  const productId = parseInt(e.target.getAttribute("data-id"));
  const item = cart.find((item) => item.id === productId);

  item.quantity += 1;
  updateCart();
  saveCartToStorage();
}

function removeFromCart(e) {
  const productId = parseInt(e.target.getAttribute("data-id"));
  cart = cart.filter((item) => item.id !== productId);
  updateCart();
  saveCartToStorage();
}

// Salvar carrinho no localStorage
function saveCartToStorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Carregar carrinho do localStorage
function loadCartFromStorage() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartCount();
  }
}

// Função para mostrar notificação
function showNotification(message) {
  // Tenta usar o sistema de notificação do authManager se disponível
  if (window.authManager && window.authManager.showNotification) {
    window.authManager.showNotification(message);
    return;
  }

  // Fallback para notificação básica
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: var(--success);
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        transition: all 0.3s;
    `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Função para finalizar compra (verifica autenticação)
async function proceedToCheckout() {
  if (!window.authManager || !window.authManager.isLoggedIn()) {
    // Mostra modal de login/cadastro
    openCheckoutModal();
    showNotification("🔐 Faça login ou cadastre-se para finalizar a compra");
    return;
  }

  // Se estiver autenticado, prossegue com o checkout
  await finalizeOrder();
}

function openCheckoutModal() {
  const checkoutModal = document.getElementById("checkout-modal");
  if (checkoutModal) {
    checkoutModal.style.display = "flex";
  } else {
    // Redireciona para página de login se o modal não existir
    window.location.href = 'login.html';
  }
}

function closeCheckoutModal() {
  const checkoutModal = document.getElementById("checkout-modal");
  if (checkoutModal) {
    checkoutModal.style.display = "none";
  }
}

// API de CEP
async function searchCEP(cep) {
  const cleanCEP = cep.replace(/\D/g, "");

  if (cleanCEP.length !== 8) return;

  const cepField = document.getElementById("register-cep");
  if (!cepField) return;

  cepField.disabled = true;

  // Adiciona loading
  let loading = document.querySelector(".cep-loading");
  if (!loading) {
    loading = document.createElement("div");
    loading.className = "cep-loading";
    cepField.parentNode.appendChild(loading);
  }
  loading.textContent = "Buscando CEP...";

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();

    if (!data.erro) {
      const streetField = document.getElementById("register-street");
      const neighborhoodField = document.getElementById("register-neighborhood");
      const cityField = document.getElementById("register-city");
      const stateField = document.getElementById("register-state");

      if (streetField) streetField.value = data.logradouro || "";
      if (neighborhoodField) neighborhoodField.value = data.bairro || "";
      if (cityField) cityField.value = data.localidade || "";
      if (stateField) stateField.value = data.uf || "";

      // Foca no número
      const numberField = document.getElementById("register-number");
      if (numberField) numberField.focus();

      loading.textContent = "CEP encontrado!";
      loading.style.color = "var(--success)";
    } else {
      loading.textContent = "CEP não encontrado";
      loading.style.color = "var(--danger)";
    }
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    loading.textContent = "Erro ao buscar CEP";
    loading.style.color = "var(--danger)";
  } finally {
    setTimeout(() => {
      if (loading.parentNode) {
        loading.remove();
      }
      cepField.disabled = false;
    }, 2000);
  }
}

// Função para obter o carrinho atual
function getCart() {
  return cart;
}

// Função para limpar o carrinho
function clearCart() {
  cart = [];
  saveCartToStorage();
  updateCart();
}

// Inicialização quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
  console.log('🛒 Inicializando carrinho...');
  loadCartFromStorage();
  updateCartCount();
});


// ===== ADICIONE ESTAS FUNÇÕES NO SEU cart.js EXISTENTE =====

// Função para atualizar apenas o contador do carrinho
function updateCartCount() {
  const cartCountElements = document.querySelectorAll('.cart-count');
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  
  cartCountElements.forEach(element => {
    if (element) {
      element.textContent = totalItems;
    }
  });
}

// Função para adicionar ao carrinho a partir de objeto produto
function addToCartFromProduct(product) {
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1,
    });
  }

  updateCart();
  saveCartToStorage();
  showNotification(`${product.name} adicionado ao carrinho!`);
}

// Salvar carrinho no localStorage
function saveCartToStorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Carregar carrinho do localStorage
function loadCartFromStorage() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartCount();
  }
}

// Inicialização quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
  console.log('🛒 Inicializando carrinho...');
  loadCartFromStorage();
  updateCartCount();
});

// Adicione também ao window.cartModule
window.cartModule = {
  // ... suas funções existentes ...
  addToCartFromProduct,
  updateCartCount,
  getCart: () => cart
};

// Exportar funções globais
window.addToCartFromProduct = addToCartFromProduct;
window.updateCartCount = updateCartCount;
window.getCart = () => cart;

// Exportar funções para uso em outros arquivos
window.cartModule = {
  addToCart,
  addToCartFromProduct,
  updateCart,
  updateCartCount,
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
  showNotification,
  getCart,
  clearCart,
  proceedToCheckout
};

// Exportar funções globais
window.addToCartFromProduct = addToCartFromProduct;
window.updateCartCount = updateCartCount;
window.getCart = getCart;
window.proceedToCheckout = proceedToCheckout;