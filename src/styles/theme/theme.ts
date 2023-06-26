import { CSSProperties } from 'react';

import { createTheme } from '@mui/material/styles';

// Disable eslint as @mui does not follow same linting convention for interface suffixes.

/* eslint-disable */
declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: true; // adds the `xs` breakpoint
    sm: true;
    md: true;
    lg: true;
    xl: true;
    mobile: false; // removes the `mobile` breakpoint
    tablet: false;
    laptop: false;
    desktop: false;
  }

  interface TypographyVariants {
    bodyBig: CSSProperties;
    bodyLarge: CSSProperties;
    bodyMedium: CSSProperties;
    bodySmall: CSSProperties;
    bodySmallSB: CSSProperties;
    bodyTiny: CSSProperties;
    adornment: CSSProperties;
    cellSmall: CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    bodyBig?: CSSProperties;
    bodyLarge?: CSSProperties;
    bodyMedium?: CSSProperties;
    bodySmall?: CSSProperties;
    bodySmallSB?: CSSProperties;
    bodyTiny?: CSSProperties;
    adornment?: CSSProperties;
    cellSmall?: CSSProperties;
  }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    bodyBig: true;
    bodyLarge: true;
    bodyMedium: true;
    bodySmall: true;
    bodySmallSB: true;
    bodyTiny: true;
    adornment: true;
    cellSmall: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    primary: true;
    secondary: true;
    success: true;
    warning: true;
    action: true;
    link: true;
    buy: true;
    sell: true;
  }
  interface ButtonPropsSizeOverrides {
    small: true;
    tableSmall: true;
  }
}
/* eslint-enable */

const MuiButtonSharedStyle = {
  minWidth: '140px',
  transition: 'ease-in-out 250ms',
  borderRadius: '26px',
  padding: '10px 20px',
  fontSize: '18px',
  fontWeight: 700,
};

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 968,
      lg: 1280,
      xl: 1650,
    },
  },
  typography: {
    fontFamily: ['Inter', 'sans-serif'].join(','),
    fontSize: 14,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          display: 'flex',
          justifyContent: 'center',
          height: '172px',
          border: 'none',
          boxShadow: 'none',
          backgroundColor: 'transparent',
          color: 'var(--d8x-text-color)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '20px',
          paddingRight: '20px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: 14,
          fontWeight: 400,
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: 'var(--d8x-text-color)',
          marginLeft: '48px',
          ':first-of-type': {
            marginLeft: '0',
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: '0 24px',
        },
        content: {
          margin: '32px 0',
          '&.Mui-expanded': {
            margin: '32px 0',
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '0 24px',
          margin: '32px 0',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '26px',
          textTransform: 'none',
          color: 'var(--d8x-color-purple)',
          borderColor: 'var(--d8x-color-purple)',
          '&:hover': {
            borderColor: 'var(--d8x-color-purple)',
            backgroundColor: 'var(--d8x-background-purple)',
          },
        },
      },
      variants: [
        {
          props: { variant: 'primary' },
          style: {
            ...MuiButtonSharedStyle,
            backgroundColor: 'var(--d8x-color-purple)',
            border: '1px solid var(--d8x-color-purple)',
            color: 'var(--d8x-color-white)',
            fontSize: '16px',
            ':hover': {
              backgroundColor: 'rgba(var(--d8x-color-purple-rgb), 0.6)',
            },
            ':disabled': {
              color: 'var(--d8x-color-white-opac)',
            },
          },
        },
        {
          props: { variant: 'secondary' },
          style: {
            ...MuiButtonSharedStyle,
            backgroundColor: 'var(--d8x-color-white)',
            border: '1px solid var(--d8x-color-purple)',
            color: 'var(--d8x-color-purple)',
            ':hover': {
              backgroundColor: 'var(--d8x-color-white-opac)',
            },
          },
        },
        {
          props: { variant: 'success' },
          style: {
            ...MuiButtonSharedStyle,
            backgroundColor: 'var(--d8x-color-purple)',
            border: 0,
            color: 'var(--d8x-color-white)',
            ':hover': {
              backgroundColor: 'var(--d8x-background-purple)',
            },
          },
        },
        {
          props: { variant: 'warning' },
          style: {
            ...MuiButtonSharedStyle,
            backgroundColor: 'var(--d8x-color-yellow)',
            border: '1px solid var(--d8x-color-rose)',
            color: 'var(--d8x-text-color)',
            ':hover': {
              backgroundColor: 'var(--d8x-color-rose)',
            },
          },
        },
        {
          props: { variant: 'action' },
          style: {
            ...MuiButtonSharedStyle,
            borderRadius: '16px',
            backgroundColor: 'rgba(var(--d8x-color-purple-rgb), 0.1)',
            border: 0,
            color: 'var(--d8x-color-purple)',
            ':hover': {
              backgroundColor: 'rgba(var(--d8x-color-purple-rgb), 0.2)',
            },
          },
        },
        {
          props: { variant: 'buy' },
          style: {
            ...MuiButtonSharedStyle,
            backgroundColor: 'rgba(var(--d8x-background-buy-rgb), 1)',
            color: 'var(--d8x-color-white)',
            ':hover': {
              backgroundColor: 'rgba(var(--d8x-background-buy-rgb), 0.9)',
              color: 'var(--d8x-color-white)',
            },
            ':disabled': {
              backgroundColor: 'rgba(var(--d8x-background-buy-rgb), 0.5)',
              color: 'var(--d8x-color-white)',
            },
          },
        },
        {
          props: { variant: 'sell' },
          style: {
            ...MuiButtonSharedStyle,
            backgroundColor: 'rgba(var(--d8x-background-sell-rgb), 1)',
            color: 'var(--d8x-color-white)',
            ':hover': {
              backgroundColor: 'rgba(var(--d8x-background-sell-rgb), 0.9)',
              color: 'var(--d8x-color-white)',
            },
            ':disabled': {
              backgroundColor: 'rgba(var(--d8x-background-sell-rgb), 0.5)',
              color: 'var(--d8x-color-white)',
            },
          },
        },
        {
          props: { variant: 'link' },
          style: {
            ...MuiButtonSharedStyle,
            padding: '8px',
            fontWeight: 'normal',
            minWidth: '71px',
            border: 0,
            borderRadius: '8px',
            backgroundColor: 'transparent',
            color: 'var(--d8x-color-black)',
            ':hover': {
              backgroundColor: 'var(--d8x-color-purple-50)',
            },
          },
        },
        {
          props: { variant: 'outlined' },
          style: {
            borderRadius: '8px',
            borderWidth: '1px',
            padding: '8px',
            color: 'var(--d8x-color-black-maintext)',
            borderColor: 'var(--d8x-color-black-opac)',
            '&:hover': {
              backgroundColor: 'rgba(var(--d8x-color-purple-rgb), 0.2)',
              border: '0',
            },
          },
        },
        {
          props: { size: 'small' },
          style: {
            ...MuiButtonSharedStyle,
            padding: '3px 16px',
            fontSize: '18px',
            fontWeight: 'normal',
            minWidth: '50px',
          },
        },
        {
          props: { size: 'tableSmall' },
          style: {
            ...MuiButtonSharedStyle,
            padding: '0 8px',
            fontSize: '12px',
            fontWeight: 'normal',
            minWidth: '40px',
          },
        },
      ],
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: '0 8px',
          color: 'var(--d8x-color-purple)',

          '.MuiSvgIcon-root': {
            width: '15px',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          border: 'none',
          width: '180px',
          ':hover': {
            backgroundColor: 'rgba(var(--d8x-color-purple-rgb), 0.2)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'var(--d8x-color-black-opac)',
            },
          },
          ':focus-within': {
            backgroundColor: 'rgba(var(--d8x-color-purple-rgb), 0.2)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'var(--d8x-color-black-opac)',
              borderWidth: '1px',
            },
          },
        },
        input: {
          padding: '8px 10px',
          width: 'auto',
          border: 'none',
          fontSize: '16px',
          fontWeight: '500',
          color: 'var(--d8x-color-black-maintext)',
        },
        notchedOutline: {
          borderColor: 'var(--d8x-color-black-opac)',
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          backgroundColor: 'var(--d8x-color-white) !important',
          minWidth: '180px',
          ':hover': {
            backgroundColor: 'var(--d8x-color-white) !important',
          },
          ':focus': {
            backgroundColor: 'var(--d8x-color-white) !important',
          },
          ':active': {
            backgroundColor: 'var(--d8x-color-white) !important',
          },
          ':before': {
            border: 'none !important',
          },
          ':after': {
            border: 'none !important',
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        input: {
          fontWeight: '500',
          color: 'var(--d8x-color-purple)',
          padding: '3px 4px 3px 4px !important',
          width: 'auto',
          border: 'none',
          fontSize: '18px',
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: '12px',
          lineHeight: '16px',
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        thumb: {
          color: 'var(--d8x-color-purple)',
        },
        track: {
          color: 'var(--d8x-color-purple)',
        },
        rail: {
          color: 'var(--d8x-color-purple)',
        },
        markLabel: {
          fontSize: '12px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          color: 'var(--d8x-color-black-maintext)',
          boxShadow: 'none',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--d8x-background-card-details)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          textAlign: 'center',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          display: 'flex',
          justifyContent: 'space-between',
          padding: '20px 40px',
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        colorPrimary: {
          color: 'var(--d8x-color-purple)',
        },
      },
    },
  },
});

// Define MuiContainer responsive styles

if (theme.components?.MuiContainer?.styleOverrides?.root) {
  theme.components.MuiContainer.styleOverrides.root = {
    [theme.breakpoints.up('lg')]: {
      paddingLeft: '16px !important',
      paddingRight: '16px !important',
    },
    [theme.breakpoints.up('xl')]: {
      paddingLeft: '32px !important',
      paddingRight: '32px !important',
      maxWidth: '100%',
    },
  };
}

// The following typography configs are taken from Figma styleguide
// The sm breakpoint handles mobile screen sizes

theme.typography.h1 = {
  fontSize: 120,
  fontWeight: 600,
  lineHeight: '145px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 34,
    lineHeight: '41px',
  },
};

theme.typography.h2 = {
  fontSize: 90,
  fontWeight: 600,
  lineHeight: '109px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 28,
    lineHeight: '34px',
  },
};

theme.typography.h3 = {
  fontSize: 48,
  fontWeight: 600,
  lineHeight: '58px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 22,
    lineHeight: '27px',
  },
};

theme.typography.h4 = {
  fontSize: 32,
  fontWeight: 600,
  lineHeight: '38px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 20,
    lineHeight: '24px',
  },
};

theme.typography.h5 = {
  fontSize: 24,
  fontWeight: 600,
  lineHeight: '30px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 18,
    lineHeight: '24px',
  },
};

theme.typography.bodyBig = {
  fontSize: 64,
  fontWeight: 400,
  lineHeight: '77px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 26,
    lineHeight: '31px',
  },
};

theme.typography.bodyLarge = {
  fontSize: 20,
  fontWeight: 400,
  lineHeight: '24px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 20,
    lineHeight: '24px',
  },
};

theme.typography.bodyMedium = {
  fontSize: 16,
  fontWeight: 400,
  lineHeight: '24px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 16,
    lineHeight: '24px',
  },
};

theme.typography.bodySmall = {
  fontSize: 14,
  fontWeight: 400,
  lineHeight: '20px',
};

theme.typography.bodySmallSB = {
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
};

theme.typography.bodyTiny = {
  fontSize: 12,
  fontWeight: 400,
  lineHeight: '16px',
};

theme.typography.adornment = {
  fontSize: 12,
  fontWeight: 400,
  lineHeight: '16px',
};

theme.typography.cellSmall = {
  fontSize: 12,
  fontWeight: 400,
  lineHeight: '16px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 12,
    lineHeight: '16px',
  },
};
