"use client";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { SidebarContext, useSidebar } from "./sidebar-context";

export interface SidebarLinkItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
}

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-screen h-[100dvh] min-h-screen sticky top-0 inset-y-0 px-4 py-5 hidden md:flex md:flex-col bg-[#050507]/90 backdrop-blur-2xl border-r border-white/14 w-[320px] shrink-0 z-30 shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)] transition-colors overflow-hidden",
        className
      )}
      animate={{
        width: animate ? (open ? "320px" : "80px") : "320px",
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <div
      className={cn(
        "h-16 px-4 flex flex-row md:hidden items-center justify-between bg-[#050507]/85 backdrop-blur-xl border-b border-white/14 w-full z-40 sticky top-0 shrink-0",
        className
      )}
      {...props}
    >
      <div className="flex justify-between items-center z-20 w-full">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white text-black flex items-center justify-center font-bold text-xs">
            SL
          </div>
          <span className="text-sm font-bold text-white tracking-widest uppercase">
            SATLINK
          </span>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="p-2 border border-white/20 text-white hover:bg-white/10 transition cursor-pointer"
          aria-label="Toggle mobile menu"
        >
          <IconMenu2 className="text-white w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            className="fixed h-full h-[100dvh] w-[320px] max-w-[85vw] inset-y-0 left-0 bg-[#08080a]/95 backdrop-blur-2xl p-6 z-[100] flex flex-col justify-between border-r border-white/20 overflow-y-auto"
          >
            <div
              className="absolute right-6 top-6 z-50 p-2 border border-white/20 text-white hover:bg-white/20 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <IconX className="w-5 h-5" />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: SidebarLinkItem;
  className?: string;
}) => {
  const { open, animate, setOpen } = useSidebar();

  const handleClick = (e: React.MouseEvent) => {
    if (link.onClick) {
      e.preventDefault();
      link.onClick();
      // Auto close on mobile
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setOpen(false);
      }
    }
  };

  return (
    <a
      href={link.href ?? "#"}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-start gap-3.5 group/sidebar py-3 px-3.5 rounded-none transition-all duration-150 cursor-pointer relative uppercase tracking-wider text-xs border border-transparent",
        link.isActive
          ? "bg-white text-black font-bold border-white shadow-[0_2px_12px_rgba(255,255,255,0.2)]"
          : "text-[#B8B8B8] hover:text-white hover:bg-white/[0.06] hover:border-white/10 font-medium",
        className
      )}
      {...props}
    >
      <div className="shrink-0 flex items-center justify-center">
        {link.icon}
      </div>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.15 }}
        className="text-xs whitespace-pre inline-block !p-0 !m-0 tracking-wider font-semibold"
      >
        {link.label}
      </motion.span>
    </a>
  );
};
