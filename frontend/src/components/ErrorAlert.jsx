import { Alert } from '@mui/material';

function ErrorAlert({ message, onClose }) {
  return (
    <Alert
      severity="error"
      sx={{
        borderRadius: '10px',
        border: '2px solid #EF4444',
        bgcolor: '#FEE2E2',
        color: '#991B1B',
        fontWeight: 500,
      }}
      onClose={onClose}
    >
      {message}
    </Alert>
  );
}

export default ErrorAlert;
