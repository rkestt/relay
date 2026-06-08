// Bypass native browser dialogs for automated testing
window.confirm = () => true;
window.alert = () => {};
window.prompt = () => null;
