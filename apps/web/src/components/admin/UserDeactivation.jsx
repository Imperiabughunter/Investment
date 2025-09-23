import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  Snackbar,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const UserDeactivation = ({ userId, isActive, onStatusChange }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const { user } = useAuth();
  
  const isAdmin = user && (user.role === 'admin' || user.role === 'superuser');
  
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDeactivateActivate = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const endpoint = isActive 
        ? `/admin/users/${userId}/deactivate` 
        : `/admin/users/${userId}/activate`;
      
      const response = await api.put(endpoint);
      
      if (response.status === 200) {
        setSnackbar({
          open: true,
          message: `User ${isActive ? 'deactivated' : 'activated'} successfully`,
          severity: 'success'
        });
        
        if (onStatusChange) {
          onStatusChange(!isActive);
        }
      }
    } catch (error) {
      console.error('Error changing user status:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${isActive ? 'deactivate' : 'activate'} user: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      <Button 
        variant="outlined" 
        color={isActive ? "error" : "success"}
        onClick={handleClickOpen}
        size="small"
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </Button>
      
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {isActive ? 'Deactivate User Account' : 'Activate User Account'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {isActive 
              ? 'Are you sure you want to deactivate this user? They will not be able to log in until their account is reactivated.'
              : 'Are you sure you want to activate this user? This will restore their access to the system.'
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeactivateActivate} 
            color={isActive ? "error" : "success"} 
            autoFocus
            disabled={loading}
          >
            {loading 
              ? (isActive ? 'Deactivating...' : 'Activating...') 
              : (isActive ? 'Deactivate' : 'Activate')
            }
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UserDeactivation;