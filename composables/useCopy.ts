// Clipboard write with a fallback for non-secure contexts / older browsers.
// Bare function (not a use* factory) so event handlers can call it directly
// via Nuxt auto-import without needing setup context.
// Named copyText to avoid clashing with vueuse's auto-imported useClipboard.
export async function copyText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand('copy');
        } catch {
            return false;
        } finally {
            textarea.remove();
        }
    }
}
