// The site's outlined pill button (the navbar's WhatsApp button, "Let's Connect"). A real 1px
// CSS border, so the browser snaps it to whole screen pixels and it looks even
// on every side. On hover the border turns transparent and a spinning gold →
// dark gold → white conic gradient shows through it. The inside is filled with
// --pill-fill: by default the page's own gradient, fixed to the viewport so it
// lines up with the page behind; set it when the button sits on something else.
export const PILL_BUTTON =
  "inline-flex items-center gap-2 rounded-[99px] border border-white px-3.5 py-2 text-xs leading-4 font-medium sm:px-5 sm:py-2.5 sm:text-[14px] sm:leading-5 text-white outline-offset-4 hover:animate-border-spin hover:border-transparent hover:[background:var(--pill-fill,var(--site-gradient))_fixed_padding-box,conic-gradient(from_var(--spin-from,0deg),transparent_var(--spin-reveal,100%),#FFFFFF_0)_border-box,conic-gradient(from_calc(var(--border-angle)_+_var(--spin-from,0deg)),#E79E3F,#C68535,#6D4819,#B8A58C,#FFFFFF,#F2C987,#E79E3F)_border-box] focus-visible:outline-2 focus-visible:outline-white motion-reduce:hover:animate-none";
