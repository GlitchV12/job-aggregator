import axios from "axios";

// In dev: proxy handles /api → localhost:8000 (vite.config.ts)
// In prod: VITE_API_URL is set in Vercel env vars to your Railway backend URL
// e.g. VITE_API_URL=https://your-backend.railway.app
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

export const api = axios.create({ baseURL: BASE });

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

export const scoreResume = async (job_id: string, file: File) => {
  const form = new FormData();
  form.append("job_id", job_id);
  form.append("file", file);
  const { data } = await api.post<ResumeScore>("/analyze/resume", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
