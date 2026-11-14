// Shapes returned by the iss-be admin endpoints.

interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface LinkedItem {
  id: string;
  title: string;
  slug: string;
  image?: string | null;
}

export interface Service extends Timestamps {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
  projects?: LinkedItem[];
  _count?: { projects: number };
}

export interface Project extends Timestamps {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  thumbnails: string[];
  isActive: boolean;
  services?: LinkedItem[];
}

// A group of team members. Members of a department with isCore are the
// "core people" shown on the About page.
export interface Department {
  id: string;
  name: string;
  sortOrder: number;
  isCore: boolean;
  _count?: { members: number }; // admin list only
}

export interface TeamMember extends Timestamps {
  id: string;
  name: string;
  email: string;
  link: string | null; // the only optional field
  jobTitle: string;
  departmentId: string;
  department: Department;
  image: string; // cartoon — shown by default
  actualImage: string | null; // real photo — shown on hover (null for members added before it existed)
  sortOrder: number;
  isActive: boolean;
}

export interface Blog extends Timestamps {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string; // omitted from list responses
  image: string;
  author: string; // defaults to "ISS Nepal"
  readTime: number; // minutes, defaults to 5
  isPublished: boolean;
  publishedAt: string | null;
}

export interface Testimonial extends Timestamps {
  id: string;
  clientName: string;
  companyName: string;
  testimony: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Client extends Timestamps {
  id: string;
  companyName: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  role: string;
}

export interface UpcomingEvent extends Timestamps {
  id: string;
  name: string;
  eventDate: string; // "YYYY-MM-DD", no time
  image: string;
  isActive: boolean;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  serviceId: string | null; // null if the service was deleted later
  serviceTitle: string; // service name at the time of submission
  tentativeDays: number;
  expectedGuests: number;
  eventVision: string;
  createdAt: string;
}
