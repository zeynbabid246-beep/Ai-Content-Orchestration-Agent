import {
  AppBar,
  Box,
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
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Dna,
  LayoutDashboard,
  LayoutGrid,
  Link2,
  Megaphone,
  Menu as MenuIcon,
  Newspaper,
  Sparkles,
  Users,
} from "lucide-react";
import { TeamNameSetupDialog } from "../../features/team/TeamNameSetupDialog";
import { AssistantWidget } from "../../features/assistant/AssistantWidget";
import { authStorage } from "../lib/storage";
import { ROUTES } from "../lib/routes";
import { TeamSwitcher } from "../../features/team/TeamSwitcher";
import { useTeamPermissions } from "../hooks/useTeamPermissions";
import { UserAccountMenu } from "./UserAccountMenu";

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
    title: "Brand",
    items: [{ label: "Brand DNA", path: ROUTES.brandStudio, icon: <Dna size={ICON_SIZE} /> }],
  },
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", path: ROUTES.dashboard, icon: <LayoutDashboard size={ICON_SIZE} /> },
      { label: "Quick Generate", path: ROUTES.generate, icon: <Sparkles size={ICON_SIZE} /> },
      { label: "Content Feed", path: ROUTES.contentFeed, icon: <Newspaper size={ICON_SIZE} /> },
      { label: "Calendar", path: ROUTES.calendar, icon: <CalendarClock size={ICON_SIZE} /> },
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
    title: "Integrations",
    items: [
      {
        label: "Social Accounts",
        path: ROUTES.integrationsSocialAccounts,
        icon: <Link2 size={ICON_SIZE} />,
      },
    ],
  },
  {
    title: "Team",
    items: [{ label: "Members", path: ROUTES.inviteUser, icon: <Users size={ICON_SIZE} /> }],
  },
];

function isPathActive(currentPath: string, item: NavItem): boolean {
  if (item.matchPrefix) {
    return currentPath === item.path || currentPath.startsWith(`${item.path}/`);
  }
  return currentPath === item.path;
}

function AppLogo() {
  return (
    <Box
      component="img"
      src="/logo1.png"
      alt="AiContentFlow"
      sx={{
        width: 28,
        height: 28,
        borderRadius: 1,
        objectFit: "contain",
        display: "block",
        flexShrink: 0,
      }}
    />
  );
}

export function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const { canMutateContent, canManageTeam } = useTeamPermissions();

  const navSections = useMemo(() => {
    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.path === ROUTES.generate) return canMutateContent;
        if (item.path === ROUTES.inviteUser) return canManageTeam;
        return true;
      }),
    })).filter((section) => section.items.length > 0);
  }, [canMutateContent, canManageTeam]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1"
  );

  const drawerWidth = useMemo(() => {
    if (isMobile) return DRAWER_WIDTH_EXPANDED;
    return collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED;
  }, [collapsed, isMobile]);

  const showBackButton = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    return segments.length > 2;
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((previous) => {
      const next = !previous;
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const renderDrawerContent = (
    <Stack sx={{ height: 1 }}>
      <Toolbar
        sx={{
          justifyContent: collapsed && !isMobile ? "center" : "flex-start",
          px: 1.5,
          minHeight: 60,
        }}
      >
        {!collapsed || isMobile ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <AppLogo />
            <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: 0.2 }}>
              AiContentFlow
            </Typography>
          </Stack>
        ) : (
          <AppLogo />
        )}

        {isMobile ? (
          <IconButton
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            size="small"
            color="inherit"
            sx={{ ml: "auto" }}
          >
            ×
          </IconButton>
        ) : null}
      </Toolbar>

      <Divider />

      <Box sx={{ py: 1, overflowY: "auto", flex: 1 }}>
        {navSections.map((section) => (
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

      {!isMobile ? (
        <>
          <Divider />
          <Box
            sx={{
              p: 1,
              display: "flex",
              justifyContent: collapsed ? "center" : "flex-end",
              alignItems: "center",
            }}
          >
            <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <IconButton
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={toggleCollapsed}
                size="small"
                color="inherit"
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </IconButton>
            </Tooltip>
          </Box>
        </>
      ) : null}
    </Stack>
  );

  const teamId = authStorage.getTeamId();
  const [teamNameSetupRequired, setTeamNameSetupRequired] = useState(
    () => authStorage.isTeamNameSetupRequired()
  );
  const showTeamNameSetup = teamNameSetupRequired && Boolean(teamId);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex" }}>
      {teamId ? (
        <TeamNameSetupDialog
          open={showTeamNameSetup}
          teamId={teamId}
          onComplete={() => setTeamNameSetupRequired(false)}
        />
      ) : null}
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
              <Stack direction="row" spacing={0.5} alignItems="center">
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
                {showBackButton ? (
                  <Tooltip title="Go back">
                    <IconButton
                      aria-label="Go back"
                      color="inherit"
                      onClick={() => navigate(-1)}
                      size="small"
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                      }}
                    >
                      <ArrowLeft size={18} />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <TeamSwitcher />
                <UserAccountMenu />
              </Stack>
            </Toolbar>
          </Container>
        </AppBar>

        <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 3 } }}>
          <Outlet />
        </Container>
      </Box>
      <AssistantWidget />
    </Box>
  );
}
