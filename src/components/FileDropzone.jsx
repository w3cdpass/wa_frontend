import { useRef, useState } from 'react';
import { Box, Typography, Stack, IconButton, LinearProgress } from '@mui/material';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

/**
 * Generic drag & drop uploader.
 * props:
 *  - accept: string for input[accept] e.g. ".csv,.xlsx,.pdf"
 *  - maxSizeMb: number
 *  - file: currently selected File | null
 *  - onFileSelected: (file) => void
 *  - onError: (message) => void
 *  - label / helperText
 *  - uploading: bool (shows indeterminate progress)
 */
export default function FileDropzone({
  accept, maxSizeMb, file, onFileSelected, onError, label, helperText, uploading, compact,
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const validateAndSet = (selected) => {
    if (!selected) return;
    if (maxSizeMb && selected.size > maxSizeMb * 1024 * 1024) {
      onError?.(`"${selected.name}" exceeds the ${maxSizeMb}MB limit.`);
      return;
    }
    onFileSelected(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSet(e.dataTransfer.files?.[0]);
  };

  return (
    <Box>
      <Box
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        sx={{
          border: '1.5px dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          bgcolor: dragOver ? 'rgba(15,123,108,0.05)' : 'background.paper',
          borderRadius: 2,
          p: compact ? 1.5 : 3,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => validateAndSet(e.target.files?.[0])}
        />

        {!file ? (
          <Stack direction={compact ? 'row' : 'column'} alignItems="center" justifyContent="center" spacing={compact ? 1 : 0.5}>
            <CloudUploadRoundedIcon sx={{ fontSize: compact ? 20 : 30, color: 'text.secondary' }} />
            <Stack alignItems={compact ? 'flex-start' : 'center'} spacing={0.25}>
              <Typography variant={compact ? 'caption' : 'body2'} fontWeight={600}>
                {label || 'Drag & drop a file, or click to browse'}
              </Typography>
              {helperText && (
                <Typography variant="caption" color="text.secondary">{helperText}</Typography>
              )}
            </Stack>
          </Stack>
        ) : (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
            <InsertDriveFileRoundedIcon color="primary" />
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" fontWeight={600}>{file.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onFileSelected(null); }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}
      </Box>
      {uploading && <LinearProgress sx={{ mt: 1, borderRadius: 4 }} />}
    </Box>
  );
}
