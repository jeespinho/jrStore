// frontend-cliente/js/products.js - VERSÃO FINAL UNIFICADA
console.log("✅ products.js carregado!");

// Estado da aplicação para produtos
let currentCategory = "all";
let currentSort = "name";
let categories = [];

// ==================== SISTEMA DE PRODUTOS ====================

// Função para buscar categorias com produtos
async function loadCategoriesWithProducts() {
  try {
    console.log("📦 Carregando categorias com produtos...");
    const response = await fetch(`${window.API_URL}/categories/with-products`);
    if (!response.ok) throw new Error("Erro ao carregar categorias");

    categories = await response.json();
    console.log("✅ Categorias carregadas:", categories.length);
    return categories;
  } catch (error) {
    console.error("❌ Erro ao carregar categorias:", error);
    return [];
  }
}

// Função para carregar produtos da API
async function loadProducts() {
  try {
    console.log('📡 Buscando produtos da API...');
    const response = await fetch(`${window.API_URL}/products`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const products = await response.json();
    console.log('✅ Produtos da API:', products);
    
    // REMOVER ELEMENTO DE LOADING
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    if (!products || products.length === 0) {
      showEmptyMessage();
      return;
    }
    
    displayProducts(products);
    
  } catch (error) {
    console.error('❌ Erro ao carregar produtos:', error);
    
    // REMOVER LOADING MESMO EM CASO DE ERRO
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    showErrorMessage();
  }
}

// Função para exibir produtos
function displayProducts(products) {
  const productsGrid = document.getElementById('products-grid');
  const loadingElement = document.getElementById('loading');
  
  // GARANTIR que loading está escondido
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
  
  if (!products || products.length === 0) {
    productsGrid.innerHTML = `
      <div class="empty-state">
        <h3>📭 Nenhum produto encontrado</h3>
        <p>Tente novamente mais tarde.</p>
      </div>
    `;
    return;
  }
  
  productsGrid.innerHTML = products.map(product => {
    const hasDiscount = product.oldPrice && product.oldPrice > product.price;
    const discountPercent = hasDiscount ? 
      Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
    
    return `
      <div class="product-card">
        ${hasDiscount ? `<div class="discount-badge">-${discountPercent}%</div>` : ''}
        <img src="${product.imageUrl}" alt="${product.name}" class="product-image"
             onerror="this.src='https://via.placeholder.com/300x300/cccccc/969696?text=Imagem+Não+Carregou'">
        <div class="product-info">
          <div class="product-title">${product.name}</div>
          <div class="product-prices">
            ${hasDiscount ? `
              <div class="price-with-discount">
                <span class="product-old-price">R$ ${product.oldPrice.toFixed(2)}</span>
                <span class="product-price discount">R$ ${product.price.toFixed(2)}</span>
              </div>
            ` : `
              <span class="product-price">R$ ${product.price.toFixed(2)}</span>
            `}
          </div>
          <p class="product-description">${product.description}</p>
          <div class="product-actions">
            <a href="detalhes-produto.html?id=${product.id}" class="btn-details">Ver Detalhes</a>
            <button class="add-to-cart" 
                    onclick="addToCartFromProduct(${JSON.stringify(product).replace(/"/g, '&quot;')})">
              Adicionar
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==================== SISTEMA DE CARRINHO (FONTE ÚNICA) ====================

// Função para adicionar ao carrinho - FONTE ÚNICA
function addToCartFromProduct(product) {
  try {
    const productData = typeof product === 'string' ? JSON.parse(product) : product;
    const cart = getCart();
    const existingItem = cart.find(item => item.id === productData.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: productData.id,
        name: productData.name,
        price: productData.price,
        image: productData.imageUrl,
        quantity: 1
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification('✅ ' + productData.name + ' adicionado ao carrinho!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar ao carrinho:', error);
    showNotification('❌ Erro ao adicionar produto', 'error');
  }
}

// Função para obter carrinho - FONTE ÚNICA
function getCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

// Função para atualizar contador - FONTE ÚNICA
function updateCartCount() {
  const cartCountElements = document.querySelectorAll('.cart-count');
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  cartCountElements.forEach(element => {
    if (element) {
      element.textContent = total;
    }
  });
}

// ==================== SISTEMA DE NOTIFICAÇÕES ====================

// Função para mostrar notificação
function showNotification(message, type = 'success') {
  // Tenta usar o sistema do authManager primeiro
  if (window.authManager && window.authManager.showNotification) {
    window.authManager.showNotification(message, type);
    return;
  }
  
  // Fallback para notificação básica
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

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// ==================== FUNÇÕES AUXILIARES ====================

function showEmptyMessage() {
  const productsGrid = document.getElementById('products-grid');
  productsGrid.innerHTML = `
    <div class="empty-state">
      <h3>📭 Nenhum produto encontrado</h3>
      <p>O banco de dados está vazio. Execute o seed no backend.</p>
    </div>
  `;
}

function showErrorMessage() {
  const productsGrid = document.getElementById('products-grid');
  productsGrid.innerHTML = `
    <div class="error-state">
      <h3>❌ Erro ao carregar produtos</h3>
      <p>Verifique se o servidor está rodando.</p>
    </div>
  `;
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Inicializando products.js...');

  // Atualiza contador do carrinho
  updateCartCount();

  // Carrega produtos se estiver na página de produtos
  const productsGrid = document.getElementById('products-grid');
  if (productsGrid) {
    console.log('📦 Carregando produtos...');
    loadProducts();
  }

  // Configura ordenação
  const sortSelect = document.getElementById('sort-by');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      currentSort = this.value;
      loadProducts();
    });
  }
});

// ==================== EXPORTAÇÕES GLOBAIS ====================

// Exportar para uso em outros arquivos
window.productsModule = {
  loadProducts,
  loadCategoriesWithProducts,
  displayProducts
};

// Exportar funções do carrinho como globais
window.addToCartFromProduct = addToCartFromProduct;
window.getCart = getCart;
window.updateCartCount = updateCartCount;
window.showNotification = showNotification;