
/* Navegação responsiva / dropdowns */
function toggleMenu() {
    const menu = document.querySelector('.menu');
    menu.classList.toggle('show');
}

document.addEventListener('DOMContentLoaded', function() {
    // Hide Admin menu for non-admin users
    try {
        var nivel = (document.body && document.body.dataset) ? document.body.dataset.nivel : undefined;
        if (nivel !== '2') {
            var adminBtn = document.getElementById('menu-admin');
            if (adminBtn) {
                var adminLi = adminBtn.closest('.menu-dropdown');
                if (adminLi) adminLi.style.display = 'none';
            }
        }
    } catch (e) {}
    // Botão hamburguer para o novo layout
    const menuToggle = document.querySelector('.menu-toggle');
    const primaryMenu = document.getElementById('primary-menu');
    if (menuToggle && primaryMenu) {
        menuToggle.addEventListener('click', () => {
            const open = primaryMenu.classList.toggle('open');
            menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }

    // Dropdowns (Admin e Usuário)
    function setupDropdowns() {
        document.querySelectorAll('.menu-dropdown .dropdown-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const li = btn.closest('.menu-dropdown');
                const isOpen = li.classList.contains('open');
                document.querySelectorAll('.menu-dropdown.open').forEach(el => el.classList.remove('open'));
                li.classList.toggle('open', !isOpen);
                btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
            });
        });

        // Fecha dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-dropdown')) {
                document.querySelectorAll('.menu-dropdown.open').forEach(el => el.classList.remove('open'));
            }
        });
    }
    setupDropdowns();

    const menuLinks = document.querySelectorAll('.menu a');
    const dicasMenuItem = document.getElementById('menu-dicas');
    const currentURL = window.location.pathname;
    
    // Função para marcar o link atual com base na URL
    function updateSelectedMenu() {
        const currentPath = window.location.pathname;
        menuLinks.forEach(link => {
            // Remover a classe 'selected' de todos os links
            link.classList.remove('selected');
            
            // Adiciona a classe 'selected' ao link que corresponde ao caminho atual
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('selected');
                // Atualiza o localStorage para refletir o link atual
                localStorage.setItem('selectedMenuItem', link.id);
            }
                // Adiciona a classe 'active' ao item 'Dicas' quando a URL contiver "/dicas" ou "/artigos"
            if (currentURL.includes('/dicas') || currentURL.includes('/artigos')) {
                dicasMenuItem.classList.add('active');
            }
        });
        
    }

    // Restaura a seleção ao carregar a página
    updateSelectedMenu();
    
    // Adiciona o evento de clique aos links
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Atualiza o localStorage com o ID do link clicado
            localStorage.setItem('selectedMenuItem', this.id);
        });
    });
});



/*postagem de objetos*/




function previewImages(event, index) {
    const files = event.target.files;
    const previewContainer = document.getElementById(`image-preview${index}`);
    previewContainer.innerHTML = '';

    for (let i = 0; i < files.length; i++) {
        if (files[i]) { 
            const img = document.createElement('img');
            img.src = URL.createObjectURL(files[i]);
            previewContainer.appendChild(img);
        }
    }
}


/*botões de adicionar e excluir imagens*/

let imageCount = 1; 
const maxImages = 4;

function addImageField() {
    if (imageCount < maxImages) { 
        imageCount++; 
        
        // Criação de uma nova div para o campo da imagem
        const newImageField = document.createElement('div');
        newImageField.classList.add('form-group', 'image-container');
        newImageField.innerHTML = `
            <label for="image${imageCount}">Imagem ${imageCount}:</label>
            <input type="file" id="image${imageCount}" name="images" accept="image/*" onchange="previewImages(event, ${imageCount})">
            <div class="image-preview" id="image-preview${imageCount}"></div>
        `;
        
        // Adiciona o novo campo ao contêiner de imagens
        document.getElementById('image-fields').appendChild(newImageField);
    } else {
        alert('Você já adicionou o número máximo de imagens (4).'); 
    }
}

function removeImageField() {
    if (imageCount > 1) { 
        const lastImageField = document.getElementById('image-fields').lastChild;
        lastImageField.remove(); 
        imageCount--; 
    } else {
        alert('Não há mais imagens para excluir.'); 
    }
}


/*campo valor da recompensa*/

function formatCurrency(input) {
    let value = input.value.replace(/\D/g, ''); 
    value = (value / 100).toFixed(2); 
    value = value.replace(".", ","); 
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, "."); 
    input.value = `R$ ${value}`; 
}

/*campo valor da recompensa ao editar*/

document.addEventListener("DOMContentLoaded", function () {
    const rewardInput = document.getElementById("reward");

    // Formata o valor existente ao carregar a página
    if (rewardInput.value) {
        rewardInput.value = formatCurrencyValue(rewardInput.value);
    }

    // Formata o valor enquanto o usuário digita
    rewardInput.addEventListener("input", function () {
        this.value = formatCurrencyValue(this.value);
    });
});

function formatCurrencyValue(value) {
    value = value.replace(/\D/g, "");  

    value = (value / 100).toFixed(2);
    value = value.replace(".", ",");   

    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    

    return `R$ ${value}`;
}

//-------------------------------------------------------------

// campos para confirmação de senha

document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.getElementById('togglePassword');
    const passwordField = document.getElementById('password');

    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordField = document.getElementById('confirm_password');

    function toggleVisibility(button, field) {
        const isPassword = field.getAttribute('type') === 'password';
        field.setAttribute('type', isPassword ? 'text' : 'password');
        button.textContent = isPassword ? '🙈' : '👁️'; // Alterna o ícone
    }

    togglePassword.addEventListener('click', () => toggleVisibility(togglePassword, passwordField));
    toggleConfirmPassword.addEventListener('click', () => toggleVisibility(toggleConfirmPassword, confirmPasswordField));
});


/*===============================================================
            Amplia a imagem na tela de view do objeto
===============================================================*/

function exibirEmTelaCheia(img) {
    // Cria um elemento overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = 1000;

    // Cria a imagem em tamanho grande
    const fullImage = document.createElement('img');
    fullImage.src = img.src;
    fullImage.style.maxWidth = '90%';
    fullImage.style.maxHeight = '90%';
    fullImage.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';

    // Fecha o overlay ao clicar
    overlay.onclick = () => {
        document.body.removeChild(overlay);
    };

    overlay.appendChild(fullImage);
    document.body.appendChild(overlay);
}

//=======================================================================
//      Função para ativar a guia principal segundo suas subguias                
//=======================================================================

document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname; // Obtém o caminho atual da URL
    console.log('Caminho atual:', currentPath); // Log do caminho atual

    // Subguias associadas às guias principais
    const paths = {
        ajuda: ["/", "/artigos", "/dicasregionais", "/comodenunciar", "/links"],
        admin: ["/gerenciarusuario", "/gerenciarobjeto", "/auditorias"],
        home: ["/filtro"], 
        meusobjetos: ["/meusobjetos", "/filtro-status"] // Adiciona a rota do filtro de status à guia Meus Objetos
    };

    // Verifica e ativa as guias principais e suas subguias
    Object.entries(paths).forEach(([menuId, subPaths]) => {
        if (subPaths.includes(currentPath)) {
            console.log(`Ativando menu: ${menuId}`); 
            
            // Ativa a guia principal usando o ID
            const mainMenu = document.getElementById(`menu-${menuId}`);
            if (mainMenu) {
                mainMenu.classList.add("active");
            }

            // Ativa a subguia correspondente (se houver)
            document.querySelectorAll(`.dropdown a[href="${currentPath}"], .subguias-nav a[href="${currentPath}"]`).forEach(link => {
                link.classList.add("active");
            });
        }
    });

    // Ativa a guia "Meus Objetos" diretamente se estiver na rota de filtro de status
    if (currentPath === '/filtro-status') {
        const meusObjetosMenu = document.getElementById('menu-meus-objetos');
        if (meusObjetosMenu) {
            meusObjetosMenu.classList.add("active");
        }
    }
});



