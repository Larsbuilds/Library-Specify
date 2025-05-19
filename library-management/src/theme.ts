import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  components: {
    MuiDialog: {
      defaultProps: {
        container: document.getElementById('portal-root'),
        slotProps: {
          backdrop: {
            'aria-hidden': 'true'
          }
        }
      },
    },
    MuiPopover: {
      defaultProps: {
        container: document.getElementById('portal-root')
      }
    },
    MuiPopper: {
      defaultProps: {
        container: document.getElementById('portal-root')
      }
    }
  },
});
