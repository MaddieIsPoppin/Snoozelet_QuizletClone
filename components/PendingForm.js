"use client";

import { useFormStatus } from "react-dom";

function PendingFields({ children, submitLabel, pendingLabel }) {
  const { pending } = useFormStatus();

  return (
    <fieldset className="pending-form-fields form-stack" disabled={pending} aria-busy={pending}>
      {children}
      <button className="button primary" type="submit">
        {pending ? pendingLabel : submitLabel}
      </button>
      {pending ? (
        <p className="pending-form-status" role="status">
          Saving to Snoozelet. Please wait before making another change.
        </p>
      ) : null}
    </fieldset>
  );
}

export default function PendingForm({
  action,
  children,
  className = "",
  submitLabel,
  pendingLabel = "Saving…",
}) {
  return (
    <form action={action} className={className}>
      <PendingFields submitLabel={submitLabel} pendingLabel={pendingLabel}>
        {children}
      </PendingFields>
    </form>
  );
}
