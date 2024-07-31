'use client';
import { ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import appTheme from '@/styles/appTheme';

const MUIThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider theme={appTheme}>{children}</ThemeProvider>;
};

export default MUIThemeProvider;
