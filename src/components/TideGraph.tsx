import { useMemo, useState, useEffect, Fragment } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
} from "date-fns";
import { Box, Typography, IconButton, Stack, useTheme } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSunrise, faSunset } from "@fortawesome/pro-regular-svg-icons";
import * as SunCalc from "suncalc";
import { MoonPhase } from "./MoonPhase";
import type { TidePrediction, TideExtreme, MapPosition } from "../types";

interface TideGraphProps {
  predictions: TidePrediction[];
  highs: TideExtreme[];
  lows: TideExtreme[];
  loading?: boolean;
  error?: string | null;
  onDateChange?: (date: Date) => void;
  position: MapPosition;
  locationName: string;
}

export function TideGraph({
  predictions: rawPredictions,
  highs: rawHighs,
  lows: rawLows,
  loading,
  error,
  onDateChange,
  position,
  locationName,
}: TideGraphProps) {
  const theme = useTheme();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const predictions = rawPredictions;

  // Update current time every minute at 0 seconds
  useEffect(() => {
    // Initial update
    setCurrentTime(Date.now());

    // Calculate milliseconds until next minute (0 seconds)
    const now = new Date();
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    let interval: ReturnType<typeof setInterval> | null = null;

    // Set timeout to sync with the start of the next minute
    const syncTimeout = setTimeout(() => {
      setCurrentTime(Date.now());

      // Then update every 60 seconds
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 60000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(syncTimeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  // Navigate to previous day
  const handlePreviousDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  // Navigate to next day
  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  // Calculate day boundaries
  const dayStart = useMemo(
    () => startOfDay(selectedDate).getTime(),
    [selectedDate],
  );
  const dayEnd = useMemo(
    () => endOfDay(selectedDate).getTime(),
    [selectedDate],
  );

  const chartData = useMemo(() => {
    // Filter predictions for selected day only
    const dayPredictions = predictions.filter((p) => {
      const time = parseISO(p.time).getTime();
      return time >= dayStart && time <= dayEnd;
    });

    const data = dayPredictions.map((p) => ({
      time: parseISO(p.time).getTime(),
      depth: p.depth_m ? p.depth_m : undefined, // Keep depth in meters
      formattedTime: format(parseISO(p.time), "MM/dd HH:mm"),
    }));

    // Add extrema points to chart data for accurate plotting
    const extremaPoints = [
      ...rawHighs
        .filter((h) => {
          const time = parseISO(h.time).getTime();
          return time >= dayStart && time <= dayEnd;
        })
        .map((h) => ({
          time: parseISO(h.time).getTime(),
          depth: h.depth_m,
          formattedTime: format(parseISO(h.time), "MM/dd HH:mm"),
          isHigh: true,
        })),
      ...rawLows
        .filter((l) => {
          const time = parseISO(l.time).getTime();
          return time >= dayStart && time <= dayEnd;
        })
        .map((l) => ({
          time: parseISO(l.time).getTime(),
          depth: l.depth_m,
          formattedTime: format(parseISO(l.time), "MM/dd HH:mm"),
          isLow: true,
        })),
    ];

    // Merge and sort by time
    const allData = [...data, ...extremaPoints].sort((a, b) => a.time - b.time);

    console.log(
      "TideGraph chartData:",
      data.length,
      "prediction items,",
      extremaPoints.length,
      "extrema points for",
      format(selectedDate, "yyyy-MM-dd"),
    );
    return allData;
  }, [predictions, rawHighs, rawLows, selectedDate, dayStart, dayEnd]);

  const { minDepth, maxDepth } = useMemo(() => {
    const depths = predictions
      .map((p) => p.depth_m)
      .filter((d): d is number => d !== undefined);
    if (depths.length === 0) {
      return { minDepth: 0, maxDepth: 100 };
    }
    const min = Math.min(...depths);
    const max = Math.max(...depths);
    const padding = (max - min) * 0.1;
    return {
      minDepth: Math.floor(min - padding),
      maxDepth: Math.ceil(max + padding),
    };
  }, [predictions]);

  // Calculate sunrise and sunset times for the selected date
  const sunTimes = useMemo(() => {
    const times = SunCalc.getTimes(selectedDate, position.lat, position.lon);
    return {
      sunrise: times.sunrise.getTime(),
      sunset: times.sunset.getTime(),
    };
  }, [selectedDate, position.lat, position.lon]);

  // Calculate X-axis ticks, avoiding sunrise/sunset times
  const xAxisTicks = useMemo(() => {
    const standardTicks = [
      dayStart,
      dayStart + 1 * 60 * 60 * 1000,
      dayStart + 6 * 60 * 60 * 1000,
      dayStart + 12 * 60 * 60 * 1000,
      dayStart + 18 * 60 * 60 * 1000,
      dayEnd,
    ];

    return standardTicks;
  }, [dayStart, dayEnd]);

  // Convert API highs and lows to the format used by the chart
  const tideExtremes = useMemo(() => {
    // Filter highs and lows for selected day only
    const dayHighs = rawHighs
      .filter((h) => {
        const time = parseISO(h.time).getTime();
        return time >= dayStart && time <= dayEnd;
      })
      .map((h) => ({
        time: parseISO(h.time).getTime(),
        depth: h.depth_m,
      }));

    const dayLows = rawLows
      .filter((l) => {
        const time = parseISO(l.time).getTime();
        return time >= dayStart && time <= dayEnd;
      })
      .map((l) => ({
        time: parseISO(l.time).getTime(),
        depth: l.depth_m,
      }));

    return { highs: dayHighs, lows: dayLows };
  }, [rawHighs, rawLows, dayStart, dayEnd]);

  console.log("TideGraph render:", {
    predictions: predictions.length,
    loading,
    error,
    sunTimes,
    tideExtremes,
    rawHighs: rawHighs.length,
    rawLows: rawLows.length,
  });

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading tide data...</Typography>
      </Box>
    );
  }

  // Check if location has depth data (is in ocean)
  const hasDepth = predictions.some((p) => p.depth_m !== undefined);

  if (predictions.length === 0 || !hasDepth) {
    return (
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <Typography color="text.secondary" align="center">
          This location is on land.
          <br />
          Please center the map on the ocean.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "row", md: "column" },
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "flex-start", md: "center" },
          }}
        >
          <Typography variant="h6" sx={{ flexShrink: 0 }}>
            {locationName}
          </Typography>
          <MoonPhase
            date={selectedDate}
            lat={position.lat}
            lon={position.lon}
          />
        </Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{ flexShrink: 0 }}
        >
          <IconButton onClick={handlePreviousDay} size="small">
            <ChevronLeft />
          </IconButton>
          <Typography
            variant="body1"
            sx={{ minWidth: 120, textAlign: "center" }}
          >
            {format(selectedDate, "yyyy-MM-dd")}
          </Typography>
          <IconButton onClick={handleNextDay} size="small">
            <ChevronRight />
          </IconButton>
        </Stack>
      </Box>
      <Box
        sx={{
          flex: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {/* Sunrise icon and time */}
        <Box
          sx={{
            width: "100%",
            padding: "0px 28px 0 78px",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "40px",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                left: `calc(100% * ${(sunTimes.sunrise - dayStart) / (dayEnd - dayStart)})`,
                top: "0px",
                transform: "translateX(-50%)",
                zIndex: 10,
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Box sx={{ width: 14, height: 14, textAlign: "center" }}>
                <FontAwesomeIcon
                  icon={faSunrise}
                  style={{
                    color: theme.palette.warning.main,
                    fontSize: "14px",
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: "11px",
                  color: theme.palette.warning.main,
                  lineHeight: 1,
                }}
              >
                {format(new Date(sunTimes.sunrise), "HH:mm")}
              </Typography>
            </Box>
            {/* Sunset icon and time */}
            <Box
              sx={{
                position: "absolute",
                left: `calc(100% * ${(sunTimes.sunset - dayStart) / (dayEnd - dayStart)})`,
                top: "0px",
                transform: "translateX(-50%)",
                zIndex: 10,
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Box sx={{ width: 14, height: 14, textAlign: "center" }}>
                <FontAwesomeIcon
                  icon={faSunset}
                  style={{
                    color: theme.palette.warning.main,
                    fontSize: "14px",
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: "11px",
                  color: theme.palette.warning.main,
                  lineHeight: 1,
                }}
              >
                {format(new Date(sunTimes.sunset), "HH:mm")}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ flex: 1, width: "100%", minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              isAnimationActive={false}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.palette.divider}
              />
              {/* Background color for night/day based on theme mode */}
              {theme.palette.mode === "dark" ? (
                // Dark mode: Make daytime brighter
                <ReferenceArea
                  x1={sunTimes.sunrise}
                  x2={sunTimes.sunset}
                  fill="#ffffff"
                  fillOpacity={0.08}
                />
              ) : (
                // Light mode: Make nighttime gray
                <>
                  {/* Night before sunrise */}
                  <ReferenceArea
                    x1={dayStart}
                    x2={sunTimes.sunrise}
                    fill="#000000"
                    fillOpacity={0.05}
                  />
                  {/* Night after sunset */}
                  <ReferenceArea
                    x1={sunTimes.sunset}
                    x2={dayEnd}
                    fill="#000000"
                    fillOpacity={0.05}
                  />
                </>
              )}
              <XAxis
                dataKey="time"
                type="number"
                domain={[dayStart, dayEnd]}
                tickFormatter={(timestamp) =>
                  format(new Date(timestamp), "HH:mm")
                }
                stroke={theme.palette.text.secondary}
                ticks={xAxisTicks}
                style={{
                  fontSize: "0.75rem",
                }}
              />
              <YAxis
                domain={[minDepth, maxDepth]}
                label={{
                  value: "Depth (m)",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    fill: theme.palette.text.secondary,
                    fontSize: "0.875rem",
                  },
                }}
                stroke={theme.palette.text.secondary}
                style={{
                  fontSize: "0.75rem",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                }}
                labelFormatter={(timestamp) =>
                  format(new Date(timestamp as number), "yyyy/MM/dd HH:mm")
                }
                formatter={(value: number) => [
                  `${value.toFixed(1)} m`,
                  "Depth",
                ]}
              />
              {/* Sunrise line */}
              <ReferenceLine
                x={sunTimes.sunrise}
                stroke={theme.palette.warning.main}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {/* Sunset line */}
              <ReferenceLine
                x={sunTimes.sunset}
                stroke={theme.palette.warning.main}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {/* Current time vertical line */}
              <ReferenceLine x={currentTime} stroke="#ff1744" strokeWidth={2} />
              <Line
                type="monotone"
                dataKey="depth"
                stroke="#00bcd4"
                strokeWidth={3}
                dot={({ cx, cy, payload }) => {
                  const { time, isHigh, isLow } = payload;

                  // Show red dot at current time
                  if (Math.abs(time - currentTime) < 900000) {
                    // Within 15 minutes
                    return (
                      <circle
                        key={time}
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#ff1744"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    );
                  }

                  // Check if this is a high tide
                  if (isHigh) {
                    return (
                      <g key={time}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={theme.palette.info.main}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                        <text
                          x={cx}
                          y={cy - 10}
                          textAnchor="middle"
                          fill={theme.palette.info.main}
                          fontSize={11}
                          fontWeight="bold"
                        >
                          H {format(new Date(time), "HH:mm")}
                        </text>
                      </g>
                    );
                  }

                  // Check if this is a low tide
                  if (isLow) {
                    return (
                      <g key={time}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={theme.palette.warning.main}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                        <text
                          x={cx}
                          y={cy + 20}
                          textAnchor="middle"
                          fill={theme.palette.warning.main}
                          fontSize={11}
                          fontWeight="bold"
                        >
                          L {format(new Date(time), "HH:mm")}
                        </text>
                      </g>
                    );
                  }

                  return <Fragment key={time}></Fragment>;
                }}
                activeDot={{ r: 6 }}
              />
              {/* High tide vertical lines */}
              {tideExtremes.highs.map((high) => (
                <ReferenceLine
                  key={`high-${high.time}`}
                  x={high.time}
                  stroke={theme.palette.info.main}
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />
              ))}
              {/* Low tide vertical lines */}
              {tideExtremes.lows.map((low) => (
                <ReferenceLine
                  key={`low-${low.time}`}
                  x={low.time}
                  stroke={theme.palette.warning.main}
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          mt: 1,
          display: "flex",
          gap: 1,
          flexDirection: "row",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Water depth below surface
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Data provided by FES tidal model
        </Typography>
      </Box>
    </Box>
  );
}
