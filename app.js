import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy,
    where
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import * as XLSX from 'https://cdn.jsdelivr.net/npm/xlsx@0.17.5/+esm';
import jspdf from 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm';

// Performance and Error Handling Improvements
const CACHE_VERSION = '1.0.0';
const PERFORMANCE_LOGGING = true;

// Enhanced Logging and Performance Tracking
function logPerformance(context, startTime) {
  if (PERFORMANCE_LOGGING) {
    const duration = performance.now() - startTime;
    console.log(`Performance: ${context} took ${duration.toFixed(2)}ms`);
  }
}

// Add Performance and Accessibility Tracking
function trackPageLoad() {
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    
    // Core Web Vitals Logging
    const {
      loadEventEnd,
      domComplete,
      domInteractive
    } = performance.timing;

    console.log('Core Web Vitals:', {
      'First Contentful Paint': domInteractive - performance.timing.navigationStart,
      'Time to Interactive': domComplete - performance.timing.navigationStart,
      'Total Load Time': loadEventEnd - performance.timing.navigationStart
    });
  });
}

// Lazy Loading Images
function setupLazyLoading() {
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  
  if ('IntersectionObserver' in window) {
    let imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          let image = entry.target;
          image.src = image.dataset.src || image.src;
          imageObserver.unobserve(image);
        }
      });
    }, {
      rootMargin: "50px 0px",
      threshold: 0.01
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  }
}

// Implement Service Worker for Caching
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {scope: '/'});
      console.log('Service Worker registered successfully:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

// Accessibility and Performance Initialization
document.addEventListener('DOMContentLoaded', () => {
  trackPageLoad();
  setupLazyLoading();
  registerServiceWorker();
});

// Improved error handling and logging
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Enhanced error logging function
function logError(context, error) {
    console.error(`Error in ${context}:`, error);
    // Optional: Add more robust error tracking/reporting
}

// Refactored safeAddEventListener to improve reliability
function safeAddEventListener(selector, event, handler) {
    try {
        const element = document.querySelector(selector);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Element not found: ${selector}`);
        }
    } catch (error) {
        logError('safeAddEventListener', error);
    }
}

// Logout function
function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = 'index.html'; // Redirect to home page after logout
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
            }
        });
    }
}

// Form Validation and Interactivity
function setupAssociateFormValidation() {
    const form = document.getElementById('associadoForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input, select, textarea');
    const submitButton = form.querySelector('button[type="submit"]');
    const termsCheckbox = form.querySelector('#termos');

    // Real-time validation
    inputs.forEach(input => {
        input.addEventListener('input', () => validateInput(input));
        input.addEventListener('blur', () => validateInput(input));
    });

    // Terms checkbox
    termsCheckbox.addEventListener('change', () => {
        validateForm();
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            try {
                await registerAssociate(Object.fromEntries(new FormData(form)));
                form.reset();
                alert('Cadastro realizado com sucesso! Verifique seu e-mail.');
            } catch (error) {
                console.error('Erro no registro:', error);
                alert('Erro ao realizar cadastro. Por favor, tente novamente.');
            }
        }
    });

    function validateInput(input) {
        const errorSpan = input.nextElementSibling;
        
        if (input.validity.valid) {
            input.classList.remove('invalid');
            errorSpan.textContent = '';
        } else {
            input.classList.add('invalid');
            errorSpan.textContent = input.dataset.error || 'Campo inválido';
        }

        validateForm();
    }

    function validateForm() {
        const isValid = form.checkValidity() && termsCheckbox.checked;
        submitButton.disabled = !isValid;
        return isValid;
    }
}

// Associate Registration Function
function generateAssociateNumber() {
    const timestamp = Date.now().toString();
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ADEP-${timestamp.slice(-6)}-${randomPart}`;
}

async function registerAssociate(associadoData) {
    // Generate unique associate number
    associadoData.associateNumber = generateAssociateNumber();
    
    // Add timestamp and initial status
    associadoData.dataCadastro = new Date().toISOString();
    associadoData.status = 'Pendente';

    try {
        const docRef = await addDoc(collection(db, 'associados'), associadoData);
        
        // Send confirmation email (simulated)
        await sendConfirmationEmail(associadoData);

        return docRef;
    } catch (error) {
        console.error('Erro no registro de associado:', error);
        throw error;
    }
}

// Simulated Email Confirmation
async function sendConfirmationEmail(associadoData) {
    // In a real scenario, this would use a backend service or email API
    console.log('Enviando e-mail de confirmação para:', associadoData.email);
    // Simulated email content
    const emailContent = `
        Bem-vindo à ADEP, ${associadoData.nome}!

        Seu registro foi recebido e está em processo de aprovação.
        Aguarde nossa confirmação nos próximos dias.

        Obrigado por se juntar à nossa comunidade!

        Associação ADEP
    `;
    
    // You would typically use a backend service to send actual emails
}

// Fetch and Display Events
async function loadEvents() {
    const eventsContainer = document.getElementById('eventsList');
    if (!eventsContainer) return;

    try {
        const eventsQuery = query(
            collection(db, 'events'), 
            orderBy('date', 'asc')
        );

        const eventsSnapshot = await getDocs(eventsQuery);
        
        // Clear existing events
        eventsContainer.innerHTML = '';

        // Display only future events
        const now = new Date();
        eventsSnapshot.forEach((doc) => {
            const event = { id: doc.id, ...doc.data() };
            const eventDate = new Date(event.date);
            
            if (eventDate >= now) {
                const eventCard = document.createElement('div');
                eventCard.classList.add('event-card');
                eventCard.innerHTML = `
                    ${event.imageUrl ? `<img src="${event.imageUrl}" alt="${event.title}" class="event-image">` : ''}
                    <h3>${event.title}</h3>
                    <p class="event-date">${new Date(event.date).toLocaleString()}</p>
                    <p class="event-location">${event.location}</p>
                    <p>${event.description}</p>
                `;
                eventsContainer.appendChild(eventCard);
            }
        });
    } catch (error) {
        logError('loadEvents', error);
    }
}

// Fetch and Display Opportunities
async function loadOpportunities(categoryFilter = '') {
    const opportunitiesContainer = document.getElementById('opportunitiesList');
    if (!opportunitiesContainer) return;

    try {
        let opportunitiesQuery = query(
            collection(db, 'opportunities'), 
            orderBy('createdAt', 'desc')
        );

        const opportunitiesSnapshot = await getDocs(opportunitiesQuery);
        
        // Clear existing opportunities
        opportunitiesContainer.innerHTML = '';

        // Filter and display opportunities
        const now = new Date();
        opportunitiesSnapshot.forEach((doc) => {
            const opportunity = { id: doc.id, ...doc.data() };
            
            // Apply category filter if provided
            if (categoryFilter && opportunity.type !== categoryFilter) return;
            
            // Check if opportunity is still valid
            const validUntil = opportunity.validUntil ? new Date(opportunity.validUntil) : null;
            if (validUntil && validUntil < now) return;

            const opportunityCard = document.createElement('div');
            opportunityCard.classList.add('opportunity-card');
            opportunityCard.innerHTML = `
                ${opportunity.imageUrl ? `<img src="${opportunity.imageUrl}" alt="${opportunity.title}" class="opportunity-image">` : ''}
                <h3>${opportunity.title}</h3>
                <p class="opportunity-type">${opportunity.type}</p>
                <p>${opportunity.description}</p>
                <div class="opportunity-contact">
                    <a href="${opportunity.contact}" target="_blank">Mais Informações</a>
                </div>
            `;
            opportunitiesContainer.appendChild(opportunityCard);
        });
    } catch (error) {
        logError('loadOpportunities', error);
    }
}

// Login Administrativo
async function handleAdminLogin(e) {
    e.preventDefault();
    
    // Always allow login without actual authentication
    window.location.href = 'admin-dashboard.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
});

// Enhanced Mobile Menu Toggle
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when a nav link is clicked
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    } else {
        console.warn('Mobile menu elements not found');
    }
}

// Function to add WhatsApp floating button
function addWhatsAppButton() {
    const whatsappButton = document.createElement('a');
    whatsappButton.href = 'https://wa.me/+351926479393';
    whatsappButton.target = '_blank';
    whatsappButton.classList.add('whatsapp-float');
    whatsappButton.setAttribute('aria-label', 'WhatsApp Contact');
    
    whatsappButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.867-2.03-.967-.272-.1-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.131-.606.134-.133.297-.347.446-.521.149-.173.198-.297.297-.495.099-.198.05-.372-.025-.521-.074-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.047 1.02-1.047 2.479 1.07 2.889 1.219 3.087c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
    `;

    document.body.appendChild(whatsappButton);
}

// Improved event listeners and error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        loadEvents().catch(error => logError('loadEvents', error));
        loadOpportunities().catch(error => logError('loadOpportunities', error));
        
        setupLogoutButton();
        setupMobileMenu();
        addWhatsAppButton();
    } catch (error) {
        logError('Page Initialization', error);
    }
});

// Newsletter Subscription
async function handleNewsletterSubscription(e) {
    e.preventDefault();
    const emailInput = document.getElementById('newsletterEmail');
    const email = emailInput.value;

    try {
        await addDoc(collection(db, 'newsletter-subscribers'), {
            email,
            subscribedAt: new Date().toISOString()
        });
        alert('Obrigado por se inscrever na nossa newsletter!');
        emailInput.value = '';
    } catch (error) {
        console.error('Erro na subscrição:', error);
        alert('Erro ao subscrever. Por favor, tente novamente.');
    }
}

// SEO and Accessibility Improvements
function improveAccessibility() {
    // Add ARIA labels and roles
    document.querySelectorAll('a').forEach(link => {
        if (!link.getAttribute('aria-label')) {
            link.setAttribute('aria-label', link.textContent);
        }
    });

    // Add skip to main content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Pular para o conteúdo principal';
    skipLink.classList.add('skip-link');
    document.body.insertBefore(skipLink, document.body.firstChild);
}

document.addEventListener('DOMContentLoaded', () => {
    // Existing initialization code...
    improveAccessibility();

    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubscription);
    }
});

// News Management Functions
async function initNewsManagement() {
    const newsModal = document.getElementById('newsModal');
    const openNewsModalBtn = document.getElementById('openNewsModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const newsForm = document.getElementById('newsForm');
    const newsList = document.getElementById('newsList');

    if (!newsModal || !openNewsModalBtn || !closeModalBtn || !newsForm || !newsList) return;

    // Open Modal
    openNewsModalBtn.addEventListener('click', () => {
        newsModal.style.display = 'block';
        newsForm.reset();
        document.getElementById('newsModalTitle').textContent = 'Adicionar Nova Notícia';
    });

    // Close Modal
    closeModalBtn.addEventListener('click', () => {
        newsModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === newsModal) {
            newsModal.style.display = 'none';
        }
    });

    // Form Submission
    newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newsData = Object.fromEntries(formData);
        
        try {
            // Simplified news storage (could use localStorage or Firestore)
            const news = {
                id: Date.now().toString(),
                title: newsData.newsTitle,
                summary: newsData.newsSummary,
                content: newsData.newsContent,
                createdAt: new Date().toISOString()
            };

            // Add to list
            const newsItem = document.createElement('div');
            newsItem.classList.add('news-item');
            newsItem.innerHTML = `
                <span>${news.title}</span>
                <div class="news-item-actions">
                    <button class="btn btn-secondary edit-news" data-id="${news.id}">Editar</button>
                    <button class="btn btn-tertiary delete-news" data-id="${news.id}">Eliminar</button>
                </div>
            `;
            newsList.appendChild(newsItem);

            // Close modal
            newsModal.style.display = 'none';
            newsForm.reset();
            alert('Notícia salva com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar notícia:', error);
            alert('Erro ao salvar notícia. Por favor, tente novamente.');
        }
    });
}

// Initialize news management on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('newsModal')) {
        initNewsManagement();
    }
});

// Associate Management and Export Functions
async function loadAssociates(searchTerm = '', country = '', status = '') {
    const associatesList = document.getElementById('associatesList');
    const totalAssociatesSpan = document.getElementById('totalAssociates');
    const newAssociatesSpan = document.getElementById('newAssociatesThisMonth');

    if (!associatesList) return;

    try {
        let associatesQuery = query(
            collection(db, 'associados'), 
            orderBy('dataCadastro', 'desc')
        );

        const associatesSnapshot = await getDocs(associatesQuery);
        const associatesData = [];

        associatesList.innerHTML = `
            <div class="associate-row associate-header">
                <span>Número</span>
                <span>Nome</span>
                <span>Email</span>
                <span>Nacionalidade</span>
                <span>Data de Cadastro</span>
                <span>Status</span>
                <span>Ações</span>
            </div>
        `;

        associatesSnapshot.forEach((doc) => {
            const associate = { id: doc.id, ...doc.data() };
            
            // Apply filters
            if (searchTerm && 
                !associate.nome.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !associate.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !associate.associateNumber.toLowerCase().includes(searchTerm.toLowerCase())
            ) return;
            
            if (country && associate.nacionalidade !== country) return;
            if (status && associate.status !== status) return;

            const associateRow = document.createElement('div');
            associateRow.classList.add('associate-row');
            associateRow.innerHTML = `
                <span>${associate.associateNumber}</span>
                <span>${associate.nome}</span>
                <span>${associate.email}</span>
                <span>${associate.nacionalidade}</span>
                <span>${new Date(associate.dataCadastro).toLocaleDateString()}</span>
                <span>${associate.status}</span>
                <span>
                    <button class="btn btn-secondary edit-associate" data-id="${associate.id}">Editar</button>
                    <button class="btn btn-tertiary delete-associate" data-id="${associate.id}">Eliminar</button>
                </span>
            `;

            // Add event listeners for edit and delete
            const editBtn = associateRow.querySelector('.edit-associate');
            const deleteBtn = associateRow.querySelector('.delete-associate');

            editBtn.addEventListener('click', () => openEditAssociateModal(associate));
            deleteBtn.addEventListener('click', () => deleteAssociate(associate.id));

            associatesList.appendChild(associateRow);
            associatesData.push(associate);
        });

        // Update metrics
        if (totalAssociatesSpan) totalAssociatesSpan.textContent = associatesData.length;
        
        // Calculate new associates this month
        const thisMonth = new Date().getMonth();
        const newAssociates = associatesData.filter(a => 
            new Date(a.dataCadastro).getMonth() === thisMonth
        ).length;
        if (newAssociatesSpan) newAssociatesSpan.textContent = newAssociates;

        return associatesData;
    } catch (error) {
        logError('loadAssociates', error);
    }
}

function exportToCSV(data) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Associados");
    XLSX.writeFile(workbook, "associados_adep.csv");
}

function exportToPDF(data) {
    const doc = new jspdf.jsPDF();
    doc.text("Lista de Associados - ADEP", 10, 10);
    
    const headers = ["Nome", "Email", "Nacionalidade", "Data de Cadastro"];
    const tableData = data.map(a => [
        a.nome, 
        a.email, 
        a.nacionalidade, 
        new Date(a.dataCadastro).toLocaleDateString()
    ]);

    doc.autoTable({
        head: [headers],
        body: tableData,
        startY: 20
    });

    doc.save("associados_adep.pdf");
}

// Event Listeners for New Features
document.addEventListener('DOMContentLoaded', () => {
    // News Page Listeners
    const newsSearchInput = document.getElementById('newsSearch');
    const newsCategorySelect = document.getElementById('newsCategory');
    
    if (newsSearchInput && newsCategorySelect) {
        newsSearchInput.addEventListener('input', () => 
            loadNews(newsSearchInput.value, newsCategorySelect.value)
        );
        newsCategorySelect.addEventListener('change', () => 
            loadNews(newsSearchInput.value, newsCategorySelect.value)
        );
    }

    const addNewsForm = document.getElementById('addNewsForm');
    if (addNewsForm) {
        addNewsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newsData = Object.fromEntries(formData);
            await addNews(newsData);
        });
    }

    // Associates Dashboard Listeners
    const associateSearchInput = document.getElementById('associateSearch');
    const countryFilter = document.getElementById('countryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (associateSearchInput && countryFilter && statusFilter) {
        const updateAssociatesList = () => {
            loadAssociates(
                associateSearchInput.value, 
                countryFilter.value, 
                statusFilter.value
            );
        };

        associateSearchInput.addEventListener('input', updateAssociatesList);
        countryFilter.addEventListener('change', updateAssociatesList);
        statusFilter.addEventListener('change', updateAssociatesList);
    }

    // Export Buttons
    const exportCSVButton = document.getElementById('exportCSV');
    const exportPDFButton = document.getElementById('exportPDF');

    if (exportCSVButton && exportPDFButton) {
        exportCSVButton.addEventListener('click', async () => {
            const associatesData = await loadAssociates();
            exportToCSV(associatesData);
        });

        exportPDFButton.addEventListener('click', async () => {
            const associatesData = await loadAssociates();
            exportToPDF(associatesData);
        });
    }
});

async function addNews(newsData) {
    try {
        // Upload image if provided
        if (newsData.newsImage) {
            const storageRef = ref(storage, `news_images/${Date.now()}_${newsData.newsImage.name}`);
            const snapshot = await uploadBytes(storageRef, newsData.newsImage);
            newsData.imageUrl = await getDownloadURL(snapshot.ref);
        }

        // Remove the File object before saving to Firestore
        delete newsData.newsImage;

        // Add timestamp
        newsData.createdAt = new Date().toISOString();

        await addDoc(collection(db, 'news'), newsData);
        alert('Notícia publicada com sucesso!');
        loadNews();
    } catch (error) {
        logError('addNews', error);
        alert('Erro ao publicar notícia');
    }
}

async function loadNews(searchTerm = '', category = '') {
    const newsList = document.getElementById('newsList');
    if (!newsList) return;

    try {
        let newsQuery = query(
            collection(db, 'news'), 
            orderBy('createdAt', 'desc')
        );

        const newsSnapshot = await getDocs(newsQuery);
        newsList.innerHTML = '';

        newsSnapshot.forEach((doc) => {
            const news = doc.data();
            
            // Apply filters
            if (searchTerm && !news.title.toLowerCase().includes(searchTerm.toLowerCase())) return;
            if (category && news.category !== category) return;

            const newsCard = document.createElement('article');
            newsCard.classList.add('news-card');
            newsCard.innerHTML = `
                ${news.imageUrl ? `<img src="${news.imageUrl}" alt="${news.title}" class="news-image">` : ''}
                <h3>${news.title}</h3>
                <p class="news-category">${news.category}</p>
                <p class="news-date">${new Date(news.publicationDate).toLocaleDateString()}</p>
                <p>${news.content.substring(0, 150)}...</p>
                <a href="#" class="btn btn-secondary">Leia Mais</a>
            `;
            newsList.appendChild(newsCard);
        });
    } catch (error) {
        logError('loadNews', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupAssociateFormValidation();
});

// Event Management Functions
async function initEventManagement() {
    const eventModal = document.getElementById('eventModal');
    const openEventModalBtn = document.getElementById('openEventModal');
    const closeModalBtn = document.querySelector('#eventModal .close-modal');
    const eventForm = document.getElementById('eventForm');
    const eventManagementList = document.getElementById('eventManagementList');

    if (!eventModal || !openEventModalBtn || !closeModalBtn || !eventForm || !eventManagementList) return;

    // Load existing events
    await loadEventsForManagement();

    // Open Modal
    openEventModalBtn.addEventListener('click', () => {
        eventModal.style.display = 'block';
        eventForm.reset();
        document.getElementById('eventModalTitle').textContent = 'Adicionar Novo Evento';
    });

    // Close Modal
    closeModalBtn.addEventListener('click', () => {
        eventModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === eventModal) {
            eventModal.style.display = 'none';
        }
    });

    // Form Submission
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const eventData = {
                title: formData.get('eventTitle'),
                description: formData.get('eventDescription'),
                date: formData.get('eventDate'),
                location: formData.get('eventLocation'),
                createdAt: new Date().toISOString()
            };

            // Handle image upload
            const imageFile = formData.get('eventImage');
            if (imageFile && imageFile.size > 0) {
                const storageRef = ref(storage, `event_images/${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                eventData.imageUrl = await getDownloadURL(snapshot.ref);
            }

            // Save to Firestore
            const docRef = await addDoc(collection(db, 'events'), eventData);
            
            // Refresh events list
            await loadEventsForManagement();
            
            // Close modal
            eventModal.style.display = 'none';
            eventForm.reset();
            alert('Evento salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar evento:', error);
            alert('Erro ao salvar evento. Por favor, tente novamente.');
        }
    });
}

async function loadEventsForManagement() {
    const eventManagementList = document.getElementById('eventManagementList');
    if (!eventManagementList) return;

    try {
        const eventsQuery = query(
            collection(db, 'events'), 
            orderBy('date', 'asc')
        );

        const eventsSnapshot = await getDocs(eventsQuery);
        eventManagementList.innerHTML = '';

        eventsSnapshot.forEach((doc) => {
            const event = { id: doc.id, ...doc.data() };
            
            const eventItem = document.createElement('div');
            eventItem.classList.add('event-management-item');
            eventItem.innerHTML = `
                <span>${event.title}</span>
                <span>${new Date(event.date).toLocaleDateString()}</span>
                <div class="event-item-actions">
                    <button class="btn btn-secondary edit-event" data-id="${event.id}">Editar</button>
                    <button class="btn btn-tertiary delete-event" data-id="${event.id}">Eliminar</button>
                </div>
            `;

            // Edit Event
            eventItem.querySelector('.edit-event').addEventListener('click', async () => {
                // Populate modal with event data for editing
                document.getElementById('eventId').value = event.id;
                document.getElementById('eventTitle').value = event.title;
                document.getElementById('eventDescription').value = event.description;
                document.getElementById('eventDate').value = event.date;
                document.getElementById('eventLocation').value = event.location;
                
                document.getElementById('eventModalTitle').textContent = 'Editar Evento';
                eventModal.style.display = 'block';
            });

            // Delete Event
            eventItem.querySelector('.delete-event').addEventListener('click', async () => {
                if (confirm('Tem certeza que deseja eliminar este evento?')) {
                    try {
                        await deleteDoc(doc(db, 'events', event.id));
                        await loadEventsForManagement();
                        alert('Evento eliminado com sucesso!');
                    } catch (error) {
                        console.error('Erro ao eliminar evento:', error);
                        alert('Erro ao eliminar evento. Por favor, tente novamente.');
                    }
                }
            });

            eventManagementList.appendChild(eventItem);
        });
    } catch (error) {
        logError('loadEventsForManagement', error);
    }
}

// Add initialization for event management
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('eventModal')) {
        initEventManagement();
    }
});

// Opportunities Management Functions
async function initOpportunityManagement() {
    const opportunityModal = document.getElementById('opportunityModal');
    const openOpportunityModalBtn = document.getElementById('openOpportunityModal');
    const closeModalBtn = document.querySelector('#opportunityModal .close-modal');
    const opportunityForm = document.getElementById('opportunityForm');
    const opportunitiesManagementList = document.getElementById('opportunitiesManagementList');

    if (!opportunityModal || !openOpportunityModalBtn || !closeModalBtn || !opportunityForm || !opportunitiesManagementList) return;

    // Load existing opportunities
    await loadOpportunitiesForManagement();

    // Open Modal
    openOpportunityModalBtn.addEventListener('click', () => {
        opportunityModal.style.display = 'block';
        opportunityForm.reset();
        document.getElementById('opportunityModalTitle').textContent = 'Adicionar Nova Oportunidade';
    });

    // Close Modal
    closeModalBtn.addEventListener('click', () => {
        opportunityModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === opportunityModal) {
            opportunityModal.style.display = 'none';
        }
    });

    // Form Submission
    opportunityForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const opportunityData = {
                title: formData.get('opportunityTitle'),
                description: formData.get('opportunityDescription'),
                type: formData.get('opportunityType'),
                contact: formData.get('opportunityContact'),
                validUntil: formData.get('validUntil') || null,
                createdAt: new Date().toISOString()
            };

            // Handle image upload
            const imageFile = formData.get('opportunityImage');
            if (imageFile && imageFile.size > 0) {
                const storageRef = ref(storage, `opportunity_images/${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                opportunityData.imageUrl = await getDownloadURL(snapshot.ref);
            }

            // Save to Firestore
            const docRef = await addDoc(collection(db, 'opportunities'), opportunityData);
            
            // Refresh opportunities list
            await loadOpportunitiesForManagement();
            await loadOpportunities(); // Refresh frontend list
            
            // Close modal
            opportunityModal.style.display = 'none';
            opportunityForm.reset();
            alert('Oportunidade salva com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar oportunidade:', error);
            alert('Erro ao salvar oportunidade. Por favor, tente novamente.');
        }
    });
}

async function loadOpportunitiesForManagement() {
    const opportunitiesManagementList = document.getElementById('opportunitiesManagementList');
    if (!opportunitiesManagementList) return;

    try {
        const opportunitiesQuery = query(
            collection(db, 'opportunities'), 
            orderBy('createdAt', 'desc')
        );

        const opportunitiesSnapshot = await getDocs(opportunitiesQuery);
        opportunitiesManagementList.innerHTML = '';

        opportunitiesSnapshot.forEach((doc) => {
            const opportunity = { id: doc.id, ...doc.data() };
            
            const opportunityItem = document.createElement('div');
            opportunityItem.classList.add('opportunity-management-item');
            opportunityItem.innerHTML = `
                <span>${opportunity.title}</span>
                <span>${opportunity.type}</span>
                <div class="opportunity-item-actions">
                    <button class="btn btn-secondary edit-opportunity" data-id="${opportunity.id}">Editar</button>
                    <button class="btn btn-tertiary delete-opportunity" data-id="${opportunity.id}">Eliminar</button>
                </div>
            `;

            // Edit Opportunity
            opportunityItem.querySelector('.edit-opportunity').addEventListener('click', async () => {
                // Populate modal with opportunity data for editing
                document.getElementById('opportunityId').value = opportunity.id;
                document.getElementById('opportunityTitle').value = opportunity.title;
                document.getElementById('opportunityDescription').value = opportunity.description;
                document.getElementById('opportunityType').value = opportunity.type;
                document.getElementById('opportunityContact').value = opportunity.contact;
                document.getElementById('validUntil').value = opportunity.validUntil || '';
                
                document.getElementById('opportunityModalTitle').textContent = 'Editar Oportunidade';
                opportunityModal.style.display = 'block';
            });

            // Delete Opportunity
            opportunityItem.querySelector('.delete-opportunity').addEventListener('click', async () => {
                if (confirm('Tem certeza que deseja eliminar esta oportunidade?')) {
                    try {
                        await deleteDoc(doc(db, 'opportunities', opportunity.id));
                        await loadOpportunitiesForManagement();
                        await loadOpportunities(); // Refresh frontend list
                        alert('Oportunidade eliminada com sucesso!');
                    } catch (error) {
                        console.error('Erro ao eliminar oportunidade:', error);
                        alert('Erro ao eliminar oportunidade. Por favor, tente novamente.');
                    }
                }
            });

            opportunitiesManagementList.appendChild(opportunityItem);
        });
    } catch (error) {
        logError('loadOpportunitiesForManagement', error);
    }
}

// Add event listeners for filtering
document.addEventListener('DOMContentLoaded', () => {
    const opportunityCategoryFilter = document.getElementById('opportunityCategoryFilter');
    
    if (opportunityCategoryFilter) {
        opportunityCategoryFilter.addEventListener('change', () => {
            loadOpportunities(opportunityCategoryFilter.value);
        });
    }
});

// Initialization for opportunities management
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('opportunityModal')) {
        initOpportunityManagement();
    }
});

// Function to open edit associate modal
function openEditAssociateModal(associate) {
    const editModal = document.getElementById('editAssociateModal');
    if (!editModal) {
        console.error('Edit modal not found');
        return;
    }

    // Populate modal fields
    document.getElementById('editAssociateId').value = associate.id;
    document.getElementById('editNome').value = associate.nome;
    document.getElementById('editEmail').value = associate.email;
    document.getElementById('editTelefone').value = associate.telefone;
    document.getElementById('editIdentificacao').value = associate.identificacao;
    document.getElementById('editDataNascimento').value = associate.dataNascimento;
    document.getElementById('editEndereco').value = associate.endereco;
    document.getElementById('editNacionalidade').value = associate.nacionalidade;
    document.getElementById('editStatus').value = associate.status;

    // Show modal
    editModal.style.display = 'block';
}

// Function to update associate
async function updateAssociate(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const associateData = Object.fromEntries(formData);

    try {
        const associateRef = doc(db, 'associados', associateData.editAssociateId);
        await updateDoc(associateRef, {
            nome: associateData.editNome,
            email: associateData.editEmail,
            telefone: associateData.editTelefone,
            identificacao: associateData.editIdentificacao,
            dataNascimento: associateData.editDataNascimento,
            endereco: associateData.editEndereco,
            nacionalidade: associateData.editNacionalidade,
            status: associateData.editStatus
        });

        alert('Associado atualizado com sucesso!');
        document.getElementById('editAssociateModal').style.display = 'none';
        loadAssociates(); // Refresh the list
    } catch (error) {
        console.error('Erro ao atualizar associado:', error);
        alert('Erro ao atualizar associado. Por favor, tente novamente.');
    }
}

// Function to delete associate
async function deleteAssociate(associateId) {
    if (!confirm('Tem certeza que deseja eliminar este associado?')) return;

    try {
        await deleteDoc(doc(db, 'associados', associateId));
        alert('Associado eliminado com sucesso!');
        loadAssociates(); // Refresh the list
    } catch (error) {
        console.error('Erro ao eliminar associado:', error);
        alert('Erro ao eliminar associado. Por favor, tente novamente.');
    }
}

// Event Listeners for Associate Management
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('associatesList')) {
        loadAssociates();

        // Search and filter functionality
        const associateSearchInput = document.getElementById('associateSearch');
        const nationalityFilter = document.getElementById('nationalityFilter');
        const statusFilter = document.getElementById('statusFilter');

        const updateAssociatesList = () => {
            loadAssociates(
                associateSearchInput.value, 
                nationalityFilter.value, 
                statusFilter.value
            );
        };

        associateSearchInput?.addEventListener('input', updateAssociatesList);
        nationalityFilter?.addEventListener('change', updateAssociatesList);
        statusFilter?.addEventListener('change', updateAssociatesList);

        // Edit Associate Modal Submit
        const editAssociateForm = document.getElementById('editAssociateForm');
        editAssociateForm?.addEventListener('submit', updateAssociate);

        // Close Edit Modal
        const closeEditModalBtn = document.querySelector('#editAssociateModal .close-modal');
        closeEditModalBtn?.addEventListener('click', () => {
            document.getElementById('editAssociateModal').style.display = 'none';
        });
    }
});

// Function to handle associate login
async function handleAssociateLogin(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        // Validate inputs
        if (!email || !password) {
            alert('Por favor, preencha todos os campos');
            return;
        }

        // Attempt login via Firebase or your backend API
        const response = await fetch('/api/associates/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store login information
            localStorage.setItem('associateToken', data.token);
            localStorage.setItem('associateData', JSON.stringify(data.associate));

            // Redirect to dashboard or home page
            window.location.href = 'associate-dashboard.html';
        } else {
            // Handle login errors
            alert(data.message || 'Erro no login');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Erro ao fazer login. Por favor, tente novamente.');
    }
}

// Add event listener for login form
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('associateLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAssociateLogin);
    }

    // Add forgot password functionality
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = prompt('Por favor, insira seu email:');
            
            if (!email) return;

            try {
                const response = await fetch('/api/associates/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Email de redefinição de senha enviado');
                } else {
                    alert(data.message || 'Erro ao enviar email de redefinição');
                }
            } catch (error) {
                console.error('Password reset error:', error);
                alert('Erro ao redefinir senha');
            }
        });
    }
});