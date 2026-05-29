import { useEffect, useState } from 'react';

const KEY = 'll-theme';

/** Read the current theme from the <html> attribute set by the flash-prevention
 *  script, so the initial React state always matches what's already on screen. */
function getInitial(): boolean {
    if (typeof document === 'undefined') return false;
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

export function useDarkMode(): [boolean, () => void] {
    const [dark, setDark] = useState(getInitial);

    useEffect(() => {
        if (dark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem(KEY, 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem(KEY, 'light');
        }
    }, [dark]);

    return [dark, () => setDark(d => !d)];
}
