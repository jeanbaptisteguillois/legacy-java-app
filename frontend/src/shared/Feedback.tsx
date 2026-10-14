/** Small presentational helpers that mirror the AngularJS templates 1:1. */

/** Loading indicator (ported from `<div ng-if="vm.loading">Loading {noun}...</div>`). */
export function LoadingIndicator({ noun }: { noun: string }) {
  return <div>{`Loading ${noun}...`}</div>;
}

/** Error banner (ported from `<div class="alert alert-danger" ng-if="vm.error">{{ vm.error }}</div>`). */
export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="alert alert-danger">{message}</div>;
}
