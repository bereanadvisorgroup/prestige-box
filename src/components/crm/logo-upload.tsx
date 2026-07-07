"use client";

import { useRef, useState } from "react";

import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FirmLogo } from "@/components/crm/firm-logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase.client";

interface LogoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  entityId?: string;
  entityType: string; // e.g. "accounting-firms", "money-managers"
  name: string;
}

export function LogoUpload({ value, onChange, entityId, entityType, name }: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);

      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid image (JPEG, PNG, GIF, or WebP).");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be under 2MB.");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const folderId = entityId || crypto.randomUUID();
      const filePath = `${entityType}/${folderId}/${Date.now()}-logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Clean up old logo if it was in avatars bucket for this entity
      if (value?.includes("/avatars/") && value.includes(`${entityType}/`)) {
        try {
          const oldPath = value.split("/public/avatars/")[1];
          if (oldPath) {
            await supabase.storage.from("avatars").remove([oldPath]);
          }
        } catch (removeErr) {
          console.warn("Could not clean up old logo file:", removeErr);
        }
      }

      onChange(publicUrl);
      toast.success("Logo uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload logo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (value?.includes("/avatars/") && value.includes(`${entityType}/`)) {
      try {
        const oldPath = value.split("/public/avatars/")[1];
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      } catch (removeErr) {
        console.warn("Could not delete logo from storage:", removeErr);
      }
    }
    onChange(null);
    toast.success("Logo removed!");
  };

  return (
    <div className="flex flex-col items-center gap-6 border-muted/50 border-b pb-6 sm:flex-row">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-2 border-muted-foreground/30 border-dashed transition-all duration-300 hover:border-primary/50 hover:bg-accent/40"
        aria-label="Upload logo"
        disabled={isUploading}
      >
        <FirmLogo logoUrl={value} name={name} className="h-[88px] w-[88px]" size="lg" />

        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
          <span className="mt-1 font-medium text-[9px] text-white">Upload Logo</span>
        </div>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
            <span className="h-5 w-5 animate-spin rounded-full border-primary border-b-2" />
          </div>
        )}
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await handleFileUpload(file);
        }}
        accept="image/*"
        className="hidden"
      />

      <div className="flex flex-col gap-1.5 text-center sm:text-left">
        <h4 className="font-semibold text-sm">Logo</h4>
        <p className="text-muted-foreground text-xs">Click the avatar to upload a logo (JPEG, PNG, up to 2MB).</p>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveLogo}
            className="mt-1 h-7 w-fit gap-1.5 border-red-200 text-red-600 transition-all duration-300 hover:bg-red-50 hover:text-red-600 dark:border-red-950 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-3 w-3" />
            Remove Logo
          </Button>
        )}
      </div>
    </div>
  );
}
