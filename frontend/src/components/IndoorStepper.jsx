import { Box, Chip, Divider, Stack, Step, StepContent, StepLabel, Stepper, Typography } from '@mui/material';
import {
  ArrowForward,
  DirectionsWalk,
  DoorFront,
  Stairs,
} from '@mui/icons-material';

const getStepIcon = (action) => {
  if (action.includes('进入') || action.includes('出')) return DoorFront;
  if (action.includes('上楼')) return Stairs;
  if (action.includes('下楼')) return Stairs;
  if (action.includes('直行') || action.includes('移动')) return ArrowForward;
  return DirectionsWalk;
};

function IndoorStepper({ indoor, path }) {
  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h3" sx={{ color: '#1F2937' }}>
          室内导航
        </Typography>
      </Box>

      <Stepper orientation="vertical">
        {indoor.map((step, index) => {
          const StepIcon = getStepIcon(step.action);
          return (
            <Step key={index} active>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: '#6366F1',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #1F2937',
                    }}
                  >
                    <StepIcon fontSize="small" />
                  </Box>
                )}
              >
                <Typography variant="body1" fontWeight={700} sx={{ color: '#1F2937' }}>
                  {step.action}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  {step.description}
                </Typography>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>

      {path && path.length > 0 && (
        <>
          <Divider />
          <Box>
            <Typography variant="h5" sx={{ mb: 1.25, color: '#1F2937' }}>
              完整经过节点
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {path.map((node, index) => (
                <Chip
                  key={index}
                  label={`${index + 1}. ${node}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        </>
      )}
    </Stack>
  );
}

export default IndoorStepper;
