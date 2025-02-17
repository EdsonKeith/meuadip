import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  where,
  doc,
  updateDoc,
  deleteDoc,
  limit,
  startAfter
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

class AssociateDashboard {
  constructor() {
    this.associateData = JSON.parse(localStorage.getItem('associateData') || '{}');
    this.initEventListeners();
    this.setupChatSystem();
    this.loadProfileData();
    this.initMobileOptimizations();
  }

  initEventListeners() {
    // Profile Edit Modal
    document.getElementById('editProfileBtn')?.addEventListener('click', this.openProfileEditModal.bind(this));
    document.querySelector('#profileEditModal .close-modal')?.addEventListener('click', this.closeProfileEditModal.bind(this));
    
    // Profile Picture Preview
    document.getElementById('profilePicture')?.addEventListener('change', this.previewProfilePicture.bind(this));
    
    // Profile Edit Form Submission
    document.getElementById('profileEditForm')?.addEventListener('submit', this.saveProfileChanges.bind(this));
    
    // Chat System
    document.getElementById('openChatBtn')?.addEventListener('click', this.openChatModal.bind(this));
    document.querySelector('.close-chat')?.addEventListener('click', this.closeChatModal.bind(this));
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', this.handleLogout.bind(this));
  }

  openProfileEditModal() {
    const modal = document.getElementById('profileEditModal');
    const form = document.getElementById('profileEditForm');
    
    // Populate existing data
    form.querySelector('#editName').value = this.associateData.nome || '';
    form.querySelector('#editBio').value = this.associateData.bio || '';
    form.querySelector('#editContact').value = this.associateData.contact || '';

    // Set profile picture
    const profilePicturePreview = document.getElementById('profilePicturePreview');
    profilePicturePreview.src = this.associateData.profilePicture || 'default-profile.png';

    modal.style.display = 'block';
  }

  closeProfileEditModal() {
    document.getElementById('profileEditModal').style.display = 'none';
  }

  previewProfilePicture(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('profilePicturePreview');
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async saveProfileChanges(e) {
    e.preventDefault();
    const form = document.getElementById('profileEditForm');
    const profilePicture = form.querySelector('#profilePicture').files[0];
    
    try {
      let profilePictureUrl = this.associateData.profilePicture;
      
      // Upload profile picture if selected
      if (profilePicture) {
        const storageRef = ref(storage, `profile_pictures/${this.associateData.id}`);
        const snapshot = await uploadBytes(storageRef, profilePicture);
        profilePictureUrl = await getDownloadURL(snapshot.ref);
      }

      // Update profile data
      const updatedData = {
        nome: form.querySelector('#editName').value,
        bio: form.querySelector('#editBio').value,
        contact: form.querySelector('#editContact').value,
        profilePicture: profilePictureUrl,
        privacySettings: {
          profileVisibility: form.querySelector('input[name="profileVisibility"]').checked,
          messagePermission: form.querySelector('input[name="messagePermission"]').checked,
          emailNotifications: form.querySelector('input[name="emailNotifications"]').checked,
          smsNotifications: form.querySelector('input[name="smsNotifications"]').checked
        }
      };

      // Save to local storage and update UI
      const newAssociateData = { ...this.associateData, ...updatedData };
      localStorage.setItem('associateData', JSON.stringify(newAssociateData));
      this.associateData = newAssociateData;
      
      this.loadProfileData();
      this.closeProfileEditModal();

      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil. Por favor, tente novamente.');
    }
  }

  loadProfileData() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const profileDetails = document.getElementById('profileDetails');
    const profilePicture = document.querySelector('.profile-picture img');

    if (welcomeMessage) welcomeMessage.textContent = `Bem-vindo, ${this.associateData.nome}`;
    
    if (profileDetails) {
      profileDetails.innerHTML = `
        <div>Nome: ${this.associateData.nome}</div>
        <div>Email: ${this.associateData.email}</div>
        <div>Número de Associado: ${this.associateData.associateNumber}</div>
      `;
    }

    if (profilePicture) {
      profilePicture.src = this.associateData.profilePicture || 'default-profile.png';
    }
  }

  setupChatSystem() {
    const chatContainer = document.getElementById('chatModal');
    const conversationsList = document.getElementById('conversationsList');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatMessageInput');
    const sendButton = document.getElementById('sendChatMessage');
    const fileInput = document.getElementById('chatFileInput');
    const searchInput = document.getElementById('chatSearchInput');

    let currentConversation = null;

    sendButton.addEventListener('click', () => this.sendMessage(chatInput, fileInput, currentConversation));
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage(chatInput, fileInput, currentConversation);
    });

    fileInput.addEventListener('change', (e) => this.handleFileUpload(e, chatInput, fileInput, currentConversation));
    searchInput.addEventListener('input', () => this.searchConversations(conversationsList, searchInput));

    this.loadConversations(conversationsList, chatMessages, currentConversation, chatInput, sendButton, fileInput);
    this.setupNotifications();
  }

  async loadConversations(conversationsList, chatMessages, currentConversation, chatInput, sendButton, fileInput) {
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', this.associateData.id),
      orderBy('lastMessageTimestamp', 'desc')
    );

    onSnapshot(conversationsQuery, (snapshot) => {
      conversationsList.innerHTML = '';
      snapshot.docs.forEach(docSnap => {
        const conversation = { id: docSnap.id, ...docSnap.data() };
        this.renderConversation(conversation, conversationsList, currentConversation, chatMessages, chatInput, sendButton, fileInput);
      });
    });
  }

  renderConversation(conversation, conversationsList, currentConversation, chatMessages, chatInput, sendButton, fileInput) {
    const otherParticipant = conversation.participants.find(p => p !== this.associateData.id);
    
    const conversationElement = document.createElement('div');
    conversationElement.classList.add('conversation-item');
    
    if (conversation.unreadCount > 0) {
      conversationElement.classList.add('unread');
    }

    conversationElement.innerHTML = `
      <img src="${conversation.participantProfilePic || 'default-profile.png'}" alt="Profile">
      <div class="conversation-details">
        <h4>${conversation.participantName}</h4>
        <p>${conversation.lastMessage || 'Sem mensagens'}</p>
        <span class="timestamp">${this.formatTimestamp(conversation.lastMessageTimestamp)}</span>
        ${conversation.unreadCount > 0 ? `<span class="unread-count">${conversation.unreadCount}</span>` : ''}
      </div>
    `;

    conversationElement.addEventListener('click', () => this.openConversation(conversation, conversationsList, chatMessages, chatInput, sendButton, fileInput, currentConversation));
    conversationsList.appendChild(conversationElement);
  }

  async openConversation(conversation, conversationsList, chatMessages, chatInput, sendButton, fileInput, currentConversation) {
    currentConversation = conversation;
    chatMessages.innerHTML = '';

    const messagesQuery = query(
      collection(db, `conversations/${conversation.id}/messages`),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    onSnapshot(messagesQuery, (snapshot) => {
      // Clear existing messages and render in chronological order
      chatMessages.innerHTML = '';
      snapshot.docs.reverse().forEach(docSnap => {
        const message = { id: docSnap.id, ...docSnap.data() };
        this.renderMessage(message, chatMessages);
      });

      // Mark conversation as read
      this.markConversationAsRead(conversation);
    });
  }

  renderMessage(message, chatMessages) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    messageElement.classList.add(
      message.senderId === this.associateData.id ? 'sent' : 'received'
    );

    // Handle different message types
    if (message.type === 'text') {
      messageElement.textContent = message.content;
    } else if (message.type === 'image') {
      const imageElement = document.createElement('img');
      imageElement.src = message.content;
      imageElement.classList.add('chat-image');
      messageElement.appendChild(imageElement);
    }

    // Add timestamp
    const timestampElement = document.createElement('small');
    timestampElement.textContent = this.formatTimestamp(message.timestamp);
    messageElement.appendChild(timestampElement);

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async sendMessage(chatInput, fileInput, currentConversation) {
    const content = chatInput.value.trim();
    if (!content && !fileInput.files.length) return;

    try {
      let messageData = {
        senderId: this.associateData.id,
        senderName: this.associateData.nome,
        content: content,
        timestamp: new Date().toISOString(),
        type: 'text'
      };

      // Handle file upload if present
      if (fileInput.files.length) {
        const file = fileInput.files[0];
        const storageRef = ref(storage, `chat_files/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        messageData = {
          ...messageData,
          content: downloadURL,
          type: file.type.startsWith('image/') ? 'image' : 'file'
        };
      }

      // Add message to conversation
      await addDoc(
        collection(db, `conversations/${currentConversation.id}/messages`), 
        messageData
      );

      // Update conversation metadata
      await updateDoc(doc(db, 'conversations', currentConversation.id), {
        lastMessage: messageData.content,
        lastMessageTimestamp: messageData.timestamp,
        unreadCount: 0  // Reset unread count for sender
      });

      chatInput.value = '';
      fileInput.value = '';
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem');
    }
  }

  async handleFileUpload(event, chatInput, fileInput, currentConversation) {
    const file = event.target.files[0];
    if (file) {
      // Optional: Add file size and type validation
      if (file.size > 5 * 1024 * 1024) {  // 5MB limit
        alert('Ficheiro muito grande. Limite de 5MB.');
        return;
      }

      // Trigger send message to handle file upload
      this.sendMessage(chatInput, fileInput, currentConversation);
    }
  }

  async markConversationAsRead(conversation) {
    await updateDoc(doc(db, 'conversations', conversation.id), {
      unreadCount: 0
    });
  }

  searchConversations(conversationsList, searchInput) {
    const searchTerm = searchInput.value.toLowerCase();
    const conversations = conversationsList.querySelectorAll('.conversation-item');

    conversations.forEach(conv => {
      const name = conv.querySelector('h4').textContent.toLowerCase();
      const lastMessage = conv.querySelector('p').textContent.toLowerCase();

      conv.style.display = 
        name.includes(searchTerm) || lastMessage.includes(searchTerm) 
          ? 'flex' 
          : 'none';
    });
  }

  setupNotifications() {
    // Real-time notification listener
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', this.associateData.id),
      where('read', '==', false),
      orderBy('timestamp', 'desc')
    );

    onSnapshot(notificationsQuery, (snapshot) => {
      const notificationCount = snapshot.size;
      this.updateNotificationBadge(notificationCount);
    });
  }

  updateNotificationBadge(count) {
    const badge = document.getElementById('chatNotificationBadge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'block' : 'none';
    }
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-PT', {
      hour: '2-digit', 
      minute: '2-digit', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  }

  async blockUser(userId) {
    await addDoc(collection(db, 'blocked_users'), {
      blockerId: this.associateData.id,
      blockedUserId: userId,
      timestamp: new Date().toISOString()
    });
  }

  async reportUser(userId, reason) {
    await addDoc(collection(db, 'user_reports'), {
      reporterId: this.associateData.id,
      reportedUserId: userId,
      reason: reason,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
  }

  openChatModal() {
    document.getElementById('chatModal').style.display = 'block';
  }

  closeChatModal() {
    document.getElementById('chatModal').style.display = 'none';
  }

  handleLogout() {
    localStorage.removeItem('associateData');
    window.location.href = 'index.html';
  }

  initMobileOptimizations() {
    this.optimizeInputs();
    this.handleOrientationChange();
    this.preventPinchZoom();
    this.lazyLoadContent();
  }

  optimizeInputs() {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        // Prevent automatic zoom on iOS
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          input.style.fontSize = '16px';
        }
      });
      input.addEventListener('blur', () => {
        input.style.fontSize = '';
      });
    });
  }

  handleOrientationChange() {
    window.addEventListener('orientationchange', () => {
      // Adjust layout dynamically
      this.adjustLayoutForOrientation();
    });
  }

  adjustLayoutForOrientation() {
    const dashboard = document.querySelector('.dashboard-grid');
    const screenWidth = window.innerWidth;
    
    if (screenWidth < 768) {
      dashboard.classList.add('mobile-layout');
    } else {
      dashboard.classList.remove('mobile-layout');
    }
  }

  preventPinchZoom() {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }

  lazyLoadContent() {
    const observerOptions = {
      rootMargin: '50px 0px',
      threshold: 0.01
    };

    const lazyLoadElements = document.querySelectorAll('.lazy-load');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const lazyElement = entry.target;
            
            if (lazyElement.dataset.src) {
              lazyElement.src = lazyElement.dataset.src;
            }
            
            lazyElement.classList.remove('lazy-load');
            observer.unobserve(lazyElement);
          }
        });
      }, observerOptions);

      lazyLoadElements.forEach(el => imageObserver.observe(el));
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Performance tracking
  const startTime = performance.now();
  
  new AssociateDashboard();

  const loadTime = performance.now() - startTime;
  console.log(`Dashboard loaded in ${loadTime.toFixed(2)}ms`);
});