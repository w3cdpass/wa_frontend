import { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Stack, TextField, Button, Table, TableHead, TableRow,
  TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, InputAdornment, LinearProgress, Chip, Tabs, Tab, Alert, MenuItem,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import FileDropzone from '../components/FileDropzone';
import StatusChip from '../components/StatusChip';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import dayjs from 'dayjs';

export default function ManageUsers() {
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groups, setGroups] = useState([]);

  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState('');

  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);

  const { showToast } = useToast();

  const loadContacts = async () => {
    setLoading(true);
    try {
      const res = await api.listContacts({ search, limit: 100 });
      setRows(res.contacts || res);
    } catch (err) {
      showToast(err.message || 'Failed to load contacts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await api.listGroups({ limit: 100 });
      setGroups(res.groups || res);
    } catch (err) {
      console.error('Failed to load groups', err);
    }
  };

  useEffect(() => {
    loadContacts();
    loadGroups();
  }, [search]);

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) {
      showToast('Name and phone number are required', 'error');
      return;
    }
    try {
      await api.createContact({ name, phoneNumber: phone, groupId: group || null });
      showToast('Contact added', 'success');
      setAddOpen(false);
      setName(''); setPhone(''); setGroup('');
      loadContacts();
    } catch (err) {
      showToast(err.message || 'Failed to add contact', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteContact(id);
      showToast('Contact removed', 'success');
      loadContacts();
    } catch (err) {
      showToast(err.message || 'Failed to delete contact', 'error');
    }
  };

  const parseImportFile = (file) => {
    setImportFile(file);
    setImportResult(null);
    setParsedRows([]);

    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => setParsedRows(results.data),
        error: () => showToast('Could not read that CSV file.', 'error'),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'binary' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet);
          setParsedRows(rows);
        } catch {
          showToast('Could not read that Excel file.', 'error');
        }
      };
      reader.readAsBinaryString(file);
    } else if (ext === 'pdf') {
      setParsedRows([]);
    }
  };

  const runImport = async () => {
    if (!importFile || parsedRows.length === 0) return;
    setImporting(true);
    try {
      const ext = importFile.name.split('.').pop().toLowerCase();
      const result = await api.bulkImportContacts(parsedRows, ext);
      setImportResult(result);
      showToast(`Imported ${result.imported} contacts`, 'success');
      loadContacts();
    } catch (err) {
      showToast(err.message || 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  const closeImport = () => {
    setImportOpen(false);
    setImportFile(null);
    setImportResult(null);
    setParsedRows([]);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Manage Users</Typography>
          <Typography variant="body2" color="text.secondary">Your contact directory — imported and manually added.</Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<UploadFileRoundedIcon />} onClick={() => setImportOpen(true)}>
            Bulk import
          </Button>
          <Button variant="contained" startIcon={<PersonAddRoundedIcon />} onClick={() => setAddOpen(true)}>
            Add contact
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ borderRadius: 3 }}>
        <Stack sx={{ p: 2.5 }}>
          <TextField
            size="small"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
            sx={{ maxWidth: 320 }}
          />
        </Stack>
        {loading && <LinearProgress />}
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Group</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Added</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.phoneNumber}</TableCell>
                  <TableCell><Chip size="small" label={row.group?.name || row.group || '—'} variant="outlined" /></TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{row.source}</TableCell>
                  <TableCell><StatusChip status={row.status} /></TableCell>
                  <TableCell>{dayjs(row.createdAt).format('D MMM YYYY')}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleDelete(row.id)}>
                      <DeleteOutlineRoundedIcon fontSize="small" color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No contacts yet — add or import some.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Add contact dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add contact</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth placeholder="+91 9XXXX XXXXX" />
            <TextField
              select
              label="Group (optional)"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              fullWidth
            >
              {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button color="inherit" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Add contact</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk import dialog */}
      <Dialog open={importOpen} onClose={closeImport} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Bulk import contacts</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a CSV, Excel, or PDF file with your contacts.
          </Typography>
          <FileDropzone
            accept=".csv,.xlsx,.xls,.pdf"
            file={importFile}
            onFileSelected={parseImportFile}
            label="Drag & drop CSV, Excel, or PDF"
            helperText="Columns expected: name, phone"
            uploading={importing}
          />
          {importResult && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Imported {importResult.imported} of {importResult.totalRows} rows
              {importResult.duplicates > 0 && ` · ${importResult.duplicates} duplicates skipped`}
              {importResult.invalid > 0 && ` · ${importResult.invalid} invalid`}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button color="inherit" onClick={closeImport}>Close</Button>
          <Button variant="contained" disabled={!importFile || importing || parsedRows.length === 0} onClick={runImport}>
            {importing ? 'Importing…' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}