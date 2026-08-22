import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Grid, Card, Typography, TextField, Button, Stack, Chip, ToggleButtonGroup,
  ToggleButton, Alert, Divider, LinearProgress, InputAdornment, Paper,
} from '@mui/material';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import TextSnippetRoundedIcon from '@mui/icons-material/TextSnippetRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import FileDropzone from '../components/FileDropzone';
import ScheduleModal from '../components/ScheduleModal';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import dayjs from 'dayjs';

const MEDIA_LIMITS = {
  none: { label: 'No media', maxMb: 0, accept: '' },
  image: { label: 'Image', maxMb: 5, accept: '.jpg,.jpeg,.png,.webp' },
  video: { label: 'Video', maxMb: 30, accept: '.mp4,.mov' },
  pdf: { label: 'PDF', maxMb: 5, accept: '.pdf' },
};

const STEPS = [
  { icon: GroupAddRoundedIcon, title: 'Import recipients' },
  { icon: TextSnippetRoundedIcon, title: 'Write message' },
  { icon: ImageRoundedIcon, title: 'Attach media' },
];

export default function SendViaWA() {
  const location = useLocation();
  const prefill = location.state?.prefill;
  const resendFailed = location.state?.resendFailed;

  const [contactFile, setContactFile] = useState(null);
  const [contactCount, setContactCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);

  const [broadcastName, setBroadcastName] = useState(prefill?.name || '');
  const [message, setMessage] = useState(prefill?.message || '');
  const [mediaType, setMediaType] = useState(prefill?.mediaType || 'none');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(prefill?.mediaUrl || '');

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const parseContactFile = (file) => {
    setFileError('');
    setContactFile(file);
    setImportSummary(null);
    setParsedRows([]);

    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setContactCount(results.data.length);
          setParsedRows(results.data);
        },
        error: () => setFileError('Could not read that CSV file.'),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'binary' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet);
          setContactCount(rows.length);
          setParsedRows(rows);
        } catch {
          setFileError('Could not read that Excel file.');
        }
      };
      reader.readAsBinaryString(file);
    } else if (ext === 'pdf') {
      setContactCount(null);
      setParsedRows([]);
    }
  };

  const handleSaveContacts = async () => {
    if (!contactFile || parsedRows.length === 0) return;
    setImporting(true);
    try {
      const ext = contactFile.name.split('.').pop().toLowerCase();
      const result = await api.bulkImportContacts(parsedRows, ext);
      setImportSummary(result);
      setContactCount(result.imported);
      showToast(`Imported ${result.imported} contacts`, 'success');
    } catch (err) {
      showToast(err.message || 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleMediaUpload = async (file) => {
    if (!file) return;
    setUploadingMedia(true);
    try {
      const presignRes = await api.presignUpload({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      setMediaUrl(presignRes.fileUrl);

      await fetch(presignRes.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      await api.confirmUpload({
        fileName: file.name,
        fileUrl: presignRes.fileUrl,
        fileType: file.type,
        fileSize: file.size,
      });

      showToast('Media uploaded', 'success');
    } catch (err) {
      showToast(err.message || 'Media upload failed', 'error');
    } finally {
      setUploadingMedia(false);
    }
  };

  const resetForm = () => {
    setContactFile(null);
    setContactCount(0);
    setImportSummary(null);
    setParsedRows([]);
    setBroadcastName('');
    setMessage('');
    setMediaType('none');
    setMediaFile(null);
    setMediaUrl('');
  };

  const buildPayload = (extra = {}) => ({
    name: broadcastName,
    message,
    mediaType,
    mediaUrl,
    mediaName: mediaFile?.name || null,
    totalContacts: importSummary?.imported ?? contactCount ?? 0,
    ...extra,
  });

  const validate = () => {
    if (!broadcastName.trim()) return 'Give this broadcast a name.';
    if (!message.trim()) return 'Write a message to send.';
    if (!importSummary && !(contactCount > 0)) return 'Import and save a contact list first.';
    return null;
  };

  const handleSubmit = async (extra, successMsg) => {
    const error = validate();
    if (error) {
      showToast(error, 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.createCampaign(buildPayload(extra));
      showToast(successMsg, 'success');
      resetForm();
      navigate('/wa-history');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendNow = () => handleSubmit({}, 'Campaign is now processing.');
  const handleSaveDraft = () => handleSubmit({ saveAsDraft: true }, 'Saved as draft.');
  const handleScheduleConfirm = (scheduledAt) => {
    setScheduleOpen(false);
    handleSubmit({ scheduledAt }, `Scheduled for ${dayjs(scheduledAt).format('D MMM YYYY, h:mm A')}`);
  };

  const activeLimit = MEDIA_LIMITS[mediaType];

  const handleMediaFileSelect = (file) => {
    if (file) {
      setMediaFile(file);
      handleMediaUpload(file);
    } else {
      setMediaFile(null);
      setMediaUrl('');
    }
  };

  useEffect(() => {
    if (prefill) {
      setMediaType(prefill.mediaType || 'none');
      setMediaUrl(prefill.mediaUrl || '');
    }
  }, [prefill]);

  const recipientCount = importSummary ? importSummary.imported : (contactCount || 0);
  const estimatedCost = (recipientCount * 0.5).toLocaleString('en-IN');

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Send via WA</Typography>
          <Typography variant="body2" color="text.secondary">
            Build a broadcast — import contacts, write your message, attach media, and send.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<SaveRoundedIcon />} disabled={submitting} onClick={handleSaveDraft}>
            Draft
          </Button>
          <Button variant="contained" startIcon={<SendRoundedIcon />} disabled={submitting} onClick={handleSendNow}>
            Send now
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Stack spacing={2.5}>
            {/* Step 1: Import contacts */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <StepBadge n={1} />
                <GroupAddRoundedIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={800}>Import recipients</Typography>
                {importSummary && (
                  <Chip size="small" color="success" label={`${importSummary.imported} saved`} icon={<CheckCircleRoundedIcon />} sx={{ ml: 'auto' }} />
                )}
              </Stack>

              <FileDropzone
                accept=".csv,.xlsx,.xls,.pdf"
                file={contactFile}
                onFileSelected={(f) => (f ? parseContactFile(f) : (setContactFile(null), setContactCount(0), setImportSummary(null), setParsedRows([])))}
                onError={setFileError}
                label="Drop CSV, Excel, or PDF"
                helperText="Columns expected: name, phone"
                compact
              />
              {fileError && <Alert severity="error" sx={{ mt: 1.5 }}>{fileError}</Alert>}

              {contactFile && !importSummary && (
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {contactCount !== null ? `${contactCount} rows detected` : 'Ready to import'}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={importing || parsedRows.length === 0}
                    onClick={handleSaveContacts}
                  >
                    {importing ? 'Saving…' : 'Save contacts'}
                  </Button>
                </Stack>
              )}
              {importing && <LinearProgress sx={{ mt: 1.5, borderRadius: 4 }} />}

              {importSummary && (
                <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}>
                  <Chip color="success" label={`${importSummary.imported} imported`} size="small" />
                  {importSummary.duplicates > 0 && <Chip color="warning" label={`${importSummary.duplicates} duplicates skipped`} size="small" />}
                  {importSummary.invalid > 0 && <Chip color="error" label={`${importSummary.invalid} invalid`} size="small" />}
                </Stack>
              )}
            </Card>

            {/* Step 2: Message */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <StepBadge n={2} />
                <TextSnippetRoundedIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={800}>Write message</Typography>
              </Stack>
              <Stack spacing={2}>
                <TextField
                  label="Broadcast name"
                  placeholder="e.g. Weekend Flash Sale"
                  value={broadcastName}
                  onChange={(e) => setBroadcastName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Message"
                  placeholder="Type your WhatsApp message…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  fullWidth
                  multiline
                  minRows={4}
                  helperText={`${message.length} characters`}
                />
              </Stack>
            </Card>

            {/* Step 3: Media */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <StepBadge n={3} />
                <ImageRoundedIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={800}>Attach media (optional)</Typography>
                {mediaUrl && !uploadingMedia && (
                  <Chip size="small" color="success" label="Attached" icon={<CheckCircleRoundedIcon />} sx={{ ml: 'auto' }} />
                )}
              </Stack>

              <ToggleButtonGroup
                exclusive
                value={mediaType}
                onChange={(e, val) => { if (val) { setMediaType(val); setMediaFile(null); setMediaUrl(''); } }}
                sx={{ mb: 2, flexWrap: 'wrap' }}
                size="small"
              >
                <ToggleButton value="none">None</ToggleButton>
                <ToggleButton value="image"><ImageRoundedIcon fontSize="small" sx={{ mr: 0.5 }} />Image · 5MB</ToggleButton>
                <ToggleButton value="video"><VideocamRoundedIcon fontSize="small" sx={{ mr: 0.5 }} />Video · 30MB</ToggleButton>
                <ToggleButton value="pdf"><PictureAsPdfRoundedIcon fontSize="small" sx={{ mr: 0.5 }} />PDF · 5MB</ToggleButton>
              </ToggleButtonGroup>

              {mediaType !== 'none' && (
                <FileDropzone
                  accept={activeLimit.accept}
                  maxSizeMb={activeLimit.maxMb}
                  file={mediaFile}
                  onFileSelected={handleMediaFileSelect}
                  onError={(msg) => showToast(msg, 'error')}
                  label={`Drop ${activeLimit.label.toLowerCase()} here`}
                  helperText={`Max ${activeLimit.maxMb}MB`}
                  uploading={uploadingMedia}
                  compact
                />
              )}
            </Card>

            {/* Notes */}
            <Stack spacing={1.5}>
              <Alert severity="warning" icon={<WarningAmberRoundedIcon />} sx={{ borderRadius: 2 }}>
                <strong>Attention:</strong> Sending multiple images/media on WhatsApp is facing issues on
                some mobile phones. Kindly make demo before sending campaign once.
              </Alert>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <strong>Note:</strong> All campaigns are processed between 10:00 AM to 6:00 PM on working
                days. If you send any spam, abusive, or personal messages, your credit will be suspended.
              </Alert>
            </Stack>
          </Stack>
        </Grid>

        {/* Summary / actions panel */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 88 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>Broadcast summary</Typography>
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <Row label="Broadcast name" value={broadcastName || '—'} />
              <Row label="Recipients" value={recipientCount || 0} />
              <Row label="Media" value={mediaType === 'none' ? 'None' : (mediaUrl ? (mediaFile?.name || 'uploaded') : `${MEDIA_LIMITS[mediaType].label} (not attached)`)} />
              <Row label="Estimated cost" value={`${estimatedCost} credits`} />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.25}>
              <Button
                fullWidth
                size="large"
                variant="contained"
                startIcon={<SendRoundedIcon />}
                disabled={submitting}
                onClick={handleSendNow}
              >
                Send now
              </Button>
              <Button
                fullWidth
                size="large"
                variant="outlined"
                startIcon={<EventRepeatRoundedIcon />}
                disabled={submitting}
                onClick={() => setScheduleOpen(true)}
              >
                Schedule for later
              </Button>
              <Button
                fullWidth
                size="large"
                color="inherit"
                startIcon={<SaveRoundedIcon />}
                disabled={submitting}
                onClick={handleSaveDraft}
              >
                Save as draft
              </Button>
            </Stack>

            <Paper sx={{ mt: 2.5, p: 2, borderRadius: 2, bgcolor: 'rgba(15,123,108,0.06)', border: '1px solid rgba(15,123,108,0.15)' }}>
              <Typography variant="caption" color="text.secondary">
                Ready to send? Your campaign enters the queue and processes within the active window.
              </Typography>
            </Paper>
          </Card>
        </Grid>
      </Grid>

      <ScheduleModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onConfirm={handleScheduleConfirm}
      />
    </Box>
  );
}

function StepBadge({ n }) {
  return (
    <Box sx={{
      width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', bgcolor: 'primary.main', color: 'common.white', fontSize: 13, fontWeight: 800, flexShrink: 0,
    }}>
      {n}
    </Box>
  );
}

function Row({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700} sx={{ maxWidth: 200, textAlign: 'right' }} noWrap>{value}</Typography>
    </Stack>
  );
}