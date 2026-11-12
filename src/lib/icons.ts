// Lucide icons (ISC licence), paths unchanged, stroke from currentColor.
import bug from "lucide-static/icons/bug.svg?raw";
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
import chevronUp from "lucide-static/icons/chevron-up.svg?raw";
import box from "lucide-static/icons/box.svg?raw";
import infinity from "lucide-static/icons/infinity.svg?raw";
import rectangleHorizontal from "lucide-static/icons/rectangle-horizontal.svg?raw";
import palette from "lucide-static/icons/palette.svg?raw";
import triangleAlert from "lucide-static/icons/triangle-alert.svg?raw";
import info from "lucide-static/icons/info.svg?raw";
import check from "lucide-static/icons/check.svg?raw";
import x from "lucide-static/icons/x.svg?raw";
import arrowRight from "lucide-static/icons/arrow-right.svg?raw";
import loaderCircle from "lucide-static/icons/loader-circle.svg?raw";
import sun from "lucide-static/icons/sun.svg?raw";
import moon from "lucide-static/icons/moon.svg?raw";
import monitor from "lucide-static/icons/monitor.svg?raw";
import laptop from "lucide-static/icons/laptop.svg?raw";
import wifiOff from "lucide-static/icons/wifi-off.svg?raw";
import puzzle from "lucide-static/icons/puzzle.svg?raw";
import layoutGrid from "lucide-static/icons/layout-grid.svg?raw";

export const icons = {
  bug: bug,
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
  "chevron-up": chevronUp,
  box: box,
  infinity: infinity,
  "rectangle-horizontal": rectangleHorizontal,
  palette: palette,
  "triangle-alert": triangleAlert,
  info: info,
  check: check,
  x: x,
  "arrow-right": arrowRight,
  "loader-circle": loaderCircle,
  sun: sun,
  moon: moon,
  monitor: monitor,
  laptop: laptop,
  "wifi-off": wifiOff,
  puzzle: puzzle,
  "layout-grid": layoutGrid,
} as const;

export type IconName = keyof typeof icons;
