"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStudyUnitAction } from "@/app/actions";

export default function StudyUnitForm({ subjectId }) {
  const [state, action, pending] = useActionState(createStudyUnitAction, { ok: false, error: "" });
  const formRef = useRef(null);
  useEffect(() => { if (state.ok) formRef.current?.reset(); }, [state.ok]);
  return <form action={action} ref={formRef}><input type="hidden" name="subjectId" value={subjectId}/><label>Study Unit name<input name="name" placeholder="Study Unit 1 — Transaction Management" maxLength="80" required disabled={pending}/></label><button className="button primary" type="submit" disabled={pending}>{pending ? "Adding…" : "Create Study Unit"}</button>{state.error ? <p className="form-error" role="alert">{state.error}</p> : null}</form>;
}
