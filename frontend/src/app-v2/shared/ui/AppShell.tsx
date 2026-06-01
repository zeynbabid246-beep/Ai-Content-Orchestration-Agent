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
import type { ReactNode } from "react";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Megaphone,
  Menu as MenuIcon,
  Newspaper,
  Sparkles,
  Store,
  UserCircle2,
  Users,
} from "lucide-react";
import { authStorage } from "../lib/storage";
import { ROUTES } from "../lib/routes";
import { TeamSwitcher } from "../../features/team/TeamSwitcher";

const SIDEBAR_COLLAPSE_KEY = "app.sidebar.collapsed";
const DRAWER_WIDTH_EXPANDED = 252;
const DRAWER_WIDTH_COLLAPSED = 76;
const ICON_SIZE = 18;

type NavItem = {
  label: string;
  path: string;
  icon: ReactNode;
  matchPrefix?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", path: ROUTES.dashboard, icon: <LayoutDashboard size={ICON_SIZE} /> },
      { label: "Quick Generate", path: ROUTES.generate, icon: <Sparkles size={ICON_SIZE} /> },
      { label: "Content Feed", path: ROUTES.contentFeed, icon: <Newspaper size={ICON_SIZE} /> },
      { label: "Scheduler", path: ROUTES.scheduler, icon: <CalendarClock size={ICON_SIZE} /> },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Channels",
        path: ROUTES.channels,
        icon: <LayoutGrid size={ICON_SIZE} />,
        matchPrefix: true,
      },
      {
        label: "Campaigns",
        path: ROUTES.campaigns,
        icon: <Megaphone size={ICON_SIZE} />,
        matchPrefix: true,
      },
    ],
  },
  {
    title: "Team",
    items: [
      { label: "Brand Studio", path: ROUTES.brandStudio, icon: <Store size={ICON_SIZE} /> },
      { label: "Members", path: ROUTES.inviteUser, icon: <Users size={ICON_SIZE} /> },
      { label: "Profile", path: ROUTES.profile, icon: <UserCircle2 size={ICON_SIZE} /> },
    ],
  },
];

function isPathActive(currentPath: string, item: NavItem): boolean {
  if (item.matchPrefix) {
    return currentPath === item.path || currentPath.startsWith(`${item.path}/`);
  }
  return currentPath === item.path;
}

export function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const username = authStorage.getUsername() ?? "User";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1"
  );

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
    navigate(ROUTES.login);
  };

  const renderDrawerContent = (
    <Stack sx={{ height: 1 }}>
      <Toolbar
        sx={{
          justifyContent: collapsed && !isMobile ? "center" : "space-between",
          px: 1.5,
          minHeight: 60,
        }}
      >
        {!collapsed || isMobile ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                display: "grid",
                placeItems: "center",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              A
            </Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: 0.2 }}>
              AiContentFlow
            </Typography>
          </Stack>
        ) : (
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              display: "grid",
              placeItems: "center",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            A
          </Box>
        )}

        {!isMobile ? (
          <IconButton
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleCollapsed}
            size="small"
            color="inherit"
            sx={{ display: collapsed ? "none" : "inline-flex" }}
          >
            <ChevronLeft size={16} />
          </IconButton>
        ) : (
          <IconButton
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            size="small"
            color="inherit"
          >
            ×
          </IconButton>
        )}
      </Toolbar>

      <Divider />

      <Box sx={{ py: 1, overflowY: "auto", flex: 1 }}>
        {NAV_SECTIONS.map((section) => (
          <List
            key={section.title}
            disablePadding
            subheader={
              !collapsed || isMobile ? (
                <ListSubheader
                  sx={{
                    bgcolor: "transparent",
                    color: "text.secondary",
                    typography: "caption",
                    letterSpacing: 1.2,
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    lineHeight: "32px",
                  }}
                >
                  {section.title}
                </ListSubheader>
              ) : (
                <Box sx={{ height: 14 }} />
              )
            }
          >
            {section.items.map((item) => {
              const active = isPathActive(location.pathname, item);

              const button = (
                <ListItemButton
                  selected={active}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    mx: 1,
                    mb: 0.25,
                    borderRadius: 1,
                    minHeight: 40,
                    justifyContent: collapsed && !isMobile ? "center" : "flex-start",
                    color: active ? "primary.main" : "text.primary",
                    "&.Mui-selected": {
                      bgcolor: alpha(theme.palette.primary.main, 0.14),
                      color: "primary.main",
                    },
                    "&.Mui-selected:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.22),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed && !isMobile ? "auto" : 32,
                      color: "inherit",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  {!collapsed || isMobile ? (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: 13.5, fontWeight: active ? 600 : 500 }}
                    />
                  ) : null}
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

      <Stack
        direction={collapsed && !isMobile ? "column" : "row"}
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ p: 1.5 }}
      >
        {!collapsed || isMobile ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.primary.main, 0.18),
                color: "primary.main",
                display: "grid",
                placeItems: "center",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {username.slice(0, 1).toUpperCase()}
            </Box>
            <Typography variant="body2" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
              {username}
            </Typography>
          </Stack>
        ) : null}

        <Tooltip title="Log out" placement={collapsed ? "right" : "top"}>
          <IconButton size="small" onClick={handleLogout} color="inherit">
            <LogOut size={16} />
          </IconButton>
        </Tooltip>
      </Stack>

      {collapsed && !isMobile ? (
        <Stack alignItems="center" sx={{ pb: 1 }}>
          <IconButton
            aria-label="Expand sidebar"
            onClick={toggleCollapsed}
            size="small"
            color="inherit"
          >
            <ChevronRight size={16} />
          </IconButton>
        </Stack>
      ) : null}
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
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(8px)",
          }}
        >
          <Container maxWidth={false}>
            <Toolbar
              disableGutters
              sx={{ justifyContent: "space-between", px: { xs: 1, md: 2 }, minHeight: 56 }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                {isMobile ? (
                  <IconButton
                    aria-label="Open sidebar"
                    color="inherit"
                    onClick={() => setMobileOpen(true)}
                    size="small"
                  >
                    <MenuIcon size={18} />
                  </IconButton>
                ) : null}
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <TeamSwitcher />
                <Typography variant="caption" color="text.secondary">
                  Signed in as <strong style={{ color: "#0f172a" }}>{username}</strong>
                </Typography>
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
