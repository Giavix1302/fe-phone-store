export const AUTH_CHANGED_EVENT = "auth-changed";

export const emitAuthChanged = () => {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};