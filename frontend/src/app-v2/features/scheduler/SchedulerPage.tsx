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
  Typography,
} from "@mui/material";

import {
  useSchedulerEventsQuery,
  useCreateSchedulerEventMutation,
  useUpdateSchedulerEventMutation,
  useDeleteSchedulerEventMutation,
} from "./scheduler.queries";

import type { EventStatus } from "./scheduler.types";

type EventItem = { id?: number | string, title: string; time: string; status: EventStatus; notes: string; color?: string };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const COLORS = ["#e53935", "#1976d2", "#43a047", "#f57c00", "#8e24aa", "#00897b", "#d81b60", "#6d4c41"];

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return (new Date(year, month, 1).getDay() + 6) % 7; }
function dateKey(y: number, m: number, d: number) { return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; }

export function SchedulerPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  
  const { data: events = {}, isLoading } = useSchedulerEventsQuery();
  const createMutation = useCreateSchedulerEventMutation();
  const updateMutation = useUpdateSchedulerEventMutation();
  const deleteMutation = useDeleteSchedulerEventMutation();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState<EventItem>({ title: "", time: "09:00", status: "Draft", notes: "", color: COLORS[0] });

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

  const openModal = (day: number) => {
    setSelectedDate(dateKey(viewYear, viewMonth, day));
    setForm({ title: "", time: "09:00", status: "Draft", notes: "", color: COLORS[0] });
    setIsEditMode(false);
    setModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, key: string, event: EventItem) => {
    e.stopPropagation();
    setSelectedDate(key);
    setForm(event);
    setIsEditMode(true);
    setModalOpen(true);
  };

  const submitEvent = () => {
    if (!selectedDate || !form.title.trim()) return;
    
    if (isEditMode && form.id) {
       updateMutation.mutate(
         { dateKey: selectedDate, event: form },
         { onSuccess: () => setModalOpen(false) }
       );
    } else {
       createMutation.mutate(
         { dateKey: selectedDate, event: form },
         { onSuccess: () => setModalOpen(false) }
       );
    }
  };

  const deleteEvent = () => {
    if (isEditMode && form.id) {
       deleteMutation.mutate(form.id, { onSuccess: () => setModalOpen(false) });
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" >Content Calendar</Typography>
        <Typography variant="body2" color="text.secondary">Click any day to manage scheduled content</Typography>
      </Box>

      <Paper sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Button variant="outlined" onClick={() => (viewMonth === 0 ? (setViewMonth(11), setViewYear((y) => y - 1)) : setViewMonth((m) => m - 1))}>Prev</Button>
          <Typography variant="h6" >{MONTH_NAMES[viewMonth]} {viewYear}</Typography>
          <Button variant="outlined" onClick={() => (viewMonth === 11 ? (setViewMonth(0), setViewYear((y) => y + 1)) : setViewMonth((m) => m + 1))}>Next</Button>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 1 }}>
          {DAYS.map((day) => (
            <Box key={day}>
              <Typography variant="caption" color="text.secondary">{day}</Typography>
            </Box>
          ))}
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <Typography color="text.secondary">Loading calendar...</Typography>
          </Box>
        ) : (
          weeks.map((week, weekIndex) => (
            <Box key={`w-${weekIndex}`} sx={{ mt: 0.5, display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 1 }}>
              {week.map((day, dayIndex) => {
                const key = day ? dateKey(viewYear, viewMonth, day) : "";
              const dayEvents = day ? (events[key] || []) : [];
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
                      {dayEvents.slice(0, 5).map((event, index) => (
                        <Chip 
                          key={`${event.title}-${index}`} 
                          size="small" 
                          label={event.title} 
                          onClick={(e) => openEditModal(e, key, event as EventItem)}
                     
                        />
                      ))}
                    </Stack>
                  </Paper>
                </Box>
              );
            })}
          </Box>
        )))}
      </Paper>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedDate || "Add event"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
            <Stack direction="row" spacing={2}>
              <TextField type="time" label="Time" value={form.time} onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))} fullWidth />
              <TextField select label="Status" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as EventStatus }))} fullWidth>
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Review">Review</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Scheduled">Scheduled</MenuItem>
                <MenuItem value="Published">Published</MenuItem>
                <MenuItem value="Archived">Archived</MenuItem>
              </TextField>
            </Stack>
            <TextField multiline minRows={3} label="Notes" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
        
          </Stack>
        </DialogContent>
        <DialogActions>
          {isEditMode && (
             <Button color="error" onClick={deleteEvent} disabled={deleteMutation.isPending} sx={{ mr: "auto" }}>
               {deleteMutation.isPending ? "Deleting..." : "Delete"}
             </Button>
          )}
          <Button onClick={() => setModalOpen(false)} disabled={createMutation.isPending || updateMutation.isPending}>Close</Button>
          <Button variant="contained" onClick={submitEvent} disabled={createMutation.isPending || updateMutation.isPending || !form.title.trim()}>
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : isEditMode ? "Save Changes" : "Add event"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
