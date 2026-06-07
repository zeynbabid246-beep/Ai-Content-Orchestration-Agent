import {
  Avatar,
  Box,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { ChevronDown, LogOut, UserCircle2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../features/auth/auth.api";
import { useProfile } from "../../features/profile/profil.queries";
import { ROUTES } from "../lib/routes";
import { authStorage } from "../lib/storage";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserAccountMenu() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const fallbackUsername = authStorage.getUsername() ?? "User";

  const displayName = profile?.username ?? fallbackUsername;
  const email = profile?.email ?? authStorage.getEmail() ?? "";
  const avatarUrl = profile?.avatarUrl ?? null;
  const teamName = profile?.teamName;
  const teamRole = profile?.teamRole;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleSignOut = async () => {
    setAnchorEl(null);
    await logout();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          cursor: "pointer",
          borderRadius: 1.5,
          px: 1,
          py: 0.5,
          "&:hover": { bgcolor: "action.hover" },
        }}
        role="button"
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        aria-label="Account menu"
      >
        <Avatar
          src={avatarUrl ?? undefined}
          sx={{ width: 32, height: 32, fontSize: 13, bgcolor: "primary.main" }}
        >
          {!avatarUrl && getInitials(displayName)}
        </Avatar>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ display: { xs: "none", sm: "block" }, maxWidth: 140 }}
          noWrap
        >
          {displayName}
        </Typography>
        <ChevronDown size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { minWidth: 240, mt: 0.5 },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {displayName}
          </Typography>
          {email ? (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {email}
            </Typography>
          ) : null}
          {teamName ? (
            <Stack direction="row" spacing={0.75} alignItems="center" mt={1} flexWrap="wrap" useFlexGap>
              <Typography variant="caption" color="text.secondary" noWrap>
                {teamName}
              </Typography>
              {teamRole ? (
                <Chip label={teamRole} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
              ) : null}
            </Stack>
          ) : null}
        </Box>

        <Divider />

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            navigate(ROUTES.profile);
          }}
        >
          <ListItemIcon>
            <UserCircle2 size={18} />
          </ListItemIcon>
          <ListItemText primary="My profile" />
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleSignOut} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "error.main" }}>
            <LogOut size={18} />
          </ListItemIcon>
          <ListItemText primary="Sign out" primaryTypographyProps={{ fontWeight: 600 }} />
        </MenuItem>
      </Menu>
    </>
  );
}
