import { Box, Drawer, Paper, useMediaQuery, useTheme } from "@mui/material";
import { useState, useEffect, useRef, type ReactNode } from "react";

interface TideOverlayProps {
  children: ReactNode;
  open?: boolean;
  onSizeChange?: (size: number) => void;
}

const DESKTOP_STORAGE_KEY = "desktopPanelWidth";
const MOBILE_STORAGE_KEY = "mobilePanelHeight";
const DEFAULT_DESKTOP_WIDTH = 400;
const DEFAULT_MOBILE_HEIGHT = 40; // vh
const MIN_DESKTOP_WIDTH = 300;
const MAX_DESKTOP_WIDTH = 800;
const MIN_MOBILE_HEIGHT = 20; // vh
const MAX_MOBILE_HEIGHT = 80; // vh

export function TideOverlay({
  children,
  open = true,
  onSizeChange,
}: TideOverlayProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDraggingRef = useRef(false);

  // Load initial size from localStorage
  const [desktopWidth, setDesktopWidth] = useState<number>(() => {
    const saved = localStorage.getItem(DESKTOP_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_DESKTOP_WIDTH;
  });

  const [mobileHeight, setMobileHeight] = useState<number>(() => {
    const saved = localStorage.getItem(MOBILE_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_MOBILE_HEIGHT;
  });

  // Save to localStorage when size changes
  useEffect(() => {
    localStorage.setItem(DESKTOP_STORAGE_KEY, desktopWidth.toString());
  }, [desktopWidth]);

  useEffect(() => {
    localStorage.setItem(MOBILE_STORAGE_KEY, mobileHeight.toString());
  }, [mobileHeight]);

  // Notify parent of size changes
  useEffect(() => {
    onSizeChange?.(isMobile ? mobileHeight : desktopWidth);
  }, [desktopWidth, mobileHeight, isMobile, onSizeChange]);

  // Desktop resize handler (drag left edge)
  const handleDesktopMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const newWidth = window.innerWidth - moveEvent.clientX;
      const clampedWidth = Math.max(
        MIN_DESKTOP_WIDTH,
        Math.min(MAX_DESKTOP_WIDTH, newWidth),
      );
      setDesktopWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Mobile resize handler (drag top edge)
  const handleMobileMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;

    const getClientY = (event: MouseEvent | TouchEvent) => {
      return "touches" in event ? event.touches[0].clientY : event.clientY;
    };

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;

      const clientY = getClientY(moveEvent);
      const newHeightVh =
        ((window.innerHeight - clientY) / window.innerHeight) * 100;
      const clampedHeight = Math.max(
        MIN_MOBILE_HEIGHT,
        Math.min(MAX_MOBILE_HEIGHT, newHeightVh),
      );
      setMobileHeight(clampedHeight);
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleEnd);
  };

  const commonStyles = {
    backgroundColor: theme.palette.background.paper,
    backgroundImage: "none",
  };

  const resizeHandleStyles = {
    position: "absolute" as const,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const handleIndicatorStyles = {
    backgroundColor: theme.palette.divider,
    borderRadius: "4px",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: theme.palette.primary.main,
    },
  };

  if (isMobile) {
    // Mobile: Bottom drawer with top resize handle
    return (
      <Drawer
        anchor="bottom"
        open={open}
        variant="persistent"
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              height: `${mobileHeight}vh`,
              borderTopLeftRadius: theme.spacing(2),
              borderTopRightRadius: theme.spacing(2),
              ...commonStyles,
            },
          },
        }}
      >
        {/* Resize handle at top */}
        <Box
          onMouseDown={handleMobileMouseDown}
          onTouchStart={handleMobileMouseDown}
          sx={{
            ...resizeHandleStyles,
            top: 0,
            left: 0,
            right: 0,
            height: "16px",
            cursor: "ns-resize",
            touchAction: "none",
          }}
        >
          <Box
            sx={{
              ...handleIndicatorStyles,
              width: "40px",
              height: "4px",
            }}
          />
        </Box>
        <Box sx={{ height: "100%", overflow: "auto", pt: 2 }}>{children}</Box>
      </Drawer>
    );
  }

  // Desktop: Right sidebar with left resize handle
  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        top: 0,
        right: 0,
        width: `${desktopWidth}px`,
        height: "100vh",
        overflow: "auto",
        zIndex: theme.zIndex.drawer,
        display: open ? "block" : "none",
        ...commonStyles,
      }}
    >
      {/* Resize handle at left edge */}
      <Box
        onMouseDown={handleDesktopMouseDown}
        sx={{
          ...resizeHandleStyles,
          top: 0,
          left: 0,
          bottom: 0,
          width: "16px",
          cursor: "ew-resize",
        }}
      >
        <Box
          sx={{
            ...handleIndicatorStyles,
            width: "4px",
            height: "40px",
          }}
        />
      </Box>
      <Box sx={{ height: "100%", overflow: "auto", pl: 2 }}>{children}</Box>
    </Paper>
  );
}
