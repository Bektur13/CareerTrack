import type { ApplicationStage, Contact, JobApplication } from "@/components/kanban/board";

// Same-origin Next.js Route Handlers (/api/applications/*). These run under
// the Clerk session cookie automatically — no cross-origin, no CORS, and no
// dependency on the Express server (which stays only for the extension's
// API-key auth). See src/app/api/applications/.

interface ApiCompany {
  id: string;
  name: string;
}

interface ApiContact {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
}

interface ApiJobApplication {
  id: string;
  role: string;
  stage: ApplicationStage;
  location: string | null;
  salaryRange: string | null;
  description: string | null;
  updatedAt: string;
  dateApplied: string;
  company: ApiCompany | null;
  contacts: ApiContact[];
}

function mapContact(api: ApiContact): Contact {
  return {
    id: api.id,
    name: api.name,
    title: api.title ?? undefined,
    email: api.email ?? undefined,
  };
}

// Field names differ deliberately between the two sides (role/company.name
// on the DB-facing API vs jobTitle/companyName on the board's UI model) —
// mapped once here instead of scattered across every call site.
function mapApplication(api: ApiJobApplication): JobApplication {
  return {
    id: api.id,
    jobTitle: api.role,
    companyName: api.company?.name ?? "Unknown company",
    stage: api.stage,
    location: api.location ?? undefined,
    salaryRange: api.salaryRange ?? undefined,
    description: api.description ?? undefined,
    updatedAt: api.updatedAt.split("T")[0],
    dateApplied: api.dateApplied.split("T")[0],
    contacts: api.contacts.map(mapContact),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchApplications(): Promise<JobApplication[]> {
  const res = await fetch("/api/applications");
  const body = await handleResponse<{ data: ApiJobApplication[] }>(res);
  return body.data.map(mapApplication);
}

export async function createApplication(input: {
  jobTitle: string;
  companyName: string;
  location?: string;
  salaryRange?: string;
  description?: string;
}): Promise<JobApplication> {
  const res = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: input.jobTitle,
      companyName: input.companyName,
      location: input.location,
      salaryRange: input.salaryRange,
      description: input.description,
    }),
  });
  return mapApplication(await handleResponse<ApiJobApplication>(res));
}

export async function updateApplicationStage(id: string, stage: ApplicationStage): Promise<JobApplication> {
  const res = await fetch(`/api/applications/${id}/stage`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage }),
  });
  return mapApplication(await handleResponse<ApiJobApplication>(res));
}

export async function createContact(
  applicationId: string,
  input: { name: string; title?: string; email?: string }
): Promise<Contact> {
  const res = await fetch(`/api/applications/${applicationId}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return mapContact(await handleResponse<ApiContact>(res));
}

export async function deleteContact(applicationId: string, contactId: string): Promise<void> {
  const res = await fetch(`/api/applications/${applicationId}/contacts/${contactId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
}

export async function deleteApplication(id: string): Promise<void> {
  const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
  // 204 No Content has no body — handleResponse's res.json() would throw
  // on success here, so only route through it for the error case.
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
}
