import { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import * as SunCalc from "suncalc";

interface MoonPhaseProps {
  date: Date;
  lat: number;
  lon: number;
}

const getMoonPhaseName = (phase: number): string => {
  if (phase < 0.0625 || phase >= 0.9375) return "New Moon";
  if (phase < 0.1875) return "Waxing Crescent";
  if (phase < 0.3125) return "First Quarter";
  if (phase < 0.4375) return "Waxing Gibbous";
  if (phase < 0.5625) return "Full Moon";
  if (phase < 0.6875) return "Waning Gibbous";
  if (phase < 0.8125) return "Last Quarter";
  return "Waning Crescent";
};

export function MoonPhase({ date }: MoonPhaseProps) {
  const theme = useTheme();

  const moonData = useMemo(() => {
    const illumination = SunCalc.getMoonIllumination(date);
    return {
      phase: illumination.phase,
      fraction: illumination.fraction,
      phaseName: getMoonPhaseName(illumination.phase),
    };
  }, [date]);

  // Calculate moon phase SVG path
  const moonSvg = useMemo(() => {
    const { phase, fraction } = moonData;
    const size = 20;
    const radius = size / 2;
    const center = size / 2;

    // Waxing (0 to 0.5) or Waning (0.5 to 1)
    const isWaxing = phase < 0.5;

    // Calculate the shadow offset
    // At new moon (0): fully dark
    // At full moon (0.5): fully bright
    // At new moon (1): fully dark
    const shadowOffset = isWaxing
      ? radius * (1 - 2 * fraction) // Waxing: shadow moves from right to left
      : radius * (2 * fraction - 1); // Waning: shadow moves from left to right

    // Create the moon circle
    const moonCircle = `M ${center},${center} m -${radius},0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`;

    // Create the shadow ellipse (terminator line)
    const shadowPath = isWaxing
      ? `M ${center},${center - radius} A ${Math.abs(shadowOffset)},${radius} 0 0,${shadowOffset > 0 ? 0 : 1} ${center},${center + radius} A ${radius},${radius} 0 0,0 ${center},${center - radius}`
      : `M ${center},${center - radius} A ${radius},${radius} 0 0,1 ${center},${center + radius} A ${Math.abs(shadowOffset)},${radius} 0 0,${shadowOffset > 0 ? 0 : 1} ${center},${center - radius}`;

    return { moonCircle, shadowPath, size };
  }, [moonData]);

  const borderColor =
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.3)"
      : "rgba(0, 0, 0, 0.2)";
  const moonColor = theme.palette.mode === "dark" ? "#e0e0e0" : "#333333";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      <svg
        width={moonSvg.size}
        height={moonSvg.size}
        viewBox={`0 0 ${moonSvg.size} ${moonSvg.size}`}
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
      >
        {/* Moon shadow (dark part) */}
        <path d={moonSvg.shadowPath} fill={moonColor} opacity={0.2} />

        {/* Moon illuminated part */}
        <path d={moonSvg.shadowPath} fill={moonColor} />

        {/* Moon border (outline) */}
        <circle
          cx={moonSvg.size / 2}
          cy={moonSvg.size / 2}
          r={moonSvg.size / 2 - 1}
          fill="none"
          stroke={borderColor}
          strokeWidth="1"
        />
      </svg>

      <Typography
        variant="caption"
        sx={{
          fontSize: "11px",
          color: theme.palette.text.secondary,
          lineHeight: 1,
        }}
      >
        {moonData.phaseName}
      </Typography>
    </Box>
  );
}
