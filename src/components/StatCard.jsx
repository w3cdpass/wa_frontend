import { Card, Box, Typography, Stack } from '@mui/material';

export default function StatCard({ label, value, icon: Icon, tint = '#0F7B6C', suffix }) {
  return (
    <Card sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
            {value}
            {suffix && <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>{suffix}</Typography>}
          </Typography>
        </Box>
        {Icon && (
          <Box sx={{
            width: 42, height: 42, borderRadius: 2.5, display: 'flex', alignItems: 'center',
            justifyContent: 'center', bgcolor: `${tint}18`, color: tint,
          }}>
            <Icon fontSize="small" />
          </Box>
        )}
      </Stack>
    </Card>
  );
}
