/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
                serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
                sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['DM Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
            },
            fontSize: {
                'display-xl': ['3rem', { lineHeight: '1.02', letterSpacing: '-0.02em', fontWeight: '600' }],
                'display-l': ['2rem', { lineHeight: '1.08', letterSpacing: '-0.015em', fontWeight: '600' }],
                'display-m': ['1.375rem', { lineHeight: '1.18', letterSpacing: '-0.012em', fontWeight: '600' }],
            },
            borderRadius: {
                sm: '0.25rem',  // R-SM · 4px
                md: '0.5rem',   // R-MD · 8px
                lg: '0.75rem',
                xl: '1.25rem',  // R-XL · 20px
                '2xl': '1.75rem',
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                surface: {
                    DEFAULT: 'hsl(var(--surface))',
                    2: 'hsl(var(--surface-2))',
                },
                ink: {
                    1: 'hsl(var(--ink-1))',
                    2: 'hsl(var(--ink-2))',
                    3: 'hsl(var(--ink-3))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                    dark: 'hsl(var(--primary-dark))',
                    light: 'hsl(var(--primary-light))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                success: {
                    DEFAULT: 'hsl(var(--success))',
                    foreground: 'hsl(var(--success-foreground))'
                },
                warning: {
                    DEFAULT: 'hsl(var(--warning))',
                    foreground: 'hsl(var(--warning-foreground))'
                },
                info: {
                    DEFAULT: 'hsl(var(--info))',
                    foreground: 'hsl(var(--info-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
            },
            boxShadow: {
                'sm': 'var(--shadow-sm)',
                'md': 'var(--shadow-md)',
                'lg': 'var(--shadow-lg)',
                'primary': 'var(--shadow-primary)',
                'hard-sm': 'var(--shadow-sm)',
                'hard': 'var(--shadow-md)',
                'hard-lg': 'var(--shadow-lg)',
                'hard-primary': 'var(--shadow-primary)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                'fade-up': {
                    from: { opacity: '0', transform: 'translateY(8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-up': 'fade-up 380ms cubic-bezier(0.22, 1, 0.36, 1) both'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
