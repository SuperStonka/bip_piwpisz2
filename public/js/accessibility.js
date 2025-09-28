// Accessibility JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Font size controls
    const fontIncrease = document.getElementById('font-increase');
    const fontDecrease = document.getElementById('font-decrease');
    const fontReset = document.getElementById('font-reset');
    
    // Contrast toggle
    const contrastToggle = document.getElementById('contrast-toggle');
    
    // Font size levels
    const fontSizes = ['font-small', 'font-large', 'font-xlarge', 'font-xxlarge'];
    let currentFontSize = 0; // 0 = default
    
    // Load saved preferences
    loadAccessibilityPreferences();
    
    // Font size controls
    if (fontIncrease) {
        fontIncrease.addEventListener('click', function() {
            if (currentFontSize < fontSizes.length - 1) {
                currentFontSize++;
                applyFontSize();
                saveAccessibilityPreferences();
            }
        });
    }
    
    if (fontDecrease) {
        fontDecrease.addEventListener('click', function() {
            if (currentFontSize > 0) {
                currentFontSize--;
                applyFontSize();
                saveAccessibilityPreferences();
            }
        });
    }
    
    if (fontReset) {
        fontReset.addEventListener('click', function() {
            currentFontSize = 0;
            applyFontSize();
            saveAccessibilityPreferences();
        });
    }
    
    // Contrast toggle
    if (contrastToggle) {
        contrastToggle.addEventListener('click', function() {
            document.body.classList.toggle('high-contrast');
            const isHighContrast = document.body.classList.contains('high-contrast');
            this.setAttribute('aria-pressed', isHighContrast);
            saveAccessibilityPreferences();
            
            // Announce change to screen readers
            const message = isHighContrast ? 'Włączono tryb wysokiego kontrastu' : 'Wyłączono tryb wysokiego kontrastu';
            announceToScreenReader(message);
        });
    }
    
    // Apply font size
    function applyFontSize() {
        // Remove all font size classes
        fontSizes.forEach(function(size) {
            document.body.classList.remove(size);
        });
        
        // Add current font size class
        if (currentFontSize > 0) {
            document.body.classList.add(fontSizes[currentFontSize - 1]);
        }
        
        // Update button states
        updateFontButtonStates();
        
        // Announce change to screen readers
        const sizeNames = ['domyślny', 'duży', 'bardzo duży', 'ekstra duży'];
        const message = `Rozmiar czcionki ustawiony na ${sizeNames[currentFontSize]}`;
        announceToScreenReader(message);
    }
    
    // Update font button states
    function updateFontButtonStates() {
        if (fontIncrease) {
            fontIncrease.disabled = currentFontSize >= fontSizes.length - 1;
            fontIncrease.setAttribute('aria-pressed', currentFontSize >= fontSizes.length - 1);
        }
        
        if (fontDecrease) {
            fontDecrease.disabled = currentFontSize <= 0;
            fontDecrease.setAttribute('aria-pressed', currentFontSize <= 0);
        }
        
        if (fontReset) {
            fontReset.setAttribute('aria-pressed', currentFontSize === 0);
        }
    }
    
    // Save accessibility preferences to localStorage
    function saveAccessibilityPreferences() {
        const preferences = {
            fontSize: currentFontSize,
            highContrast: document.body.classList.contains('high-contrast')
        };
        
        try {
            localStorage.setItem('accessibilityPreferences', JSON.stringify(preferences));
        } catch (e) {
            console.warn('Could not save accessibility preferences:', e);
        }
    }
    
    // Load accessibility preferences from localStorage
    function loadAccessibilityPreferences() {
        try {
            const saved = localStorage.getItem('accessibilityPreferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                
                // Apply font size
                if (preferences.fontSize !== undefined) {
                    currentFontSize = preferences.fontSize;
                    applyFontSize();
                }
                
                // Apply high contrast
                if (preferences.highContrast) {
                    document.body.classList.add('high-contrast');
                    if (contrastToggle) {
                        contrastToggle.setAttribute('aria-pressed', 'true');
                    }
                }
            }
        } catch (e) {
            console.warn('Could not load accessibility preferences:', e);
        }
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Alt + 1: Skip to main content
        if (e.altKey && e.key === '1') {
            e.preventDefault();
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.focus();
                mainContent.scrollIntoView();
            }
        }
        
        // Alt + 2: Skip to navigation
        if (e.altKey && e.key === '2') {
            e.preventDefault();
            const navigation = document.getElementById('main-navigation');
            if (navigation) {
                const firstLink = navigation.querySelector('a');
                if (firstLink) {
                    firstLink.focus();
                    firstLink.scrollIntoView();
                }
            }
        }
        
        // Alt + 3: Skip to contact info
        if (e.altKey && e.key === '3') {
            e.preventDefault();
            const contactInfo = document.getElementById('contact-info');
            if (contactInfo) {
                contactInfo.focus();
                contactInfo.scrollIntoView();
            }
        }
        
        // Alt + C: Toggle contrast
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            if (contrastToggle) {
                contrastToggle.click();
            }
        }
        
        // Alt + Plus: Increase font size
        if (e.altKey && (e.key === '+' || e.key === '=')) {
            e.preventDefault();
            if (fontIncrease && !fontIncrease.disabled) {
                fontIncrease.click();
            }
        }
        
        // Alt + Minus: Decrease font size
        if (e.altKey && e.key === '-') {
            e.preventDefault();
            if (fontDecrease && !fontDecrease.disabled) {
                fontDecrease.click();
            }
        }
        
        // Alt + 0: Reset font size
        if (e.altKey && e.key === '0') {
            e.preventDefault();
            if (fontReset) {
                fontReset.click();
            }
        }
    });
    
    // Focus management for modals and dropdowns
    function trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        );
        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements[focusableElements.length - 1];
        
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }
    
    // Apply focus trapping to submenus
    const submenus = document.querySelectorAll('.submenu');
    submenus.forEach(function(submenu) {
        trapFocus(submenu);
    });
    
    // Announce page changes
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if it's a significant content change
                    const addedNodes = Array.from(mutation.addedNodes);
                    const hasSignificantContent = addedNodes.some(function(node) {
                        return node.nodeType === Node.ELEMENT_NODE && 
                               (node.tagName === 'H1' || node.tagName === 'H2' || 
                                node.querySelector('h1, h2'));
                    });
                    
                    if (hasSignificantContent) {
                        announceToScreenReader('Treść strony została zaktualizowana');
                    }
                }
            });
        });
        
        observer.observe(mainContent, {
            childList: true,
            subtree: true
        });
    }
    
    // Ensure all images have alt text
    const images = document.querySelectorAll('img');
    images.forEach(function(img) {
        if (!img.alt && !img.getAttribute('aria-label')) {
            img.alt = 'Obraz';
            console.warn('Image missing alt text:', img.src);
        }
    });
    
    // Ensure all links have descriptive text
    const links = document.querySelectorAll('a');
    links.forEach(function(link) {
        const text = link.textContent.trim();
        const href = link.getAttribute('href');
        
        if (text === '' || text === '#' || text === href) {
            console.warn('Link missing descriptive text:', href);
        }
    });
    
    // Add loading states for better UX
    const forms = document.querySelectorAll('form');
    forms.forEach(function(form) {
        form.addEventListener('submit', function() {
            const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Wysyłanie...';
                
                // Re-enable after 5 seconds as fallback
                setTimeout(function() {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Wyślij';
                }, 5000);
            }
        });
    });
    
    // Initialize button states
    updateFontButtonStates();
    
    // Announce keyboard shortcuts on page load
    setTimeout(function() {
        announceToScreenReader('Dostępne skróty klawiszowe: Alt+1 - treść główna, Alt+2 - menu, Alt+3 - kontakt, Alt+C - kontrast, Alt+Plus - powiększ, Alt+Minus - pomniejsz, Alt+0 - reset');
    }, 2000);
});

// Utility function for screen reader announcements
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'visually-hidden';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(function() {
        if (document.body.contains(announcement)) {
            document.body.removeChild(announcement);
        }
    }, 1000);
}
