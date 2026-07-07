import type { Company, Person } from "@/types/crm";

/**
 * Extracts the username/handle from a social media URL and returns the unavatar.io profile photo URL.
 * Supports: Facebook, Instagram, X (Twitter), LinkedIn, YouTube.
 */
export function getSocialAvatarUrl(type: string, url: string): string | null {
  if (!url) return null;

  try {
    // Basic cleanup of the URL
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const parsedUrl = new URL(cleanUrl);
    const pathname = parsedUrl.pathname;
    // Split pathname into segments, filtering out empty strings
    const parts = pathname.split("/").filter(Boolean);

    if (parts.length === 0) return null;

    let username = "";
    const typeLower = type.toLowerCase();

    if (typeLower === "linkedin") {
      // LinkedIn URLs can be like linkedin.com/in/username or linkedin.com/company/username
      if (parts[0] === "in" || parts[0] === "company") {
        username = parts[1] || "";
      } else {
        username = parts[0];
      }
    } else if (typeLower === "youtube") {
      // YouTube URLs can be like youtube.com/@username, youtube.com/c/username, youtube.com/channel/id
      if (parts[0].startsWith("@")) {
        username = parts[0];
      } else if (parts[0] === "c" || parts[0] === "user") {
        username = parts[1] || "";
      } else {
        username = parts[0];
      }
    } else {
      // Facebook, Instagram, X (Twitter)
      username = parts[0];
    }

    if (!username) return null;

    // Remove any query params (e.g. ?ref=...) or hashes
    username = username.split(/[?#]/)[0];

    const providerMap: Record<string, string> = {
      facebook: "facebook",
      instagram: "instagram",
      x: "twitter",
      twitter: "twitter",
      linkedin: "linkedin",
      youtube: "youtube",
    };

    const provider = providerMap[typeLower] || typeLower;
    return `https://unavatar.io/${provider}/${username}`;
  } catch (e) {
    console.error(`[getSocialAvatarUrl] Failed to parse URL: ${url}`, e);
    return null;
  }
}

/**
 * Resolves a Person's profile photo URL. If a social media account has "useProfilePhoto" enabled,
 * it attempts to parse the URL and return the unavatar.io URL. Otherwise, it returns the custom uploaded photoUrl.
 */
export function getPersonPhotoUrl(person?: Person | null): string | null {
  if (!person) return null;

  if (person.socialMedia && person.socialMedia.length > 0) {
    const useSocialPhoto = person.socialMedia.find((sm) => sm.useProfilePhoto);
    if (useSocialPhoto) {
      const socialAvatar = getSocialAvatarUrl(useSocialPhoto.type, useSocialPhoto.url);
      if (socialAvatar) return socialAvatar;
    }
  }

  return person.photoUrl || null;
}

/**
 * Resolves a Company's logo URL. If a social media account has "useProfilePhoto" enabled,
 * it attempts to parse the URL and return the unavatar.io URL. Otherwise, it returns the custom uploaded logoUrl.
 */
export function getCompanyLogoUrl(company?: Company | null): string | null {
  if (!company) return null;

  if (company.socialMedia && company.socialMedia.length > 0) {
    const useSocialPhoto = company.socialMedia.find((sm) => sm.useProfilePhoto);
    if (useSocialPhoto) {
      const socialAvatar = getSocialAvatarUrl(useSocialPhoto.type, useSocialPhoto.url);
      if (socialAvatar) return socialAvatar;
    }
  }

  return company.logoUrl || null;
}
