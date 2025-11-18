
/* Navegação responsiva / dropdowns */
function toggleMenu() {
    const menu = document.querySelector('.menu');
    menu.classList.toggle('show');
}

(function(){
    if (window.showQuestionnairePrompt) { return; }
    window.showQuestionnairePrompt = function(message){
        var question = message || 'Responder question\u00e1rio agora?';
        return new Promise(function(resolve){
            try {
                var overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.zIndex = '9999';

                var modal = document.createElement('div');
                modal.style.background = '#fff';
                modal.style.color = '#333';
                modal.style.borderRadius = '12px';
                modal.style.padding = '24px 28px';
                modal.style.maxWidth = '360px';
                modal.style.width = '90%';
                modal.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
                modal.style.textAlign = 'center';
                modal.style.fontFamily = 'inherit';

                var text = document.createElement('p');
                text.textContent = question;
                text.style.marginBottom = '20px';
                text.style.fontSize = '1.05rem';

                var buttons = document.createElement('div');
                buttons.style.display = 'flex';
                buttons.style.gap = '12px';
                buttons.style.justifyContent = 'center';

                function createButton(label, isPrimary){
                    var btn = document.createElement('button');
                    btn.textContent = label;
                    btn.style.minWidth = '80px';
                    btn.style.padding = '10px 16px';
                    btn.style.borderRadius = '8px';
                    btn.style.border = 'none';
                    btn.style.cursor = 'pointer';
                    btn.style.fontSize = '0.95rem';
                    btn.style.fontWeight = '600';
                    if (isPrimary) {
                        btn.style.background = '#007bff';
                        btn.style.color = '#fff';
                    } else {
                        btn.style.background = '#f0f0f0';
                        btn.style.color = '#333';
                    }
                    btn.onmouseenter = function(){ btn.style.opacity = '0.9'; };
                    btn.onmouseleave = function(){ btn.style.opacity = '1'; };
                    return btn;
                }

                function cleanup(result){
                    try {
                        document.removeEventListener('keydown', keyHandler);
                        if (overlay && overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                    } finally {
                        resolve(result);
                    }
                }

                function keyHandler(evt){
                    if (evt.key === 'Escape') {
                        evt.preventDefault();
                        cleanup(false);
                    }
                }

                var yesBtn = createButton('Sim', true);
                var noBtn = createButton('N\u00e3o', false);
                yesBtn.addEventListener('click', function(){ cleanup(true); });
                noBtn.addEventListener('click', function(){ cleanup(false); });

                buttons.appendChild(noBtn);
                buttons.appendChild(yesBtn);

                modal.appendChild(text);
                modal.appendChild(buttons);
                overlay.appendChild(modal);
                document.body.appendChild(overlay);
                document.addEventListener('keydown', keyHandler);
                setTimeout(function(){
                    (noBtn || yesBtn).focus();
                }, 0);
            } catch (err) {
                console.error('Falha ao exibir popup do questionario:', err);
                resolve(window.confirm(question));
            }
        });
    };
})();
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

    const MAX_MB = 5;
    const MAX_BYTES = MAX_MB * 1024 * 1024;

    for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (!f) continue;
        if (!f.type || !f.type.startsWith('image/')) {
            alert('Apenas arquivos de imagem s�o permitidos.');
            continue;
        }
        if (f.size > MAX_BYTES) {
            alert(`Imagem muito grande: limite de ${MAX_MB} MB.`);
            continue;
        }
        const img = document.createElement('img');
        img.src = URL.createObjectURL(f);
        previewContainer.appendChild(img);
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

// ------- Helpers de valida��o/formatos simples -------
function onlyDigits(el) {
    if (!el) return;
    el.value = el.value.replace(/\D/g, '');
}

function onlyAlphaNumUpper(el) {
    if (!el) return;
    el.value = el.value.replace(/[^0-9a-z]/gi, '').toUpperCase();
}

function formatPlate(el) {
    if (!el) return;
    let v = (el.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    el.value = v;
}

function validatePostForm() {
    try {
        const categoryEl = document.getElementById('category');
        const category = categoryEl ? categoryEl.value : '';
        if (category === 'veiculo') {
            const plateEl = document.getElementById('plate');
            const chassisEl = document.getElementById('chassis');
            const plate = plateEl ? plateEl.value.trim() : '';
            const chassis = chassisEl ? chassisEl.value.trim() : '';
            if (!plate && !chassis) {
                alert('Para ve�culos, informe a placa ou o chassi.');
                return false;
            }
            if (plate && (plate.length < 7 || plate.length > 8)) {
                alert('Placa inv�lida. Use 7 a 8 caracteres (ex: ABC1D23).');
                return false;
            }
            if (chassis && chassis.length !== 17) {
                alert('Chassi deve ter 17 caracteres.');
                return false;
            }
        } else if (category === 'eletronico') {
            const identifierEl = document.getElementById('identifier');
            const identifier = identifierEl ? identifierEl.value.trim() : '';
            if (!identifier) {
                alert('Para eletr�nicos, informe um c�digo identificador (ex.: IMEI ou n� de s�rie).');
                return false;
            }
        }
        return true;
    } catch (e) {
        return true;
    }
}

//-------------------------------------------------------------

// campos para confirmação de senha

document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.getElementById('togglePassword');
    const passwordField = document.getElementById('password');

    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordField = document.getElementById('confirm_password');

    function toggleVisibility(event, button, field) {
        event.preventDefault();
        event.stopPropagation();
        const isPassword = field.getAttribute('type') === 'password';
        field.setAttribute('type', isPassword ? 'text' : 'password');
        button.textContent = isPassword ? 'Ocultar' : 'Mostrar'; // Alterna o �cone
    }

    if (togglePassword && passwordField) {
        togglePassword.addEventListener('click', (event) => toggleVisibility(event, togglePassword, passwordField));
    }
    if (toggleConfirmPassword && confirmPasswordField) {
        toggleConfirmPassword.addEventListener('click', (event) => toggleVisibility(event, toggleConfirmPassword, confirmPasswordField));
    }
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







// Suporte ao bot�o de toggle no login (id diferente)
document.addEventListener('DOMContentLoaded', function(){
  var altBtn = document.getElementById('togglePasswordLogin');
  var pwd = document.getElementById('password');
  if(altBtn && pwd){ altBtn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); var isPwd = pwd.type === 'password'; pwd.type = isPwd ? 'text' : 'password'; var icon = altBtn.querySelector('#toggleIcon'); if(icon){ icon.textContent = isPwd ? 'Ocultar' : 'Mostrar'; } altBtn.setAttribute('aria-label', isPwd ? 'Ocultar senha' : 'Mostrar senha'); altBtn.setAttribute('aria-pressed', (!isPwd).toString()); }); }
});