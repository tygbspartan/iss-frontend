// Music note with a softly filled head and flag: "music-note" from the
// andrsrxn/icons set (Iconify: andrsrxn:music-note, MIT licence). Inlined so it
// takes its colour from the text colour and needs no extra request.
export function MusicNoteIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        fill="currentColor"
        opacity=".2"
        d="M19.95 3.98L18.4 7.66l-6.7-1.33l.76-4.49zm-8.37 14.58a3.76 3.76 0 1 1-7.53 0a3.76 3.76 0 0 1 7.53 0"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M11.57 18.56a3.75 3.75 0 0 1-3.76 3.76a3.76 3.76 0 1 1 3.76-3.76m.01 0l.02-12.22m0 0V5.29c-.02-1.86-.02-2.79.59-3.24c.6-.45 1.5-.19 3.27.35l3.6 1.09l.06.02a1 1 0 0 1 .68.98v.34a3 3 0 0 1-3.68 2.78l-.33-.09z"
      />
    </svg>
  );
}
