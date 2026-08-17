import axios from "axios";

// In dev: proxy handles /api → localhost:8000 (vite.config.ts)
// In prod: VITE_API_URL is set in Vercel env vars to your Railway backend URL
// e.g. VITE_API_URL=https://your-backend.railway.app
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

export const api = axios.create({ baseURL: BASE });

const TOKEN_KEY = "auth_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Job {
  id: string;
  company_name: string;
  company_url: string;
  company_logo?: string;
  title: string;
  job_id?: string;
  location?: string;
  department?: string;
  short_description: string;
  apply_url: string;
  scraped_at: string;
}

export interface JobDetail extends Job {
  description: string;
}

export interface KeywordItem {
  keyword: string;
  weight: number;
  category: string;
}

export interface JDAnalysis {
  job_id: string;
  keywords: KeywordItem[];
  resume_template: string;
}

export interface ResumeScore {
  score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  suggestions: string[];
}

export interface Company {
  id: number;
  name: string;
  careers_url: string;
  ats_platform: string;
  last_scraped?: string;
}

export const fetchJobs = async (params: {
  search?: string;
  company?: string;
  location?: string;
  date_from?: string;
  skip?: number;
  limit?: number;
}) => {
  const { data } = await api.get<Job[]>("/jobs", { params });
  return data;
};

export const fetchJobsCount = async (params: {
  search?: string;
  company?: string;
  location?: string;
  date_from?: string;
}) => {
  const { data } = await api.get<{ total: number }>("/jobs/count", { params });
  return data.total;
};

export const fetchLocations = async () => {
  const { data } = await api.get<string[]>("/jobs/locations");
  return data;
};

export const fetchJob = async (id: string) => {
  const { data } = await api.get<JobDetail>(`/jobs/${id}`);
  return data;
};

export const fetchCompanies = async () => {
  const { data } = await api.get<Company[]>("/companies");
  return data;
};

export const scrapeUrl = async (url: string) => {
  const { data } = await api.post<Job[]>("/scrape", { url });
  return data;
};

export const analyzeJD = async (job_id: string) => {
  const { data } = await api.post<JDAnalysis>("/analyze/jd", { job_id });
  return data;
};

export const translateText = async (text: string) => {
  const { data } = await api.post<{ translated: string }>("/analyze/translate", { text });
  return data.translated;
};

export const scoreResume = async (job_id: string, file: File) => {
  const form = new FormData();
  form.append("job_id", job_id);
  form.append("file", file);
  const { data } = await api.post<ResumeScore>("/analyze/resume", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export interface User {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  resume_filename?: string;
  resume_uploaded_at?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Application {
  id: number;
  job_id?: string;
  job_title: string;
  company_name: string;
  apply_url?: string;
  status: string;
  notes?: string;
  applied_at: string;
}

export const sendOtp = async (email: string, password: string, name?: string) => {
  const { data } = await api.post<{ message: string }>("/auth/send-otp", { email, password, name });
  return data;
};

export const verifyOtp = async (email: string, otp: string, password: string, name?: string) => {
  const { data } = await api.post<AuthResponse>("/auth/verify-otp", { email, otp, password, name });
  return data;
};

export const signup = async (email: string, password: string, name?: string) => {
  const { data } = await api.post<AuthResponse>("/auth/signup", { email, password, name });
  return data;
};

export const login = async (email: string, password: string) => {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  return data;
};

export const fetchMe = async () => {
  const { data } = await api.get<User>("/auth/me");
  return data;
};

export const updateProfile = async (fields: { name?: string; phone?: string }) => {
  const { data } = await api.put<User>("/profile", fields);
  return data;
};

export const uploadResume = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<User>("/profile/resume", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const fetchApplications = async () => {
  const { data } = await api.get<Application[]>("/applications");
  return data;
};

export const createApplication = async (payload: {
  job_id?: string;
  job_title: string;
  company_name: string;
  apply_url?: string;
  status?: string;
}) => {
  const { data } = await api.post<Application>("/applications", payload);
  return data;
};

export const updateApplication = async (id: number, fields: { status?: string; notes?: string }) => {
  const { data } = await api.patch<Application>(`/applications/${id}`, fields);
  return data;
};

export const deleteApplication = async (id: number) => {
  await api.delete(`/applications/${id}`);
};

export const scoreResumeFromProfile = async (jobId: string) => {
  const form = new FormData();
  form.append("job_id", jobId);
  const { data } = await api.post<ResumeScore>("/analyze/resume-saved", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
