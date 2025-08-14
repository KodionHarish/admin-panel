// components/SendMessageModal.jsx
import { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material";
import { Send, X, CheckCircle, AlertCircle } from "lucide-react";

const SendMessageModal = ({
  open,
  onClose,
  selectedUser,
  notificationMessage,
  onMessageChange,
  onSendNotification,
  textareaRef,
  onSendEmail,
  isLoading,
  isEmailLoading,
  sendStatus,
  btnDisable = false,
  textCount = 0, // New prop for text count
}) => {
  console.log(notificationMessage,"notificationMessage")
  const getStatusIcon = () => {
    if (sendStatus === "success")
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (sendStatus === "error")
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getStatusMessage = () => {
    if (sendStatus === "success") return "Message sent successfully!";
    if (sendStatus === "error")
      return "Failed to send message. Please try again.";
    return null;
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isLoading && !isEmailLoading && notificationMessage.trim()) {
        onSendNotification();
      }
    }
  };



  // Effect to handle focus management for modal
  useEffect(() => {
    if (open) {
      const focusTimer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            notificationMessage.length,
            notificationMessage.length
          );
        }
      }, 200);

      return () => clearTimeout(focusTimer);
    }
  }, [open,textareaRef, notificationMessage.length]);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: "400px",
        },
      }}
      disableEscapeKeyDown={isLoading || isEmailLoading}
      onBackdropClick={
        isLoading || isEmailLoading ? undefined : onClose
      }
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h6" component="div">
              Send Notification
            </Typography>
            <Typography variant="body2" color="text.secondary">
              To: {selectedUser?.name}
            </Typography>
          </Box>
          <Button
            onClick={onClose}
            disabled={isLoading || isEmailLoading}
            sx={{ minWidth: "auto", p: 0.5 }}
          >
            <X className="w-5 h-5" />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Status indicator */}
        <Box mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              width={8}
              height={8}
              borderRadius="50%"
              bgcolor={
                selectedUser?.activeStatus ? "success.main" : "error.main"
              }
            />
            <Typography variant="body2" color="text.secondary">
              Status:
              <Typography
                component="span"
                color={
                  selectedUser?.activeStatus ? "success.main" : "error.main"
                }
                fontWeight="medium"
                ml={0.5}
              >
                {selectedUser?.activeStatus ? "Online" : "Offline"}
              </Typography>
            </Typography>
          </Box>
        </Box>

        {/* Message input */}
        <TextField
          inputRef={textareaRef}
          label="Message"
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          // value={notificationMessage}
          // value={textareaRef.current?.value}
          onKeyUp={onMessageChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter your message... (Ctrl+Enter to send)"
          disabled={isLoading || isEmailLoading}
          inputProps={{
            maxLength: 500,
            style: { resize: "vertical" },
          }}
          helperText={`${notificationMessage.length}/500 characters`}
          sx={{ mb: 2 }}
          autoFocus
        />

        {/* Status message */}
        {sendStatus && (
          <Alert
            severity={sendStatus === "success" ? "success" : "error"}
            sx={{ mb: 2 }}
            icon={getStatusIcon()}
          >
            {getStatusMessage()}
          </Alert>
        )}

        {/* Delivery info */}
        <Box p={2} bgcolor="info.50" borderRadius={1}>
          <Typography variant="body2" color="text.secondary">
            {selectedUser?.activeStatus ? (
              <>
                📱 User is online - notification will be delivered immediately
              </>
            ) : (
              <>
                📤 User is offline - notification will be queued and delivered
                when they come online
              </>
            )}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          disabled={isLoading || isEmailLoading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={onSendNotification}
          disabled={
            isLoading ||
            isEmailLoading ||
            sendStatus === "success" ||
            btnDisable
          }
          variant="contained"
          startIcon={
            isLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Send className="w-4 h-4" />
            )
          }
        >
          {isLoading ? "Sending..." : "Send Message"}
        </Button>
        <Button
          onClick={onSendEmail}
          disabled={isLoading || isEmailLoading || selectedUser?.activeStatus}
          variant="outlined"
          color="secondary"
          sx={{ ml: "auto" }}
          startIcon={
            isEmailLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {isEmailLoading ? "Sending Email..." : "Send Email"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendMessageModal;