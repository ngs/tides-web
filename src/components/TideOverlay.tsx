import { Box, Drawer, Paper, useMediaQuery, useTheme } from "@mui/material";
import type { ReactNode } from "react";

interface TideOverlayProps {
  children: ReactNode;
  open?: boolean;
}

export function TideOverlay({ children, open = true }: TideOverlayProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    // Mobile: Bottom drawer
    return (
      <Drawer
        anchor="bottom"
        open={open}
        variant="persistent"
        sx={{
          "& .MuiDrawer-paper": {
            height: "40vh",
            borderTopLeftRadius: theme.spacing(2),
            borderTopRightRadius: theme.spacing(2),
          },
        }}
      >
        <Box sx={{ height: "100%", overflow: "auto" }}>{children}</Box>
      </Drawer>
    );
  }

  // Desktop: Right sidebar
  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "400px",
        height: "100vh",
        overflow: "auto",
        zIndex: theme.zIndex.drawer,
        display: open ? "block" : "none",
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {children}
    </Paper>
  );
}
