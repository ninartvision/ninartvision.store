// Payment Modal Functionality
(function() {
  'use strict';

  // DOM Elements
  const modal = document.getElementById('paymentModal');
  const openBtnHero = document.getElementById('openPaymentModal');
  const openBtnCard = document.getElementById('openPaymentModalCard');
  const closeBtn = document.getElementById('closePaymentModal');
  const copyButtons = document.querySelectorAll('.copy-btn');

  // Open modal function
  function openModal(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
  }

  // Close modal function
  function closeModal(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = ''; // Restore scrolling
    }
  }

  // Copy to clipboard function
  async function copyToClipboard(button) {
    // Find the input field in the same payment-field container
    const inputGroup = button.closest('.payment-input-group');
    const input = inputGroup.querySelector('.payment-input');
    
    if (!input) return;

    try {
      // Modern Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(input.value);
        showCopiedFeedback(button);
      } else {
        // Fallback for older browsers
        input.select();
        input.setSelectionRange(0, 99999); // For mobile devices
        document.execCommand('copy');
        showCopiedFeedback(button);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      // Visual feedback even on error
      showCopiedFeedback(button, true);
    }
  }

  // Show copied feedback
  function showCopiedFeedback(button, isError = false) {
    const originalHTML = button.innerHTML;
    
    // Add 'copied' class for styling
    button.classList.add('copied');
    
    // Change button text/icon
    if (isError) {
      button.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span class="copy-text">Error</span>
      `;
    } else {
      button.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span class="copy-text">Copied ✓</span>
      `;
    }
    
    // Reset after 2 seconds
    setTimeout(() => {
      button.classList.remove('copied');
      button.innerHTML = originalHTML;
    }, 2000);
  }

  // Event Listeners
  if (openBtnHero) {
    openBtnHero.addEventListener('click', openModal);
  }

  if (openBtnCard) {
    openBtnCard.addEventListener('click', openModal);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Close on backdrop click
  if (modal) {
    modal.addEventListener('click', function(event) {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  });

  // Attach copy functionality to all copy buttons
  copyButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      copyToClipboard(this);
    });
  });

  // Update modal text when language changes
  window.addEventListener('languageChanged', function() {
    // Modal will automatically update via data-en/data-ka attributes
    // managed by the existing setLang() function in lang.js or support.js
  });

})();
