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
import type { TidePrediction } from "../types";

interface TideGraphProps {
  predictions: TidePrediction[];
  loading?: boolean;
  error?: string | null;
  onDateChange?: (date: Date) => void;
}

export function TideGraph({
  predictions: rawPredictions,
  loading,
  error,
  onDateChange,
}: TideGraphProps) {
  const theme = useTheme();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const predictions = rawPredictions;

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
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
      height: p.height_m * 100, // Convert meters to centimeters
      formattedTime: format(parseISO(p.time), "MM/dd HH:mm"),
    }));
    console.log(
      "TideGraph chartData:",
      data.length,
      "items for",
      format(selectedDate, "yyyy-MM-dd"),
    );
    return data;
  }, [predictions, selectedDate, dayStart, dayEnd]);

  const { minHeight, maxHeight } = useMemo(() => {
    if (predictions.length === 0) {
      return { minHeight: -200, maxHeight: 200 };
    }
    const heights = predictions.map((p) => p.height_m * 100); // Convert to cm
    const min = Math.min(...heights);
    const max = Math.max(...heights);
    const padding = (max - min) * 0.1;
    const result = {
      minHeight: Math.floor(min - padding),
      maxHeight: Math.ceil(max + padding),
    };
    console.log("Height range:", result, "from", { min, max });
    return result;
  }, [predictions]);

  console.log("TideGraph render:", {
    predictions: predictions.length,
    loading,
    error,
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

  if (predictions.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">
          Click on the map to view tide predictions for a location
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{ p: 2, display: "flex", flexDirection: "column", height: "100vh" }}
    >
      <Typography variant="h6" gutterBottom>
        Tide Predictions
      </Typography>

      {/* Date navigation */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <IconButton onClick={handlePreviousDay} size="small">
          <ChevronLeft />
        </IconButton>
        <Typography variant="body1" sx={{ minWidth: 120, textAlign: "center" }}>
          {format(selectedDate, "yyyy-MM-dd")}
        </Typography>
        <IconButton onClick={handleNextDay} size="small">
          <ChevronRight />
        </IconButton>
      </Stack>
      <Box sx={{ flex: 1, width: "100%", minHeight: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
            />
            <XAxis
              dataKey="time"
              type="number"
              domain={[dayStart, dayEnd]}
              tickFormatter={(timestamp) =>
                format(new Date(timestamp), "HH:mm")
              }
              stroke={theme.palette.text.secondary}
              ticks={[
                dayStart,
                dayStart + 6 * 60 * 60 * 1000,
                dayStart + 12 * 60 * 60 * 1000,
                dayStart + 18 * 60 * 60 * 1000,
                dayEnd,
              ]}
              style={{
                fontSize: "0.75rem",
              }}
            />
            <YAxis
              domain={[minHeight, maxHeight]}
              label={{
                value: "Height (cm)",
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
                `${value.toFixed(0)} cm`,
                "Height",
              ]}
            />
            <ReferenceLine
              y={0}
              stroke={theme.palette.text.disabled}
              strokeDasharray="3 3"
            />
            {/* Current time vertical line */}
            <ReferenceLine
              x={currentTime}
              stroke="#ff1744"
              strokeWidth={2}
              label={{
                value: "Now",
                position: "top",
                fill: "#ff1744",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="height"
              stroke="#2196f3"
              strokeWidth={3}
              dot={({ cx, cy, payload }) => {
                const { time } = payload;
                // Show pink dot at current time
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
                return <Fragment key={time}></Fragment>;
              }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      <Typography variant="caption" color="text.secondary" gutterBottom>
        Height relative to Mean Sea Level (MSL)
      </Typography>
    </Box>
  );
}
