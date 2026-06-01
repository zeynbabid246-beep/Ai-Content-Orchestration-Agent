import { Box, Stack, Tab, Tabs } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import type { ReactNode } from "react";

export interface WorkspaceTabItem {
  label: string;
  to: string;
  icon?: ReactNode;
  matchPrefix?: boolean;
}

interface WorkspaceTabsProps {
  items: WorkspaceTabItem[];
}

export function WorkspaceTabs({ items }: WorkspaceTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeValue = useMemo(() => {
    const pathname = location.pathname;
    let best: WorkspaceTabItem | null = null;
    let bestLen = -1;
    for (const item of items) {
      const matches = item.matchPrefix
        ? pathname === item.to || pathname.startsWith(`${item.to}/`)
        : pathname === item.to;
      if (matches && item.to.length > bestLen) {
        best = item;
        bestLen = item.to.length;
      }
    }
    return best?.to ?? items[0]?.to ?? "";
  }, [items, location.pathname]);

  return (
    <Box
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        mb: 3,
      }}
    >
      <Tabs
        value={activeValue}
        onChange={(_, value: string) => navigate(value)}
        variant="scrollable"
        scrollButtons="auto"
        textColor="primary"
        indicatorColor="primary"
        sx={{
          minHeight: 44,
          "& .MuiTab-root": {
            minHeight: 44,
            textTransform: "none",
            fontSize: 13,
            letterSpacing: 0.2,
          },
        }}
      >
        {items.map((item) => (
          <Tab
            key={item.to}
            value={item.to}
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                {item.icon}
                <span>{item.label}</span>
              </Stack>
            }
          />
        ))}
      </Tabs>
    </Box>
  );
}
