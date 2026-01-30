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

    const isError = type === 'error';
    const finalDuration = isError ? 20000 : duration;

    const toast = document.createElement('div');
    toast.className = `notification ${type}`;
    
    let content = `
        <h4>${title}</h4>
        <pre>${message}</pre>
    `;

    if (isError) {
        content += `<p class="close-hint">Kattints a bezáráshoz</p>`;
    }
    
    toast.innerHTML = content;
    toast.style.animationDelay = `0s, ${(finalDuration - 500) / 1000}s`;

    toast.addEventListener('click', () => {
        toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
        if (toast) {
            toast.remove();
        }
    }, finalDuration);
}