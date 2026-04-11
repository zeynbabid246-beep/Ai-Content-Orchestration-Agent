import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { authStorage } from "../lib/storage";

const SIDEBAR_COLLAPSE_KEY = "app.sidebar.collapsed";
const DRAWER_WIDTH_EXPANDED = 264;
const DRAWER_WIDTH_COLLAPSED = 80;

type NavItem = {
  label: string;
  path: string;
  glyph: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", path: "/app/dashboard", glyph: "D" },
      { label: "Brands", path: "/app/brands", glyph: "B" },
      { label: "Brand Studio", path: "/app/brand-studio", glyph: "S" },
      { label: "Generate", path: "/app/generate", glyph: "G" },
      { label: "Scheduler", path: "/app/scheduler", glyph: "S" },
    ],
  },
  {
    title: "Platforms",
    items: [
      { label: "Social Media", path: "/app/social-media", glyph: "P" },
      { label: "Content Feed", path: "/app/content-feed", glyph: "F" },
      { label: "Content Types", path: "/app/content-type", glyph: "T" },
    ],
  },
  {
    title: "Team",
    items: [
      { label: "Team Members", path: "/app/invite-user", glyph: "M" },
      { label: "Profile", path: "/app/profile", glyph: "U" },
    ],
  },
];

export function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const username = authStorage.getUsername() ?? "User";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1");

  const drawerWidth = useMemo(() => {
    if (isMobile) return DRAWER_WIDTH_EXPANDED;
    return collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED;
  }, [collapsed, isMobile]);

  const toggleCollapsed = () => {
    setCollapsed((previous) => {
      const next = !previous;
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const handleLogout = () => {
    authStorage.clear();
    navigate("/app/login");
  };

  const renderDrawerContent = (
    <Stack sx={{ height: 1 }}>
      <Toolbar sx={{ justifyContent: collapsed && !isMobile ? "center" : "space-between", px: 1.5 }}>
        {(!collapsed || isMobile) ? (
          <Typography variant="h6" sx={{ fontFamily: "Cormorant Garamond, serif" }}>
            ContentFlow AI
          </Typography>
        ) : null}
        <IconButton
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={isMobile ? () => setMobileOpen(false) : toggleCollapsed}
          size="small"
          color="inherit"
        >
          {isMobile ? "×" : collapsed ? "›" : "‹"}
        </IconButton>
      </Toolbar>
      <Divider />

      <Box sx={{ py: 1, overflowY: "auto", flex: 1 }}>
        {NAV_SECTIONS.map((section) => (
          <List
            key={section.title}
            disablePadding
            subheader={
              (!collapsed || isMobile) ? (
                <ListSubheader sx={{ bgcolor: "transparent", color: "text.secondary", typography: "caption", letterSpacing: 1 }}>
                  {section.title}
                </ListSubheader>
              ) : undefined
            }
          >
            {section.items.map((item) => {
              const active = location.pathname === item.path;
              const button = (
                <ListItemButton
                  selected={active}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    mx: 1,
                    mb: 0.5,
                    borderRadius: 1,
                    minHeight: 44,
                    justifyContent: collapsed && !isMobile ? "center" : "flex-start",
                    "&.Mui-selected": {
                      bgcolor: alpha(theme.palette.primary.main, 0.18),
                      color: "primary.main",
                    },
                    "&.Mui-selected:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.24),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: collapsed && !isMobile ? "auto" : 36, color: "inherit" }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        display: "grid",
                        placeItems: "center",
                        border: "1px solid",
                        borderColor: active ? "primary.main" : "divider",
                        typography: "caption",
                        fontWeight: 700,
                      }}
                    >
                      {item.glyph}
                    </Box>
                  </ListItemIcon>
                  {(!collapsed || isMobile) ? <ListItemText primary={item.label} /> : null}
                </ListItemButton>
              );

              if (collapsed && !isMobile) {
                return (
                  <Tooltip title={item.label} placement="right" key={item.path}>
                    {button}
                  </Tooltip>
                );
              }
              return <Box key={item.path}>{button}</Box>;
            })}
          </List>
        ))}
      </Box>

      <Divider />
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.5 }}>
        {(!collapsed || isMobile) ? <Typography variant="body2">{username}</Typography> : null}
        <Button variant="outlined" color="inherit" size="small" onClick={handleLogout}>
          Log out
        </Button>
      </Stack>
    </Stack>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex" }}>
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            transition: theme.transitions.create("width", {
              duration: theme.transitions.duration.shortest,
            }),
            overflowX: "hidden",
          },
        }}
      >
        {renderDrawerContent}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <AppBar position="sticky" color="transparent" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider", backdropFilter: "blur(8px)" }}>
          <Container maxWidth={false}>
            <Toolbar disableGutters sx={{ justifyContent: "space-between", px: { xs: 1, md: 2 } }}>
              <Stack direction="row" spacing={1} alignItems="center">
                {isMobile ? (
                  <IconButton aria-label="Open sidebar" color="inherit" onClick={() => setMobileOpen(true)}>
                    ≡
                  </IconButton>
                ) : null}
                <Typography variant="h6" sx={{ fontFamily: "Cormorant Garamond, serif" }}>
                  Workspace
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">{username}</Typography>
              </Stack>
            </Toolbar>
          </Container>
        </AppBar>

        <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 3 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
