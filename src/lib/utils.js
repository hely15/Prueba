export const generateId = () => {
    // Try to use crypto.randomUUID if available (secure context)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for non-secure contexts (http IP address)
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};
