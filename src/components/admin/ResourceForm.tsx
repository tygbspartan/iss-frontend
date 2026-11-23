"use client";

import { useState } from "react";
import type { Body } from "@/lib/redux/api";
import { getErrorMessage, getFieldErrors } from "@/lib/redux/errors";
import type { FieldConfig, ResourceConfig } from "@/lib/admin/resource";
import { ImagePicker } from "./ImagePicker";
import { ListEditor } from "./ListEditor";
import { MarkdownEditor } from "./MarkdownEditor";
import { RelationPicker } from "./RelationPicker";
import { ThumbnailsEditor } from "./ThumbnailsEditor";
import { Alert, Button, inputClass, Modal, Spinner } from "./ui";

type Values = Record<string, unknown>;
type Record_ = { id: string; image: string; thumbnails?: string[] };

const UPLOAD_BATCH = 10; // backend accepts up to 10 files per request

const emptyValues = (fields: FieldConfig[]): Values =>
  Object.fromEntries(
    fields.map((f) => [
      f.name,
      f.type === "checkbox" ? (f.defaultChecked ?? true) : f.type === "relation" || f.type === "list" ? [] : "",
    ]),
  );

const recordValues = <T extends Record_>(config: ResourceConfig<T>, item: T): Values => {
  const base = config.toFormValues?.(item) ?? {};
  return Object.fromEntries(
    config.fields.map((f) => {
      if (f.name in base) return [f.name, base[f.name]];
      const raw = (item as unknown as Values)[f.name];
      if (f.type === "checkbox") return [f.name, Boolean(raw)];
      if (f.type === "relation") return [f.name, []];
      if (f.type === "list") return [f.name, Array.isArray(raw) ? raw.map(String) : []];
      return [f.name, raw === null || raw === undefined ? "" : String(raw)];
    }),
  );
};

// Form values → API body. Empty optional text becomes null (clears it) and an
// empty slug is left out so the backend generates / keeps it.
const toBody = (fields: FieldConfig[], values: Values): Body => {
  const body: Body = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.type === "checkbox" || f.type === "relation") {
      body[f.name] = v;
    } else if (f.type === "list") {
      body[f.name] = (v as string[]).map((item) => item.trim()).filter(Boolean);
    } else if (f.type === "number") {
      if (v !== "") body[f.name] = Number(v);
      else if (f.nullable) body[f.name] = null; // cleared → API resets it to its default
    } else {
      const text = String(v ?? "").trim();
      if (text) body[f.name] = text;
      else if (f.nullable) body[f.name] = null;
      else if (f.type !== "slug") body[f.name] = text; // let the API report "required"
    }
  }
  return body;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9 ()-]{5,22}$/; // same rule as the backend

// Client-side checks so obvious gaps are flagged before any request is sent.
// The backend validates the same rules and stays the source of truth.
const validate = <T extends Record_>(
  config: ResourceConfig<T>,
  values: Values,
  hasImage: boolean,
  isCreate: boolean,
  hasSecondFile: boolean,
): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};
  for (const f of config.fields) {
    const v = values[f.name];
    const text = typeof v === "string" ? v.trim() : "";
    if (f.required && (typeof v === "string" ? !text : Array.isArray(v) && v.length === 0)) {
      errors[f.name] = [`${f.label} is required`];
    } else if (f.type === "email" && text && !EMAIL_RE.test(text)) {
      errors[f.name] = ["Enter a valid email address"];
    } else if (f.type === "tel" && text && !PHONE_RE.test(text)) {
      errors[f.name] = ["Enter a valid phone number"];
    } else if (f.type === "url" && text && !URL.canParse(text)) {
      errors[f.name] = ["Enter a full URL, e.g. https://…"];
    }
  }
  if (!hasImage) errors.image = [`${config.imageLabel} is required`];
  // The second image is required for new records; older records may predate it.
  if (config.secondImage && isCreate && !hasSecondFile) {
    errors[config.secondImage.field] = [`${config.secondImage.label} is required`];
  }
  return errors;
};

interface FormProps<T extends Record_> {
  config: ResourceConfig<T>;
  itemId: string | null; // null → create
  onSaved: (message: string) => void;
  onClose: () => void;
}

// Loads the full record when editing (list rows omit e.g. blog content and
// service→project links), then hands it to the form as initial state.
export function ResourceForm<T extends Record_>(props: FormProps<T>) {
  const { config, itemId, onClose } = props;
  const { data, error, isLoading } = config.api.useGetOne(itemId ?? "", { skip: !itemId });
  const title = `${itemId ? "Edit" : "New"} ${config.singular.toLowerCase()}`;

  return (
    <Modal title={title} onClose={onClose}>
      {itemId && isLoading ? (
        <Spinner />
      ) : itemId && !data ? (
        <Alert>{error ? getErrorMessage(error) : `${config.singular} not found`}</Alert>
      ) : (
        <FormBody {...props} initial={itemId ? (data ?? null) : null} />
      )}
    </Modal>
  );
}

function FormBody<T extends Record_>({
  config,
  itemId,
  initial,
  onSaved,
  onClose,
}: FormProps<T> & { initial: T | null }) {
  const { api } = config;
  const [create] = api.useCreate();
  const [update] = api.useUpdate();
  const [uploadImage] = api.useUploadImage();
  // Hook presence is fixed per resource config, so this call is stable.
  const [addThumbnails] = (api.useAddThumbnails ?? noThumbnailsHook)();
  const hasThumbnails = !!api.useAddThumbnails;
  const second = config.secondImage;
  // Same idea: fixed per config, so the hook is always called the same way.
  const [uploadSecond] = (second?.useUpload ?? noUploadHook)();

  // After a create succeeds the record is kept, so retrying a failed image
  // upload updates the new record instead of creating a duplicate.
  const [record, setRecord] = useState<T | null>(initial);
  const [values, setValues] = useState<Values>(() =>
    initial ? recordValues(config, initial) : emptyValues(config.fields),
  );
  const [imageFile, setImageFile] = useState<File | null>(null); // new/replacement image
  const [secondFile, setSecondFile] = useState<File | null>(null); // new/replacement second image
  const [thumbs, setThumbs] = useState<string[]>(initial?.thumbnails ?? []);
  const [newThumbs, setNewThumbs] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: [] } : prev));
  };

  const hasImage = !!imageFile || !!record?.image;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const problems = validate(config, values, hasImage, !record, !!secondFile);
    setFieldErrors(problems);
    if (Object.keys(problems).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);

    // The (required) image travels with the create request itself; on edit a
    // new image replaces the old one after the fields are saved.
    const imageInCreate = !record;

    // 1. Save the record itself.
    let saved: T;
    try {
      const body = toBody(config.fields, values);
      if (imageInCreate) body.image = imageFile;
      if (imageInCreate && second) body[second.field] = secondFile;
      if (hasThumbnails && record) body.thumbnails = thumbs;
      saved = record
        ? await update({ id: record.id, body }).unwrap()
        : await create(body).unwrap();
      setRecord(saved);
      setThumbs(saved.thumbnails ?? []);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
      setSaving(false);
      return;
    }

    // 2. Images, now that the record exists.
    try {
      if (imageFile && !imageInCreate) {
        await uploadImage({ id: saved.id, file: imageFile }).unwrap();
      }
      setImageFile(null);
      if (secondFile && !imageInCreate) {
        saved = await uploadSecond({ id: saved.id, file: secondFile }).unwrap();
        setRecord(saved);
      }
      setSecondFile(null);

      for (let i = 0; i < newThumbs.length; i += UPLOAD_BATCH) {
        await addThumbnails({ id: saved.id, files: newThumbs.slice(i, i + UPLOAD_BATCH) }).unwrap();
      }
      setNewThumbs([]);
    } catch (err) {
      setError(`${config.singular} saved, but an image upload failed: ${getErrorMessage(err)}`);
      setSaving(false);
      return;
    }

    onSaved(`${config.singular} ${itemId ? "updated" : "created"}`);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {error && <Alert>{error}</Alert>}

      {/* grid-cols-1 = minmax(0, 1fr): long content can't stretch the column past the screen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {config.fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={values[field.name]}
            errors={fieldErrors[field.name]}
            onChange={(v) => set(field.name, v)}
          />
        ))}
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-medium">
          {config.imageLabel}
          <span className="text-red-600"> *</span>
        </h3>
        <ImagePicker
          label={config.imageLabel}
          current={record?.image ?? null}
          file={imageFile}
          onChange={(file) => {
            setImageFile(file);
            setFieldErrors((prev) => (prev.image ? { ...prev, image: [] } : prev));
          }}
          onError={setError}
          error={fieldErrors.image?.join(", ")}
        />
      </section>

      {second && (
        <SecondImageSection
          label={second.label}
          help={second.help}
          current={(record?.[second.field] as string | null | undefined) ?? null}
          isCreate={!record}
          file={secondFile}
          onChange={(file) => {
            setSecondFile(file);
            setFieldErrors((prev) => (prev[second.field] ? { ...prev, [second.field]: [] } : prev));
          }}
          onError={setError}
          error={fieldErrors[second.field]?.join(", ")}
        />
      )}

      {hasThumbnails && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Gallery</h3>
          <ThumbnailsEditor
            existing={thumbs}
            pending={newThumbs}
            onExistingChange={setThumbs}
            onPendingChange={setNewThumbs}
            onError={setError}
          />
        </section>
      )}

      <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {record ? "Save changes" : `Create ${config.singular.toLowerCase()}`}
        </Button>
      </div>
    </form>
  );
}

function SecondImageSection({
  label,
  help,
  current,
  isCreate,
  file,
  onChange,
  onError,
  error,
}: {
  label: string;
  help?: string;
  current: string | null;
  isCreate: boolean;
  file: File | null;
  onChange: (file: File) => void;
  onError: (message: string) => void;
  error?: string;
}) {
  const missing = !isCreate && !current && !file;
  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-sm font-medium">
          {label}
          {isCreate && <span className="text-red-600"> *</span>}
        </h3>
        {missing ? (
          <p className="text-xs text-amber-700 dark:text-amber-400">Not added yet — please add one.</p>
        ) : help ? (
          <p className="text-xs text-zinc-500">{help}</p>
        ) : null}
      </div>
      <ImagePicker label={label} current={current} file={file} onChange={onChange} onError={onError} error={error} />
    </section>
  );
}

// Stand-in for resources without a second image, so hooks are always called the same way.
const noUploadHook = () =>
  [
    () => ({ unwrap: () => Promise.reject(new Error("This resource has no second image")) }),
    { isLoading: false },
  ] as const;

// Stand-in for resources without a gallery, so hooks are always called the same way.
const noThumbnailsHook = () =>
  [
    () => ({ unwrap: () => Promise.reject(new Error("This resource has no gallery")) }),
    { isLoading: false },
  ] as const;

// Dropdown whose options come from the API (e.g. a team member's department).
function SelectField({
  useOptions,
  emptyHint,
  value,
  onChange,
  placeholder,
  ...props
}: {
  useOptions: NonNullable<FieldConfig["relation"]>["useOptions"];
  emptyHint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id: string;
  className: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}) {
  const { data: options, error, isLoading } = useOptions();

  if (error) return <p className="text-sm text-red-600">{getErrorMessage(error)}</p>;
  if (isLoading || !options) return <p className="py-2 text-sm text-zinc-500">Loading…</p>;
  if (options.length === 0) {
    return <p className="py-2 text-sm text-zinc-500">{emptyHint ?? "Nothing to choose from yet."}</p>;
  }

  return (
    <select {...props} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder ?? "Select…"}</option>
      {/* Keep showing a value that is no longer in the list rather than silently dropping it. */}
      {value && !options.some((o) => o.id === value) && <option value={value}>(no longer available)</option>}
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.title}
        </option>
      ))}
    </select>
  );
}

function Field({
  field,
  value,
  errors,
  onChange,
}: {
  field: FieldConfig;
  value: unknown;
  errors?: string[];
  onChange: (value: unknown) => void;
}) {
  const id = `field-${field.name}`;
  const invalid = !!errors?.length;
  const describedBy = invalid ? `${id}-error` : field.help ? `${id}-help` : undefined;
  const wide = field.wide || ["textarea", "relation", "markdown", "list"].includes(field.type);

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 self-end py-2 text-sm font-medium">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 accent-zinc-900 dark:accent-zinc-100"
        />
        {field.label}
      </label>
    );
  }

  const common = {
    id,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    placeholder: field.placeholder,
    className: inputClass,
  };

  return (
    <div className={`min-w-0 space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id} className="block text-sm font-medium">
        {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </label>

      {field.type === "markdown" ? (
        <MarkdownEditor
          id={id}
          value={String(value ?? "")}
          onChange={onChange}
          rows={field.rows}
          invalid={invalid}
          describedBy={describedBy}
        />
      ) : field.type === "textarea" ? (
        <textarea
          {...common}
          rows={field.rows ?? 4}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "select" && field.relation ? (
        <SelectField
          {...common}
          useOptions={field.relation.useOptions}
          emptyHint={field.emptyHint}
          value={String(value ?? "")}
          onChange={onChange}
        />
      ) : field.type === "list" ? (
        <ListEditor
          id={id}
          value={(value as string[]) ?? []}
          onChange={onChange}
          placeholder={field.placeholder}
          invalid={invalid}
          describedBy={describedBy}
        />
      ) : field.type === "relation" && field.relation ? (
        <RelationPicker
          id={id}
          useOptions={field.relation.useOptions}
          value={(value as string[]) ?? []}
          onChange={onChange}
          invalid={invalid}
        />
      ) : (
        <input
          {...common}
          type={field.type === "slug" ? "text" : field.type}
          min={field.type === "number" ? 0 : undefined}
          step={field.type === "number" ? 1 : undefined}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {invalid ? (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {errors!.join(", ")}
        </p>
      ) : field.help ? (
        <p id={`${id}-help`} className="text-xs text-zinc-500">
          {field.help}
        </p>
      ) : null}
    </div>
  );
}
