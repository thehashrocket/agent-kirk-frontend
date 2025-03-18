/**
 * @file src/components/ui/dialog.tsx
 * A collection of accessible dialog components built on top of Radix UI's Dialog primitive.
 * These components provide a modal dialog that can be triggered, with overlay, content management,
 * and proper accessibility features built-in.
 */

"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * @component Dialog
 * @path src/components/ui/dialog.tsx
 * Root dialog component that manages the open/closed state of the dialog.
 * Wraps Radix UI's Dialog.Root with additional data attributes for styling.
 */
function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

/**
 * @component DialogTrigger
 * @path src/components/ui/dialog.tsx
 * Button component that triggers the dialog to open when clicked.
 * Should be wrapped inside a Dialog component.
 */
function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

/**
 * @component DialogPortal
 * @path src/components/ui/dialog.tsx
 * Portals the dialog content to the end of the document body.
 * Ensures proper stacking context and accessibility.
 */
function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

/**
 * @component DialogClose
 * @path src/components/ui/dialog.tsx
 * Button component that closes the dialog when clicked.
 * Should be placed inside DialogContent.
 */
function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

/**
 * @component DialogOverlay
 * @path src/components/ui/dialog.tsx
 * Semi-transparent overlay that covers the page behind the dialog.
 * Provides visual focus and prevents interaction with the page while dialog is open.
 */
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

/**
 * @component DialogContent
 * @path src/components/ui/dialog.tsx
 * Main container for dialog content with built-in animations and positioning.
 * Includes a close button and proper focus management.
 * Should contain DialogHeader and optionally DialogFooter.
 */
function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

/**
 * @component DialogHeader
 * @path src/components/ui/dialog.tsx
 * Container for dialog header content with responsive text alignment.
 * Typically contains DialogTitle and optionally DialogDescription.
 */
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

/**
 * @component DialogFooter
 * @path src/components/ui/dialog.tsx
 * Container for dialog footer content with responsive button layout.
 * Typically contains action buttons like "Cancel" and "Submit".
 */
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * @component DialogTitle
 * @path src/components/ui/dialog.tsx
 * Accessible heading component for the dialog title.
 * Should be placed inside DialogHeader.
 */
function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

/**
 * @component DialogDescription
 * @path src/components/ui/dialog.tsx
 * Accessible description component for the dialog.
 * Should be placed inside DialogHeader after DialogTitle.
 */
function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
