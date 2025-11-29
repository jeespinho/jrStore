// js/main.js - VERSÃO SIMPLIFICADA
console.log("🚀 main.js carregado!");

document.addEventListener('DOMContentLoaded', function() {
    console.log("📦 Inicializando aplicação...");
    
    // Verificar autenticação
    if (window.authManager) {
        window.authManager.checkAuthOnAllPages();
    }
    
    // Atualizar contador do carrinho (usando a função unificada)
    if (window.updateCartCount) {
        window.updateCartCount();
    }
    
    // Carregar produtos se estiver na página principal
    if (document.getElementById('products-grid') && window.productsModule) {
        window.productsModule.loadProducts();
    }
});