import { createTheme } from '@mui/material/styles';

/**
 * Material Design 3 紫色系主题配置
 * 使用 MUI 默认的紫色调，营造现代、专业的视觉效果
 * 符合校园导航系统的定位
 */
const theme = createTheme({
  // 调色板：使用 MUI 标准的紫色系
  palette: {
    primary: {
      main: '#6750A4', // MUI 标准紫色
      light: '#EADDFF',
      dark: '#4F378B',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#625B71',
      light: '#E8DEF8',
      dark: '#4A4458',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFBFE',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1C1B1F',
      secondary: '#49454F',
    },
  },
  // 字体排版：使用 JetBrains Mono + Maple Mono NF CN
  // JetBrains Mono 作为主要等宽字体，Maple Mono NF CN 用于中文显示
  typography: {
    fontFamily: '"JetBrains Mono", "Maple Mono NF CN", "Noto Sans SC", monospace',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
  },
  // 组件样式圆角
  shape: {
    borderRadius: 12,
  },
  // 组件默认样式覆盖
  components: {
    // 按钮样式
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // 不转换为大写，保持自然
          fontWeight: 600,
          borderRadius: 20, // 圆角按钮
          padding: '10px 24px',
        },
      },
    },
    // 输入框样式
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    // 卡片样式
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    // 选择框样式
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;
