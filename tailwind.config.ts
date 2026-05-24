import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design system AgroMagdalena - exacto del HTML de las compañeras
        'primary':                    '#154212',
        'on-primary':                 '#ffffff',
        'primary-container':          '#2d5a27',
        'on-primary-container':       '#9dd090',
        'primary-fixed':              '#bcf0ae',
        'primary-fixed-dim':          '#a1d494',
        'on-primary-fixed':           '#002201',
        'on-primary-fixed-variant':   '#23501e',
        'inverse-primary':            '#a1d494',
        'surface-tint':               '#3b6934',

        'secondary':                  '#006399',
        'on-secondary':               '#ffffff',
        'secondary-container':        '#67bafd',
        'on-secondary-container':     '#004972',
        'secondary-fixed':            '#cde5ff',
        'secondary-fixed-dim':        '#94ccff',
        'on-secondary-fixed':         '#001d32',
        'on-secondary-fixed-variant': '#004b74',

        'tertiary':                   '#52320b',
        'on-tertiary':                '#ffffff',
        'tertiary-container':         '#6d4820',
        'on-tertiary-container':      '#ecb987',
        'tertiary-fixed':             '#ffdcbd',
        'tertiary-fixed-dim':         '#f0bd8b',
        'on-tertiary-fixed':          '#2c1600',
        'on-tertiary-fixed-variant':  '#623f18',

        'error':                      '#ba1a1a',
        'on-error':                   '#ffffff',
        'error-container':            '#ffdad6',
        'on-error-container':         '#93000a',

        'surface':                    '#f9faf2',
        'surface-dim':                '#d9dbd3',
        'surface-bright':             '#f9faf2',
        'surface-container-lowest':   '#ffffff',
        'surface-container-low':      '#f3f4ec',
        'surface-container':          '#edefe7',
        'surface-container-high':     '#e8e9e1',
        'surface-container-highest':  '#e2e3db',
        'surface-variant':            '#e2e3db',
        'on-surface':                 '#1a1c18',
        'on-surface-variant':         '#42493e',
        'inverse-surface':            '#2f312c',
        'inverse-on-surface':         '#f0f1e9',

        'outline':                    '#72796e',
        'outline-variant':            '#c2c9bb',
        'background':                 '#f9faf2',
        'on-background':              '#1a1c18',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'headline-lg': ['32px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg':     ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md':     ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-md':    ['14px', { lineHeight: '1.2', fontWeight: '600' }],
        'caption':     ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm:      '0.25rem',
        md:      '0.75rem',
        lg:      '1rem',
        xl:      '1.5rem',
        full:    '9999px',
      },
      spacing: {
        'xs':     '4px',
        'base':   '8px',
        'sm':     '12px',
        'md':     '24px',
        'lg':     '48px',
        'xl':     '64px',
        'gutter': '24px',
        'margin': '16px',
      },
    },
  },
  plugins: [],
}

export default config