import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
type Theme = 'light' | 'dark'
const ThemeContext = createContext({ theme: 'light' as Theme, toggle: () => {} })
export function ThemeProvider({ children }: { children: ReactNode }) { const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('taskhub-theme') as Theme) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')); useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); localStorage.setItem('taskhub-theme', theme) }, [theme]); return <ThemeContext.Provider value={{ theme, toggle: () => setTheme((value) => value === 'dark' ? 'light' : 'dark') }}>{children}</ThemeContext.Provider> }
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext)
