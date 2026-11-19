import type { ResourceConfig } from "./resource";
import type { Blog, Client, Project, Service, TeamMember, Testimonial, UpcomingEvent } from "./types";
import { formatDate, truncate } from "./format";
import * as services from "@/lib/redux/features/services/servicesApi";
import * as projects from "@/lib/redux/features/projects/projectsApi";
import * as team from "@/lib/redux/features/team/teamApi";
import * as departments from "@/lib/redux/features/departments/departmentsApi";
import * as blogs from "@/lib/redux/features/blogs/blogsApi";
import * as testimonials from "@/lib/redux/features/testimonials/testimonialsApi";
import * as clients from "@/lib/redux/features/clients/clientsApi";
import * as upcomingEvents from "@/lib/redux/features/upcomingEvents/upcomingEventsApi";

// One config per admin section. Field names match the iss-be validators.

const slugField = {
  name: "slug",
  label: "Slug",
  type: "slug" as const,
  placeholder: "auto-generated from title",
  help: "Used in the page URL. Leave empty to generate it from the title.",
};

const sortOrderField = {
  name: "sortOrder",
  label: "Display order",
  type: "number" as const,
  placeholder: "0",
  help: "Lower numbers show first.",
};

const visibleField = { name: "isActive", label: "Visible on website", type: "checkbox" as const };
const visibleToggle = { field: "isActive" as const, on: "Visible", off: "Hidden" };

export const servicesConfig: ResourceConfig<Service> = {
  api: {
    useAdminList: services.useGetAdminServicesQuery,
    useGetOne: services.useGetServiceQuery,
    useCreate: services.useCreateServiceMutation,
    useUpdate: services.useUpdateServiceMutation,
    useDelete: services.useDeleteServiceMutation,
    useUploadImage: services.useUploadServiceImageMutation,
  },
  title: "Services",
  singular: "Service",
  description: "What the company offers — shown on the services page.",
  paginated: false,
  imageLabel: "Image",
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    slugField,
    { name: "description", label: "Description", type: "textarea", required: true, rows: 5 },
    {
      name: "features",
      label: "What's included",
      type: "list",
      placeholder: "e.g. JBL SRX835 Full-Range Speakers",
      help: "Shown as a list on the service's page. Press Enter to add the next item.",
    },
    sortOrderField,
    visibleField,
    {
      name: "projectIds",
      label: "Related projects",
      type: "relation",
      relation: { useOptions: projects.useGetProjectOptionsQuery },
    },
  ],
  columns: [
    { label: "Projects", render: (s) => s._count?.projects ?? 0, className: "hidden md:table-cell" },
    { label: "Order", render: (s) => s.sortOrder, className: "hidden sm:table-cell" },
  ],
  primary: (s) => s.title,
  secondary: (s) => `/${s.slug}`,
  toggle: visibleToggle,
  toFormValues: (s) => ({ projectIds: s.projects?.map((p) => p.id) ?? [] }),
};

export const projectsConfig: ResourceConfig<Project> = {
  api: {
    useAdminList: projects.useGetAdminProjectsQuery,
    useGetOne: projects.useGetProjectQuery,
    useCreate: projects.useCreateProjectMutation,
    useUpdate: projects.useUpdateProjectMutation,
    useDelete: projects.useDeleteProjectMutation,
    useUploadImage: projects.useUploadProjectImageMutation,
    useAddThumbnails: projects.useAddProjectThumbnailsMutation,
  },
  title: "Projects",
  singular: "Project",
  description: "Recent works — each can belong to several services.",
  paginated: true,
  imageLabel: "Cover image",
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    slugField,
    { name: "description", label: "Description", type: "textarea", required: true, rows: 5 },
    visibleField,
    {
      name: "serviceIds",
      label: "Services",
      type: "relation",
      required: true,
      help: "Pick at least one.",
      relation: { useOptions: services.useGetServiceOptionsQuery },
    },
  ],
  columns: [
    {
      label: "Services",
      render: (p) => truncate(p.services?.map((s) => s.title).join(", "), 40) || "—",
      className: "hidden md:table-cell",
    },
    { label: "Gallery", render: (p) => p.thumbnails.length, className: "hidden sm:table-cell" },
    { label: "Created", render: (p) => formatDate(p.createdAt), className: "hidden lg:table-cell" },
  ],
  primary: (p) => p.title,
  secondary: (p) => `/${p.slug}`,
  toggle: visibleToggle,
  toFormValues: (p) => ({ serviceIds: p.services?.map((s) => s.id) ?? [] }),
};

export const teamConfig: ResourceConfig<TeamMember> = {
  api: {
    useAdminList: team.useGetAdminTeamQuery,
    useGetOne: team.useGetTeamMemberQuery,
    useCreate: team.useCreateTeamMemberMutation,
    useUpdate: team.useUpdateTeamMemberMutation,
    useDelete: team.useDeleteTeamMemberMutation,
    useUploadImage: team.useUploadTeamMemberImageMutation,
  },
  title: "Team",
  singular: "Team member",
  description: "Everyone on the Teams page. People in a department marked “About page” also appear there.",
  paginated: false,
  imageLabel: "Cartoon image",
  secondImage: {
    field: "actualImage",
    label: "Actual photo",
    help: "The real photo, shown when someone hovers over the cartoon on the website.",
    useUpload: team.useUploadTeamMemberActualImageMutation,
  },
  // Everything is required except the link.
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "jobTitle", label: "Job title", type: "text", required: true },
    {
      name: "departmentId",
      label: "Department",
      type: "select",
      required: true,
      placeholder: "Choose a department…",
      relation: { useOptions: departments.useGetDepartmentOptionsQuery },
      emptyHint: "No departments yet — add one in the Departments box on this page first.",
    },
    { name: "email", label: "Email", type: "email", required: true },
    {
      name: "link",
      label: "Link (optional)",
      type: "url",
      nullable: true,
      placeholder: "https://linkedin.com/in/…",
      wide: true,
    },
    sortOrderField,
    visibleField,
  ],
  columns: [
    { label: "Department", render: (m) => m.department.name, className: "hidden md:table-cell" },
    { label: "Email", render: (m) => m.email, className: "hidden lg:table-cell" },
    {
      label: "Actual photo",
      render: (m) => (m.actualImage ? "Added" : <span className="text-amber-700 dark:text-amber-400">Missing</span>),
      className: "hidden md:table-cell",
    },
    { label: "Order", render: (m) => m.sortOrder, className: "hidden sm:table-cell" },
  ],
  primary: (m) => m.name,
  secondary: (m) => m.jobTitle,
  toggle: visibleToggle,
};

export const blogsConfig: ResourceConfig<Blog> = {
  api: {
    useAdminList: blogs.useGetAdminBlogsQuery,
    useGetOne: blogs.useGetBlogQuery,
    useCreate: blogs.useCreateBlogMutation,
    useUpdate: blogs.useUpdateBlogMutation,
    useDelete: blogs.useDeleteBlogMutation,
    useUploadImage: blogs.useUploadBlogImageMutation,
  },
  title: "Blogs",
  singular: "Blog post",
  description: "Drafts stay private until published.",
  paginated: true,
  imageLabel: "Cover image",
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    slugField,
    {
      name: "description",
      label: "Excerpt",
      type: "textarea",
      required: true,
      rows: 2,
      help: "Short summary shown on blog listing cards.",
    },
    { name: "content", label: "Content", type: "markdown", required: true, rows: 16 },
    {
      name: "author",
      label: "Author",
      type: "text",
      placeholder: "ISS Nepal",
      help: "Leave empty to use “ISS Nepal”.",
    },
    {
      name: "readTime",
      label: "Read time (minutes)",
      type: "number",
      nullable: true, // cleared → back to the default
      placeholder: "5",
      help: "Leave empty to use 5 minutes.",
    },
    { name: "isPublished", label: "Published", type: "checkbox", defaultChecked: false },
  ],
  columns: [
    { label: "Author", render: (b) => b.author, className: "hidden lg:table-cell" },
    { label: "Read", render: (b) => `${b.readTime} min`, className: "hidden lg:table-cell" },
    { label: "Published", render: (b) => formatDate(b.publishedAt), className: "hidden md:table-cell" },
    { label: "Updated", render: (b) => formatDate(b.updatedAt), className: "hidden lg:table-cell" },
  ],
  primary: (b) => b.title,
  secondary: (b) => truncate(b.description, 70),
  toggle: { field: "isPublished", on: "Published", off: "Draft" },
};

export const testimonialsConfig: ResourceConfig<Testimonial> = {
  api: {
    useAdminList: testimonials.useGetAdminTestimonialsQuery,
    useGetOne: testimonials.useGetTestimonialQuery,
    useCreate: testimonials.useCreateTestimonialMutation,
    useUpdate: testimonials.useUpdateTestimonialMutation,
    useDelete: testimonials.useDeleteTestimonialMutation,
    useUploadImage: testimonials.useUploadTestimonialImageMutation,
  },
  title: "Testimonials",
  singular: "Testimonial",
  description: "What clients say about the company.",
  paginated: false,
  imageLabel: "Photo",
  fields: [
    { name: "clientName", label: "Client name", type: "text", required: true },
    { name: "companyName", label: "Company", type: "text", required: true },
    { name: "testimony", label: "Testimony", type: "textarea", required: true, rows: 5 },
    sortOrderField,
    visibleField,
  ],
  columns: [
    { label: "Testimony", render: (t) => truncate(t.testimony, 60), className: "hidden md:table-cell" },
    { label: "Order", render: (t) => t.sortOrder, className: "hidden sm:table-cell" },
  ],
  primary: (t) => t.clientName,
  secondary: (t) => t.companyName,
  toggle: visibleToggle,
};

export const clientsConfig: ResourceConfig<Client> = {
  api: {
    useAdminList: clients.useGetAdminClientsQuery,
    useGetOne: clients.useGetClientQuery,
    useCreate: clients.useCreateClientMutation,
    useUpdate: clients.useUpdateClientMutation,
    useDelete: clients.useDeleteClientMutation,
    useUploadImage: clients.useUploadClientImageMutation,
  },
  title: "Clients",
  singular: "Client",
  description: "Company logos shown in the clients section.",
  paginated: false,
  imageLabel: "Logo",
  fields: [
    { name: "companyName", label: "Company name", type: "text", required: true },
    sortOrderField,
    visibleField,
  ],
  columns: [
    { label: "Order", render: (c) => c.sortOrder, className: "hidden sm:table-cell" },
    { label: "Added", render: (c) => formatDate(c.createdAt), className: "hidden md:table-cell" },
  ],
  primary: (c) => c.companyName,
  toggle: visibleToggle,
};

export const upcomingEventsConfig: ResourceConfig<UpcomingEvent> = {
  api: {
    useAdminList: upcomingEvents.useGetAdminUpcomingEventsQuery,
    useGetOne: upcomingEvents.useGetUpcomingEventQuery,
    useCreate: upcomingEvents.useCreateUpcomingEventMutation,
    useUpdate: upcomingEvents.useUpdateUpcomingEventMutation,
    useDelete: upcomingEvents.useDeleteUpcomingEventMutation,
    useUploadImage: upcomingEvents.useUploadUpcomingEventImageMutation,
  },
  title: "Upcoming Events",
  singular: "Upcoming event",
  description: "Shown in the home page popup. Events turn inactive by themselves once their date has passed.",
  paginated: false,
  imageLabel: "Image",
  fields: [
    { name: "name", label: "Event name", type: "text", required: true },
    { name: "eventDate", label: "Event date", type: "date", required: true },
    { name: "isActive", label: "Active (shown on website)", type: "checkbox" },
  ],
  columns: [
    // Local midnight, so the calendar date can't shift with the viewer's timezone.
    { label: "Event date", render: (e) => formatDate(`${e.eventDate}T00:00:00`) },
  ],
  primary: (e) => e.name,
  toggle: { field: "isActive", on: "Active", off: "Inactive" },
};

export const adminSections = [
  { href: "/admin/services", config: servicesConfig },
  { href: "/admin/projects", config: projectsConfig },
  { href: "/admin/team", config: teamConfig },
  { href: "/admin/blogs", config: blogsConfig },
  { href: "/admin/testimonials", config: testimonialsConfig },
  { href: "/admin/clients", config: clientsConfig },
  { href: "/admin/upcoming-events", config: upcomingEventsConfig },
] as const;
