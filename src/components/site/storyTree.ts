// The About story's family tree: a short trunk, then three levels where every
// branch splits in two — out sideways, then down (one trunk → 2 → 4 → 8).
// Shared by the desktop story (StoryPath) and the phone version (MobileStory).

/** One level of the tree: paths drawn at the same time, each `length` long. */
export interface TreeLevel {
  paths: string[];
  length: number;
}

// Half-widths of each split, and the height of each step (at desktop size;
// smaller screens use TREE_NARROW of it).
const TREE_SPLITS = [112, 62, 36]; // trunk → 2, → 4, → 8
const TREE_STEP = 34;
export const TREE_NARROW = 0.72;

/** The tree, its trunk starting at `top`, at `size` times desktop size. */
export function familyTree(top: { x: number; y: number }, size: number): TreeLevel[] {
  const step = TREE_STEP * size;
  const levels: TreeLevel[] = [{ paths: [`M${top.x},${top.y} L${top.x},${top.y + step}`], length: step }];
  let tips = [top.x];
  let y = top.y + step;
  for (const split of TREE_SPLITS) {
    const half = split * size;
    levels.push({
      paths: tips.flatMap((x) => [-1, 1].map((side) => `M${x},${y} L${x + side * half},${y} L${x + side * half},${y + step}`)),
      length: half + step,
    });
    tips = tips.flatMap((x) => [x - half, x + half]);
    y += step;
  }
  return levels;
}

export const treeHeight = (size: number) => TREE_STEP * size * (TREE_SPLITS.length + 1);
export const treeWidth = (size: number) => 2 * TREE_SPLITS.reduce((sum, split) => sum + split, 0) * size;
