let closeDialog = new CustomEvent('action', { detail: { action: 'close', data: {}}});
scope.dispatchEvent(closeDialog);
            