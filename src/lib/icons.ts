// Lucide icons (ISC licence), paths unchanged, stroke from currentColor.
import download from "lucide-static/icons/download.svg?raw";
import upload from "lucide-static/icons/upload.svg?raw";
import save from "lucide-static/icons/save.svg?raw";
import file from "lucide-static/icons/file.svg?raw";
import folderOpen from "lucide-static/icons/folder-open.svg?raw";
import minus from "lucide-static/icons/minus.svg?raw";
import plus from "lucide-static/icons/plus.svg?raw";
import rotateCcw from "lucide-static/icons/rotate-ccw.svg?raw";
import chevronRight from "lucide-static/icons/chevron-right.svg?raw";
import chevronDown from "lucide-static/icons/chevron-down.svg?raw";
import maximize from "lucide-static/icons/maximize.svg?raw";
import grid2x2 from "lucide-static/icons/grid-2x2.svg?raw";
import palette from "lucide-static/icons/palette.svg?raw";
import triangleAlert from "lucide-static/icons/triangle-alert.svg?raw";
import info from "lucide-static/icons/info.svg?raw";
import check from "lucide-static/icons/check.svg?raw";
import x from "lucide-static/icons/x.svg?raw";
import arrowRight from "lucide-static/icons/arrow-right.svg?raw";
import loaderCircle from "lucide-static/icons/loader-circle.svg?raw";
import sun from "lucide-static/icons/sun.svg?raw";
import moon from "lucide-static/icons/moon.svg?raw";

export const icons = {
  download: download,
  upload: upload,
  save: save,
  file: file,
  "folder-open": folderOpen,
  minus: minus,
  plus: plus,
  "rotate-ccw": rotateCcw,
  "chevron-right": chevronRight,
  "chevron-down": chevronDown,
  maximize: maximize,
  "grid-2x2": grid2x2,
  palette: palette,
  "triangle-alert": triangleAlert,
  info: info,
  check: check,
  x: x,
  "arrow-right": arrowRight,
  "loader-circle": loaderCircle,
  sun: sun,
  moon: moon,
} as const;

export type IconName = keyof typeof icons;
