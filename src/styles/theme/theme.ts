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
    adornment: CSSProperties;
    cellSmall: CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    bodyBig?: CSSProperties;
    bodyLarge?: CSSProperties;
    bodyMedium?: CSSProperties;
    bodySmall?: CSSProperties;
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
    secondaryAction: true;
  }
}
/* eslint-enable */

const MuiButtonSharedStyle = {
  minWidth: '140px',
  transition: 'ease-in-out 250ms',
  borderRadius: '26px',
  padding: '10px 20px',
  fontSize: '17px',
  fontWeight: 700,
};

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1760,
    },
  },
  typography: {
    fontFamily: ['Inter', 'sans-serif'].join(','),
    fontSize: 16,
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
            ':hover': {
              backgroundColor: 'rgba(var(--d8x-color-purple-rgb), 0.6)',
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
          props: { variant: 'secondaryAction' },
          style: {
            ...MuiButtonSharedStyle,
            borderRadius: '16px',
            border: '1px solid rgb(var(--d8x-color-purple-rgb), 0.1)',
            color: 'var(--d8x-color-purple)',
            ':hover': {
              backgroundColor: 'rgba(var(--d8x-color-purple-rgb), 0.1)',
            },
          },
        },
        {
          props: { size: 'small' },
          style: {
            ...MuiButtonSharedStyle,
            padding: '2px 16px',
            fontSize: '14px',
            minWidth: '50px',
          },
        },
      ],
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          backgroundColor: 'var(--d8x-background-purple)',
          width: '180px',
          ':hover': {
            backgroundColor: 'rgba(var(--d8x-color-purple-rgb), 0.2)',
          },
          ':focus': {
            backgroundColor: 'rgba(var(--d8x-color-purple-rgb), 0.2)',
          },
          ':active': {
            backgroundColor: 'rgba(var(--d8x-color-purple-rgb), 0.2)',
          },
        },
        input: {
          padding: '8px 10px',
          width: 'auto',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
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
          justifyContent: 'center',
        },
      },
    },
  },
});

// Define table responsive typography

if (theme.components?.MuiTableCell?.styleOverrides?.root) {
  theme.components.MuiTableCell.styleOverrides.root = {
    fontSize: 14,
    fontWeight: 400,
    whiteSpace: 'nowrap',
    [theme.breakpoints.down('sm')]: {
      fontSize: 11,
      lineHeight: '13px',
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
  fontSize: 32,
  fontWeight: 400,
  lineHeight: '38px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 20,
    lineHeight: '25px',
  },
};

theme.typography.bodyMedium = {
  fontSize: 24,
  fontWeight: 400,
  lineHeight: '32px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 17,
    lineHeight: '20px',
  },
};

theme.typography.bodySmall = {
  fontSize: 16,
  fontWeight: 400,
  lineHeight: '20px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 11,
    lineHeight: '13px',
  },
};

theme.typography.adornment = {
  fontSize: 14,
  fontWeight: 400,
  lineHeight: '17px',
};

theme.typography.cellSmall = {
  fontSize: 13,
  fontWeight: 400,
  lineHeight: '16px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 13,
    lineHeight: '16px',
  },
};
