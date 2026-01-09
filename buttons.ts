
/**
 * Qrivo Button Style Tokens - Source of Truth
 * Definitions for Primary, Secondary, Destructive, Neutral, Tertiary, and Tabbar states.
 */

export const buttonStyles = {
  // Base structural styles common to all buttons. Typography: Body 2 Medium.
  base: "box-sizing-border-box flex flex-row justify-center items-center gap-2 rounded-md transition-all active:scale-[0.98] duration-200 whitespace-nowrap text-[13px] font-medium",

  variants: {
    primary: {
      default: "bg-[#09B86D] text-white shadow-sm border border-transparent h-9 px-4",
      hover: "hover:bg-[#08a562]",
      active: "active:bg-[#078c53]",
      inactive: "bg-neutral-100 text-neutral-400 cursor-not-allowed border-transparent h-9 px-4",
    },
    secondary: {
      default: "bg-white border border-neutral-200 text-neutral-black shadow-sm h-9 px-4",
      hover: "hover:bg-neutral-50 hover:border-neutral-300",
      active: "active:bg-neutral-100",
      inactive: "bg-white border border-neutral-100 text-neutral-300 cursor-not-allowed h-9 px-4",
    },
    danger: {
      default: "bg-red-500 text-white shadow-sm border border-transparent h-9 px-4",
      hover: "hover:bg-red-600",
      active: "active:bg-red-700",
      inactive: "bg-neutral-100 text-neutral-400 cursor-not-allowed h-9 px-4",
    },
    neutral: {
      default: "bg-neutral-900 text-white shadow-sm border border-transparent h-9 px-4",
      hover: "hover:bg-neutral-800",
      active: "active:bg-black",
      inactive: "bg-neutral-100 text-neutral-400 cursor-not-allowed h-9 px-4",
    },
    tertiary: {
      default: "bg-[#DBFBED] text-[#09B86D] h-9 px-4 border border-transparent",
      hover: "hover:bg-[#c9f7e1]",
      active: "active:bg-[#b0f0d1]",
      inactive: "bg-neutral-50 text-neutral-300 cursor-not-allowed h-9 px-4",
    },
    ghost: {
      default: "bg-transparent text-neutral-500 h-9 px-4",
      hover: "hover:bg-neutral-100 hover:text-neutral-900",
      active: "active:bg-neutral-200",
      inactive: "text-neutral-300 cursor-not-allowed h-9 px-4",
    },
    tabbar: {
      default: "bg-transparent text-neutral-black h-9 px-3 !justify-start font-bold",
      hover: "hover:bg-neutral-50",
      active: "bg-primary-50 text-primary-500",
      inactive: "text-neutral-300 cursor-not-allowed h-9 px-3",
    },
    "danger-light": {
      default: "bg-[#EF4444]/15 text-[#EF4444] h-9 px-4 border border-transparent",
      hover: "hover:bg-[#EF4444]/25",
      active: "active:bg-[#EF4444]/35",
      inactive: "bg-neutral-50 text-neutral-300 cursor-not-allowed h-9 px-4",
    }
  },
};
