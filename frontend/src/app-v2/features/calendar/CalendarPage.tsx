import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  useCalendarEventsQuery,
  useCreateCalendarEventMutation,
} from "./calendar.queries";

import type { CalendarEvent, EventStatus } from "./calendar.types";

type AddEventForm = { title: string; time: string; status: EventStatus; notes: string };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const CAMPAIGN_COLORS = [
  "#e53935", "#1976d2", "#43a047", "#f57c00", "#8e24aa", "#00897b", "#d81b60", "#6d4c41",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function campaignColor(campaignId: number): string {
  return CAMPAIGN_COLORS[campaignId % CAMPAIGN_COLORS.length];
}

function isDateInMonth(dateKeyStr: string, year: number, month: number): boolean {
  const [y, m] = dateKeyStr.split("-").map(Number);
  return y === year && m === month + 1;
}

export function CalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const { data: events = {}, isLoading } = useCalendarEventsQuery();
  const createMutation = useCreateCalendarEventMutation();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AddEventForm>({
    title: "",
    time: "09:00",
    status: "Draft",
    notes: "",
  });

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const weeks = useMemo(() => {
    const cells: Array<number | null> = [];
    for (let i = 0; i < firstDay; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: Array<Array<number | null>> = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [daysInMonth, firstDay]);

  const monthLegend = useMemo(() => {
    const campaigns = new Map<number, string>();
    let hasStandalone = false;

    for (const [key, dayEvents] of Object.entries(events)) {
      if (!isDateInMonth(key, viewYear, viewMonth)) continue;
      for (const event of dayEvents) {
        if (event.isStandalone) {
          hasStandalone = true;
        } else if (event.campaignId != null) {
          campaigns.set(event.campaignId, event.campaignName ?? `Campaign ${event.campaignId}`);
        }
      }
    }

    return { campaigns: Array.from(campaigns.entries()), hasStandalone };
  }, [events, viewYear, viewMonth]);

  const showLegend = monthLegend.campaigns.length > 0 || monthLegend.hasStandalone;

  const openModal = (day: number) => {
    setSelectedDate(dateKey(viewYear, viewMonth, day));
    setForm({ title: "", time: "09:00", status: "Draft", notes: "" });
    setModalOpen(true);
  };

  const submitEvent = () => {
    if (!selectedDate || !form.title.trim()) return;
    createMutation.mutate(
      { dateKey: selectedDate, event: form },
      { onSuccess: () => setModalOpen(false) }
    );
  };

  const renderChip = (event: CalendarEvent, index: number) => {
    const label = event.campaignName ?? "Standalone";
    const tooltip = `${label} · ${event.time} · ${event.status}`;

    const chip = (
      <Chip
        key={`${event.id}-${index}`}
        size="small"
        label={event.title}
        sx={
          !event.isStandalone && event.campaignId != null
            ? {
                bgcolor: alpha(campaignColor(event.campaignId), 0.15),
                color: campaignColor(event.campaignId),
                borderColor: alpha(campaignColor(event.campaignId), 0.35),
                cursor: "default",
              }
            : { cursor: "default" }
        }
        variant={event.isStandalone ? "filled" : "outlined"}
      />
    );

    return (
      <Tooltip key={`${event.id}-${index}`} title={tooltip} arrow placement="top">
        <Box component="span" sx={{ display: "block" }}>
          {chip}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Content Calendar</Typography>
        <Typography variant="body2" color="text.secondary">
          Click any day to manage scheduled content
        </Typography>
      </Box>

      <Paper sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Button
            variant="outlined"
            onClick={() =>
              viewMonth === 0
                ? (setViewMonth(11), setViewYear((y) => y - 1))
                : setViewMonth((m) => m - 1)
            }
          >
            Prev
          </Button>
          <Typography variant="h6">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Typography>
          <Button
            variant="outlined"
            onClick={() =>
              viewMonth === 11
                ? (setViewMonth(0), setViewYear((y) => y + 1))
                : setViewMonth((m) => m + 1)
            }
          >
            Next
          </Button>
        </Stack>

        {showLegend ? (
          <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
            useFlexGap
            sx={{ mb: 2, alignItems: "center" }}
          >
            {monthLegend.campaigns.map(([id, name]) => (
              <Stack key={id} direction="row" spacing={0.75} alignItems="center">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: campaignColor(id),
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {name}
                </Typography>
              </Stack>
            ))}
            {monthLegend.hasStandalone ? (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  —
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Standalone
                </Typography>
              </Stack>
            ) : null}
          </Stack>
        ) : null}

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 1 }}>
          {DAYS.map((day) => (
            <Box key={day}>
              <Typography variant="caption" color="text.secondary">
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <Typography color="text.secondary">Loading calendar...</Typography>
          </Box>
        ) : (
          weeks.map((week, weekIndex) => (
            <Box
              key={`w-${weekIndex}`}
              sx={{
                mt: 0.5,
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: 1,
              }}
            >
              {week.map((day, dayIndex) => {
                const key = day ? dateKey(viewYear, viewMonth, day) : "";
                const dayEvents = day ? events[key] || [] : [];
                return (
                  <Box key={`d-${weekIndex}-${dayIndex}`}>
                    <Paper
                      sx={{
                        p: 1,
                        minHeight: 92,
                        border: "1px solid",
                        borderColor: "divider",
                        opacity: day ? 1 : 0.45,
                        cursor: day ? "pointer" : "default",
                        bgcolor: "background.paper",
                      }}
                      onClick={() => day && openModal(day)}
                    >
                      <Typography variant="caption">{day ?? ""}</Typography>
                      <Stack spacing={0.5} mt={0.5}>
                        {dayEvents.slice(0, 5).map((event, index) => renderChip(event, index))}
                      </Stack>
                    </Paper>
                  </Box>
                );
              })}
            </Box>
          ))
        )}
      </Paper>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedDate || "Add event"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                type="time"
                label="Time"
                value={form.time}
                onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                fullWidth
              />
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value as EventStatus }))
                }
                fullWidth
              >
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Scheduled">Scheduled</MenuItem>
                <MenuItem value="Published">Published</MenuItem>
              </TextField>
            </Stack>
            <TextField
              multiline
              minRows={3}
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} disabled={createMutation.isPending}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={submitEvent}
            disabled={createMutation.isPending || !form.title.trim()}
          >
            {createMutation.isPending ? "Saving..." : "Add event"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
