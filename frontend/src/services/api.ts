import axios from "axios";

const API_BASE = "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export interface JobApplication {
  id: number;
  company: string;
  position: string;
  status: JobStatus;
  location: string | null;
  salary_range: string | null;
  job_url: string | null;
  source: string | null;
  notes: string | null;
  email_id: string | null;
  applied_date: string | null;
  created_at: string;
  updated_at: string;
}

export type JobStatus =
  | "applied"
  | "screening"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn";

export interface JobApplicationList {
  items: JobApplication[];
  total: number;
}

export interface AuthStatus {
  authenticated: boolean;
  email: string | null;
}

// Auth endpoints
export const getAuthStatus = () => api.get<AuthStatus>("/auth/status");
export const getLoginUrl = () => api.get<{ auth_url: string }>("/auth/login");
export const logout = () => api.post("/auth/logout");

// Jobs endpoints
export const getJobs = (params?: {
  skip?: number;
  limit?: number;
  status?: JobStatus;
  search?: string;
}) => api.get<JobApplicationList>("/jobs", { params });

export const getJob = (id: number) => api.get<JobApplication>(`/jobs/${id}`);

export const createJob = (job: Partial<JobApplication>) =>
  api.post<JobApplication>("/jobs", job);

export const updateJob = (id: number, job: Partial<JobApplication>) =>
  api.patch<JobApplication>(`/jobs/${id}`, job);

export const deleteJob = (id: number) => api.delete(`/jobs/${id}`);

// Gmail endpoints
export const syncEmails = () => api.get("/gmail/sync");
export const testGmailConnection = () => api.get("/gmail/test");


