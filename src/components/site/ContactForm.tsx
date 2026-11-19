"use client";

import { useId, useState } from "react";
import { ArrowRight, CircleCheck } from "lucide-react";
import { USE_MOCK_DATA } from "@/lib/mock/flag";
import { PILL_BUTTON } from "./pill";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type FieldErrors = Record<string, string[] | undefined>;

interface ErrorBody {
  message?: string;
  errors?: FieldErrors;
}

// "Underline" fields: no box and no fill — just a thin line under each field,
// like a line to write on. It brightens on hover and turns gold on focus (red
// if the field has an error).
const CONTROL =
  "w-full rounded-none border-0 border-b border-white/30 bg-transparent px-0 text-xs text-white outline-none sm:text-base transition-colors placeholder:text-neutral-500 hover:border-white/60 focus:border-[#E79E3F] aria-invalid:border-red-400";

// The site's pill button. The form card has no colour of its own, so the
// button's default hover fill (the page background) is the right one.
const FORM_BUTTON = PILL_BUTTON;

// Today in Nepal as YYYY-MM-DD: the earliest event date that can be picked
// (the backend checks the same).
const todayInNepal = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(new Date());

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => React.ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      {/* Grey and tight to the field, so what's typed (white) stands out on the line. */}
      <label htmlFor={id} className="block text-xs text-[#9DA1B1] sm:text-sm">
        {label}
        <span className="text-red-400" aria-hidden>
          *
        </span>
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

// "Contact Us" form. Posts straight to iss-be's public /api/contact, which
// validates every field (all are required) and rate-limits by visitor.
// `className` places the form in the page's layout.
export function ContactForm({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<
      string,
      string
    >;

    setStatus("sending");
    setFieldErrors({});
    setFormError(null);
    // Demo mode (no backend): pretend to send, so the thank-you message can be seen.
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      form.reset();
      setStatus("sent");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        form.reset();
        setStatus("sent");
        return;
      }
      const body = (await res.json().catch(() => ({}))) as ErrorBody;
      setFieldErrors(body.errors ?? {});
      setFormError(
        body.errors
          ? "Please check the highlighted fields."
          : body.message || "Something went wrong. Please try again.",
      );
    } catch {
      setFormError(
        "We couldn't send your message. Please check your connection and try again, or call us.",
      );
    }
    setStatus("idle");
  }

  const sent = status === "sent";
  const error = (name: string) => fieldErrors[name]?.[0];

  return (
    <div
      className={`relative ${className}`}
    >
      {/* Thank-you message. On desktop (where the page is split left/right) it
          is centred over the form's own space — the form stays in place,
          invisible, so the layout keeps exactly the same size. On smaller
          screens the form is removed and the space shrinks to fit the message. */}
      {sent && (
        <div
          role="status"
          className="flex flex-col items-center justify-center py-10 text-center lg:absolute lg:inset-0 lg:py-0"
        >
          <CircleCheck
            className="size-12 text-[#E79E3F] lg:size-14"
            strokeWidth={1.5}
            aria-hidden
          />
          <h2 className="mt-5 text-[26px] font-medium text-white sm:text-2xl lg:text-3xl">
            Thank you!
          </h2>
          <p className="mt-2 max-w-sm font-poppins text-xs leading-[1.61] text-[#9DA1B1] sm:text-base lg:text-lg">
            We&apos;ve received your message and will get back to you shortly.
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className={`mt-8 ${FORM_BUTTON}`}
          >
            Send another message
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        inert={sent}
        aria-hidden={sent || undefined}
        // On desktop the form takes part in the page's two rows: fields in the
        // first, submit button in the second (see the contact page).
        className={`lg:row-span-2 lg:grid lg:grid-rows-subgrid ${sent ? "hidden lg:invisible" : ""}`}
      >
        {/* Name and company across the full width; then email and contact
            number, and event type and date, side by side from tablet width up
            (stacked on phones); then the requirements box. */}
        <div className="flex flex-col gap-5 sm:gap-6">
          <Field label="Full Name" error={error("name")}>
            {(props) => (
              <input
                {...props}
                name="name"
                type="text"
                autoComplete="name"
                required
                maxLength={150}
                placeholder="Enter your name"
                className={`${CONTROL} h-10`}
              />
            )}
          </Field>

          <Field label="Company / Organization" error={error("company")}>
            {(props) => (
              <input
                {...props}
                name="company"
                type="text"
                autoComplete="organization"
                required
                maxLength={200}
                placeholder="Company name"
                className={`${CONTROL} h-10`}
              />
            )}
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Email Address" error={error("email")}>
              {(props) => (
                <input
                  {...props}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={200}
                  placeholder="Your email address"
                  className={`${CONTROL} h-10`}
                />
              )}
            </Field>

            <Field label="Contact Number" error={error("phone")}>
              {(props) => (
                <input
                  {...props}
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={30}
                  pattern="[+\d\s\(\)\-]{7,30}"
                  title="Digits, spaces and + ( ) - only"
                  placeholder="+977"
                  className={`${CONTROL} h-10`}
                />
              )}
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Type of Event" error={error("eventType")}>
              {(props) => (
                <input
                  {...props}
                  name="eventType"
                  type="text"
                  required
                  maxLength={150}
                  placeholder="e.g. Corporate event, wedding, concert"
                  className={`${CONTROL} h-10`}
                />
              )}
            </Field>

            <Field label="Event Date" error={error("eventDate")}>
              {(props) => (
                <input
                  {...props}
                  name="eventDate"
                  type="date"
                  required
                  min={todayInNepal()}
                  // Grey until a date is picked, like the placeholders.
                  className={`${CONTROL} h-10 invalid:text-neutral-500 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60`}
                />
              )}
            </Field>
          </div>

          <Field label="Tell us about your requirements" error={error("requirements")}>
            {(props) => (
              <textarea
                {...props}
                name="requirements"
                required
                maxLength={5000}
                rows={5}
                placeholder="Please share your venue, expected audience, sound, LED, lighting, staging or other requirements..."
                className={`${CONTROL} block resize-y py-2.5 leading-6`}
              />
            )}
          </Field>
        </div>

        {/* Honeypot: invisible to people, so only bots fill it in. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
        />

        {/* The submit button, with any form-wide error under it. */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={status === "sending"}
            className={`cursor-pointer disabled:cursor-wait disabled:opacity-60 ${FORM_BUTTON}`}
          >
            {status === "sending" ? "Sending…" : "Let’s Connect"}
            <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
          </button>
          {formError && (
            <p role="alert" className="mt-3 text-xs text-red-400 sm:text-sm">
              {formError}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
