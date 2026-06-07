import { MenuItem, TextField } from "@mui/material";
import {
  ENTITY_SORT_OPTIONS,
  type EntitySortOption,
} from "../lib/entityListSort";

interface EntitySortSelectProps {
  value: EntitySortOption;
  onChange: (value: EntitySortOption) => void;
}

export function EntitySortSelect({ value, onChange }: EntitySortSelectProps) {
  return (
    <TextField
      size="small"
      select
      label="Sort by"
      value={value}
      onChange={(event) => onChange(event.target.value as EntitySortOption)}
      sx={{ minWidth: 200 }}
    >
      {ENTITY_SORT_OPTIONS.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
