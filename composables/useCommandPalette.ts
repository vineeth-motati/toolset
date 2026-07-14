// Shared open-state for the ⌘K palette (NavBar hint + global shortcut).
export function useCommandPalette() {
    const isOpen = useState('command-palette-open', () => false);
    const open = () => (isOpen.value = true);
    const close = () => (isOpen.value = false);
    return { isOpen, open, close };
}
