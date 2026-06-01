import { Box, Breadcrumbs, Link, Stack, Typography } from "@mui/material";
import { ChevronRight } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  meta?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  breadcrumbs,
  actions,
  meta,
}: PageHeaderProps) {
  return (
    <Stack spacing={1.5} sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs
          separator={<ChevronRight size={14} />}
          aria-label="breadcrumb"
          sx={{ fontSize: 12, color: "text.secondary" }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            if (isLast || !crumb.to) {
              return (
                <Typography
                  key={`${crumb.label}-${index}`}
                  variant="caption"
                  color={isLast ? "text.primary" : "text.secondary"}
                >
                  {crumb.label}
                </Typography>
              );
            }
            return (
              <Link
                key={`${crumb.label}-${index}`}
                component={RouterLink}
                to={crumb.to}
                underline="hover"
                color="text.secondary"
                variant="caption"
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      ) : null}

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {eyebrow ? (
            <Typography
              variant="overline"
              color="primary.main"
              sx={{ letterSpacing: 1.4 }}
            >
              {eyebrow}
            </Typography>
          ) : null}
          <Typography variant="h4" sx={{ fontWeight: 600, mt: eyebrow ? 0.25 : 0 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
              {subtitle}
            </Typography>
          ) : null}
          {meta ? <Box sx={{ mt: 1.5 }}>{meta}</Box> : null}
        </Box>

        {actions ? (
          <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
            {actions}
          </Stack>
        ) : null}
      </Stack>
    </Stack>
  );
}
