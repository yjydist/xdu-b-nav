import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';

function LocationSelect({
  label,
  icon,
  value,
  onChange,
  options,
  disabled,
  labelId,
  inputId,
  autoComplete,
}) {
  return (
    <Box
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: '10px',
        bgcolor: '#F5F0E8',
        border: '2px solid #1F2937',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '8px',
            bgcolor: '#FFFFFF',
            color: '#6366F1',
            display: 'grid',
            placeItems: 'center',
            border: '2px solid #1F2937',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h4">{label}</Typography>
        </Box>
      </Stack>

      <FormControl fullWidth>
        <InputLabel id={labelId}>{label}</InputLabel>
        <Select
          labelId={labelId}
          id={inputId}
          name={inputId}
          value={value}
          label={label}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
        >
          {options.flatMap((group) =>
            group.items.map((item) => (
              <MenuItem key={item.name || item} value={item.name || item}>
                {item.name || item}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
    </Box>
  );
}

export default LocationSelect;
