// modules/notifier.js

/**
 * Displays a toast-style notification on the screen.
 * @param {string} title - The title of the notification.
 * @param {string} message - The main content of the notification.
 * @param {string} type - The type of notification ('info', 'success', 'error').
 * @param {number} duration - How long the notification should stay on screen in milliseconds.
 */
export function showNotification(title, message = '', type = 'info', duration = 10000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `notification ${type}`;
    
    // Using <pre> for the message to preserve formatting, especially for API error details
    toast.innerHTML = `
        <h4>${title}</h4>
        <pre>${message}</pre>
    `;

    toast.style.animationDelay = `0s, ${(duration - 500) / 1000}s`;

    toast.addEventListener('click', () => {
        toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);
}