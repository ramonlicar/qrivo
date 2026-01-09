
/**
 * Qrivo Global Style - Source of Truth
 * Siga rigorosamente estes tokens para qualquer nova implementação de UI.
 */

export const theme = {
  colors: {
    primary: {
      950: '#00331F',
      900: '#0D5A3C',
      700: '#098C55',
      600: '#059D5C',
      500: '#09B86D',
      100: '#DBFBED',
      50: '#F1FCF6',
    },
    secondary: {
      950: '#042522',
      900: '#063834',
      800: '#07413C',
      700: '#084A44',
      600: '#095751',
      500: '#046B62',
      100: '#DCEAE6',
      50: '#F4F8F6',
    },
    neutral: {
      black: '#01030E',
      white: '#FFFFFF',
      950: '#1F1F1D',
      900: '#242422',
      800: '#2C2C2A',
      700: '#686863',
      500: '#82827C',
      400: '#9B9B96',
      300: '#DCDCD5',
      200: '#E7E7E3',
      100: '#EEEEEC',
      50: '#F3F3F0',
      25: '#F8F6F5',
    },
    system: {
      info: { 800: '#1E40AF', 600: '#2563EB', 500: '#3B82F6' },
      success: { 800: '#065F46', 600: '#059669', 500: '#10B981' },
      warning: { 800: '#92400E', 600: '#D97706', 500: '#F59E0B' },
      error: { 800: '#991B1B', 600: '#DC2626', 500: '#EF4444' },
      highlight: { 800: '#5B21B6', 600: '#7C3AED', 500: '#8B5CF6' },
    }
  },
  shadows: {
    small: '0px 1px 2px rgba(19,25,33,0.1)',
    cards: '0px 1px 2px rgba(0,0,0,0.1)',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    textStyles: {
      "desktop-display": {
        "fontSize": "64px",
        "fontWeight": 700,
        "letterSpacing": "0em"
      },
      "desktop-h1---semibold": {
        "fontSize": "40px",
        "fontWeight": 700,
        "letterSpacing": "0em"
      },
      "desktop-h1---bold": {
        "fontSize": "40px",
        "fontWeight": 700,
        "letterSpacing": "0em"
      },
      "desktop-h2---semibold": {
        "fontSize": "32px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "120%"
      },
      "desktop-h2---bold": {
        "fontSize": "32px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "120%"
      },
      "desktop-h3---semibold": {
        "fontSize": "24px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "120%"
      },
      "desktop-h3---bold": {
        "fontSize": "24px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "120%"
      },
      "desktop-h4---semibold": {
        "fontSize": "20px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "120%"
      },
      "desktop-h4---bold": {
        "fontSize": "20px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "120%"
      },
      "desktop-h5---semibold": {
        "fontSize": "18px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "120%"
      },
      "desktop-h5---bold": {
        "fontSize": "18px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "120%"
      },
      "desktop-body-1---regular": {
        "fontSize": "15px",
        "fontWeight": 400,
        "letterSpacing": "0em",
        "lineHeight": "140%"
      },
      "desktop-body-1---medium": {
        "fontSize": "15px",
        "fontWeight": 500,
        "letterSpacing": "0em",
        "lineHeight": "140%"
      },
      "desktop-body-1---semibold": {
        "fontSize": "15px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "140%"
      },
      "desktop-body-1---bold": {
        "fontSize": "15px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "140%"
      },
      "desktop-body-2---regular": {
        "fontSize": "13px",
        "fontWeight": 400,
        "letterSpacing": "0em",
        "lineHeight": "140%"
      },
      "desktop-body-2---medium": {
        "fontSize": "13px",
        "fontWeight": 500,
        "letterSpacing": "0em",
        "lineHeight": "140%"
      },
      "desktop-body-2---semibold": {
        "fontSize": "13px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "140%"
      },
      "desktop-body-2---bold": {
        "fontSize": "13px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "140%"
      },
      "desktop-tags": {
        "fontSize": "11px",
        "fontWeight": 500,
        "letterSpacing": "0.02em",
        "lineHeight": "18px",
        "textTransform": "uppercase"
      },
      "desktop-small-texts-1---regular": {
        "fontSize": "12px",
        "fontWeight": 400,
        "letterSpacing": "0em",
        "lineHeight": "17px"
      },
      "desktop-small-texts-2---medium": {
        "fontSize": "12px",
        "fontWeight": 500,
        "letterSpacing": "0em",
        "lineHeight": "17px"
      },
      "desktop-small-texts-3---semibold": {
        "fontSize": "12px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "17px"
      },
      "mobile-displaym": {
        "fontSize": "38px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "46px"
      },
      "mobile-h1m---semibold": {
        "fontSize": "28px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "34px"
      },
      "mobile-h1m---bold": {
        "fontSize": "28px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "34px"
      },
      "mobile-h2m---semibold": {
        "fontSize": "24px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "29px"
      },
      "mobile-h2m---bold": {
        "fontSize": "24px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "29px"
      },
      "mobile-h3m---semibold": {
        "fontSize": "20px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "24px"
      },
      "mobile-h3m---bold": {
        "fontSize": "20px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "24px"
      },
      "mobile-h4m---semibold": {
        "fontSize": "18px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "22px"
      },
      "mobile-h4m---bold": {
        "fontSize": "18px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "22px"
      },
      "mobile-h5m---semibold": {
        "fontSize": "16px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "20px"
      },
      "mobile-h5m---bold": {
        "fontSize": "16px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "20px"
      },
      "mobile-body-1m---regular": {
        "fontSize": "14px",
        "fontWeight": 400,
        "letterSpacing": "0em",
        "lineHeight": "21px"
      },
      "mobile-body-1m---medium": {
        "fontSize": "14px",
        "fontWeight": 500,
        "letterSpacing": "0em",
        "lineHeight": "21px"
      },
      "mobile-body-1m---semibold": {
        "fontSize": "14px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "21px"
      },
      "mobile-body-1m---bold": {
        "fontSize": "14px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "21px"
      },
      "mobile-body-2m---regular": {
        "fontSize": "12px",
        "fontWeight": 400,
        "letterSpacing": "0em",
        "lineHeight": "18px"
      },
      "mobile-body-2m---medium": {
        "fontSize": "12px",
        "fontWeight": 500,
        "letterSpacing": "0em",
        "lineHeight": "18px"
      },
      "mobile-body-2m---semibold": {
        "fontSize": "12px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "18px"
      },
      "mobile-body-2m---bold": {
        "fontSize": "12px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "18px"
      },
      "mobile-tagsm": {
        "fontSize": "12px",
        "fontWeight": 500,
        "letterSpacing": "0.02em",
        "lineHeight": "18px",
        "textTransform": "uppercase"
      },
      "mobile-small-texts-1m---regular": {
        "fontSize": "10px",
        "fontWeight": 400,
        "letterSpacing": "0em",
        "lineHeight": "15px"
      },
      "mobile-small-texts-2m---medium": {
        "fontSize": "10px",
        "fontWeight": 500,
        "letterSpacing": "0em",
        "lineHeight": "15px"
      },
      "mobile-small-texts-3m---semibold": {
        "fontSize": "10px",
        "fontWeight": 700,
        "letterSpacing": "0em",
        "lineHeight": "15px"
      }
    }
  }
};
